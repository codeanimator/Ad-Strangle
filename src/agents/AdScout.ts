import { chromium, Browser, Request, Response, Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../lib/firebase/config";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";

export interface Evidence {
  targetUrl: string;
  adProvider: string;
  requestUrl: string;
  timestamp: string;
}

export interface ScanResult {
  url: string;
  timestamp: string;
  violationsFound: number;
  details: string[];
  status: 'Clean' | 'Suspicious' | 'Violation';
  evidenceCaptured?: number;
  visionConfirmation?: boolean;
  redirectsCaptured?: number;
}

export class AdScout {
  private browser: Browser | null = null;
  private readonly evidenceFile = path.join(process.cwd(), 'evidence.json');
  private genAI: GoogleGenerativeAI;

  constructor(public readonly name: string = 'AdScout') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn(`[SCANNER-CORE] ⚠️ Warning: GEMINI_API_KEY is not set.`);
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  private async ensureBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
      });
    }
  }

  async startScanningSession(targetUrl: string): Promise<ScanResult> {
    await this.ensureBrowser();
    
    const context = await this.browser!.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true
    });

    await context.route('**/*', (route, request) => {
      const url = request.url();
      if (request.resourceType() === 'image' || url.match(/\.(jpg|png|gif|jpeg|webp)$/i) || url.includes('tmdb.org')) {
        return route.abort(); 
      }
      route.continue();
    });

    const popups: Page[] = [];
    const redirectTracker = new Map<Page, string>();
    let firestoreDocId: string | null = null;

    context.on('page', (popup) => {
      console.log(`[SCANNER-CORE] 🚨 New redirect stream detected: ${popup.url()}`);
      popups.push(popup);

      popup.on('response', (response: Response) => {
        const url = response.url();
        const status = response.status();
        const location = response.headers()['location'];
        
        if ((status >= 300 && status < 400 && location) || url.includes('turnhub') || url.includes('phaseganging')) {
          console.log(`[SCANNER-CORE] 🕵️ Header Intercepted: ${location || url}`);
          if (location) redirectTracker.set(popup, location);
        }
      });
    });

    const page = await context.newPage();
    const startTime = Date.now();
    const MAX_DURATION = 85000; 

    console.log(`[SCANNER-CORE] 🎯 Telemetry Initiated for Target: ${targetUrl}`);
    
    try {
      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      } catch (e) {
        return { url: targetUrl, timestamp: new Date().toLocaleString(), violationsFound: 0, details: ['Unreachable'], status: 'Clean' };
      }
      
      const screenshotSource = `source-${Date.now()}.png`;
      await page.screenshot({ path: path.join(process.cwd(), 'public', 'screenshots', screenshotSource) });

      firestoreDocId = await this.createFirestoreEntry({
        brand: 'ANALYZING DESTINATION HEADERS',
        url: targetUrl,
        screenshot_source: `/screenshots/${screenshotSource}`,
        trackerImg: '',
        destImg: '',
        path: []
      });

      await new Promise(resolve => setTimeout(resolve, 8000));
      await page.click('body').catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 3000));
      await page.mouse.click(640, 400);

      for (const popup of popups) {
        let screenshotTracker = '';
        let redirectPath: string[] = [];
        const trackerKeywords = ['turnhub', 'phaseganging', 'tracking', 'clk', 'redirect'];

        for (let attempt = 0; attempt < 10; attempt++) {
          if (Date.now() - startTime > MAX_DURATION) break;

          const currentUrl = popup.url();
          if (currentUrl !== 'about:blank' && !redirectPath.includes(currentUrl)) {
             redirectPath.push(currentUrl);
          }

          const content = await popup.content().catch(() => '');
          if (content.includes('Error 522') || content.includes('cloudflare')) {
             console.log(`[SCANNER-CORE] 📸 Evidence Captured: Cloudflare 522 Proof`);
             screenshotTracker = `tracker-${Date.now()}.png`;
             await popup.screenshot({ path: path.join(process.cwd(), 'public', 'screenshots', screenshotTracker) });
             
             if (firestoreDocId) {
                await this.updateFirestoreEntry(firestoreDocId, {
                   screenshot_tracker: `/screenshots/${screenshotTracker}`,
                   brandName: 'Intermediary Tracker (522 State)',
                   redirectPath: redirectPath
                });
             }

             const sniffedLocation = redirectTracker.get(popup);
             if (sniffedLocation) {
                console.log(`[SCANNER-CORE] 🚀 Forced Navigation: ${sniffedLocation}`);
                await popup.goto(sniffedLocation, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
                continue;
             }
             break; 
          }

          if (!screenshotTracker && trackerKeywords.some(kw => currentUrl.toLowerCase().includes(kw))) {
             screenshotTracker = `tracker-${Date.now()}.png`;
             await popup.screenshot({ path: path.join(process.cwd(), 'public', 'screenshots', screenshotTracker) });
             if (firestoreDocId) {
                await this.updateFirestoreEntry(firestoreDocId, {
                   screenshot_tracker: `/screenshots/${screenshotTracker}`,
                   brandName: 'Intermediary Hijack Node',
                   redirectPath: redirectPath
                });
             }
          }

          const sniffedLocation = redirectTracker.get(popup);
          if (sniffedLocation && !trackerKeywords.some(kw => sniffedLocation.toLowerCase().includes(kw)) && currentUrl !== sniffedLocation) {
             console.log(`[SCANNER-CORE] 🚀 Autonomous Navigation to Target: ${sniffedLocation}`);
             await popup.goto(sniffedLocation, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
             continue;
          }

          try { await popup.waitForLoadState('networkidle', { timeout: 5000 }); } catch (e) {}
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          if (!trackerKeywords.some(kw => popup.url().toLowerCase().includes(kw)) && popup.url() !== 'about:blank') {
             const screenshotDest = `dest-${Date.now()}.png`;
             await popup.screenshot({ path: path.join(process.cwd(), 'public', 'screenshots', screenshotDest) });
             const visionResult = await this.analyzeWithHeuristicEngine(path.join(process.cwd(), 'public', 'screenshots', screenshotDest));
             
             if (firestoreDocId) {
                await this.updateFirestoreEntry(firestoreDocId, {
                   brandName: visionResult.brand,
                   screenshot_destination: `/screenshots/${screenshotDest}`,
                   evidenceImage: `/screenshots/${screenshotDest}`,
                   status: 'Escalated',
                   pirateUrl: popup.url()
                });
             }
             break;
          }
        }
      }

      return { url: targetUrl, timestamp: new Date().toLocaleString(), violationsFound: popups.length, details: [], status: 'Violation' };

    } catch (error) {
      console.error(`[SCANNER-CORE] ❌ Internal Error:`, error);
      throw error;
    } finally {
      await page.close();
      for (const p of popups) await p.close().catch(() => {});
      await context.close();
    }
  }

  private async analyzeWithHeuristicEngine(imagePath: string): Promise<{ isViolation: boolean, brand: string }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const prompt = "Identify the commercial entity in this forensic screenshot. JSON output: { \"brand\": \"string\" }";
      const imageBuffer = fs.readFileSync(imagePath);
      const result = await model.generateContent([prompt, { inlineData: { data: imageBuffer.toString("base64"), mimeType: "image/png" } }]);
      const response = await result.response;
      const jsonMatch = response.text().match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { isViolation: true, brand: 'Unidentified Entity' };
    } catch (error) {
      return { isViolation: true, brand: 'Unidentified Entity' };
    }
  }

  private async createFirestoreEntry(data: any) {
    try {
      const docRef = await addDoc(collection(db, "violations"), {
        ...data,
        timestamp: serverTimestamp(),
        status: "Pending",
        source: 'Heuristic Engine'
      });
      console.log(`[PROTECTOR-DB] Write Success: ${docRef.id}`);
      return docRef.id;
    } catch (e) {
      return null;
    }
  }

  private async updateFirestoreEntry(id: string, updateData: any) {
    try {
      await updateDoc(doc(db, "violations", id), updateData);
      console.log(`[PROTECTOR-DB] Entry Synchronized: ${id}`);
    } catch (e) {}
  }

  async stop() { if (this.browser) await this.browser.close(); }
}

export const adScoutAgent = new AdScout();
