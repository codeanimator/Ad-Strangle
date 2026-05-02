import { chromium, Browser, Request, Response, Page } from 'playwright';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDb, adminStorage } from "../lib/firebase/admin";
import * as admin from 'firebase-admin';

export interface ScanResult {
  url: string;
  timestamp: string;
  violationsFound: number;
  details: string[];
  status: 'Clean' | 'Suspicious' | 'Violation';
}

export class AdScout {
  private browser: Browser | null = null;
  private genAI: GoogleGenerativeAI;
  private isLocked = false;
  private identifiedBrand = "Analyzing...";
  private finalDestination = "";
  private redirectChain: any[] = [];

  constructor(public readonly name: string = 'AdScout') {
    const apiKey = process.env.GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  private async ensureBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch({ 
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled' // Hides navigator.webdriver bot signal
        ] 
      });
    }
  }

  private async uploadToStorage(buffer: Buffer, fileName: string): Promise<string> {
    if (!adminStorage) {
      console.error("[SCANNER-CORE] ❌ Cloud Storage not initialized. Evidence capture failed.");
      return "";
    }

    try {
      const bucket = adminStorage.bucket();
      const file = bucket.file(`screenshots/${fileName}`);
      
      await file.save(buffer, {
        metadata: { contentType: 'image/png' },
        resumable: false,
      });

      // Construct the Firebase-native Public URL
      return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`;
    } catch (error) {
      console.error("[SCANNER-CORE] ❌ Cloud Upload Failed:", error);
      return "";
    }
  }

  async startScanningSession(targetUrl: string): Promise<ScanResult> {
    await this.ensureBrowser();
    this.isLocked = false;
    this.identifiedBrand = "Analyzing...";
    this.finalDestination = "";
    this.redirectChain = [];
    
    const context = await this.browser!.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/'
      },
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
        
        // 1. Let the browser handle security scripts normally
        if (url.includes('cdn-cgi') || url.includes('challenge-platform')) {
          return;
        }

        // 2. Only "Sniff" and track actual web pages or ad nodes
        if ((status >= 300 && status < 400 && location) || url.includes('turnhub') || url.includes('phaseganging')) {
          console.log(`[SCANNER-CORE] 🕵️ Forensic Header Intercepted: ${location || url}`);
          if (location) redirectTracker.set(popup, location);
        }
      });
    });

    const page = await context.newPage();
    
    // Nuclear Stealth: Mask the automation signal before navigation
    await page.addInitScript(() => {
      // 1. Hide Webdriver
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      
      // 2. Fake Plugins (Headless has 0, real Chrome has many)
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // 3. Force clean User Agent in JS memory
      // @ts-ignore
      navigator.chrome = { runtime: {} };
      // @ts-ignore
      navigator.languages = ['en-US', 'en'];
    });

    const startTime = Date.now();
    const MAX_DURATION = 85000; 

    console.log(`[SCANNER-CORE] 🎯 Telemetry Initiated for Target: ${targetUrl}`);
    
    try {
      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      } catch (e) {
        return { url: targetUrl, timestamp: new Date().toLocaleString(), violationsFound: 0, details: ['Unreachable'], status: 'Clean' };
      }
      
      const bufferSource = await page.screenshot();
      const storageUrlSource = await this.uploadToStorage(bufferSource, `source-${Date.now()}.png`);

      // Using Admin SDK for robust DB writes (prevents gRPC stream crashes)
      firestoreDocId = await this.createFirestoreEntry({
        brandName: 'ANALYZING DESTINATION HEADERS',
        pirateUrl: targetUrl,
        screenshot_source: storageUrlSource,
        status: "Pending",
        source: 'Heuristic Engine'
      });

      await new Promise(resolve => setTimeout(resolve, 8000));
      await page.click('body').catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 3000));
      await page.mouse.click(640, 400);

        for (const popup of popups) {
          let storageUrlTracker = '';
          const trackerKeywords = ['turnhub', 'phaseganging', 'tracking', 'clk', 'redirect'];
  
          // Ad Network Interceptor: Log high-risk nodes for forensic visibility
          popup.on('request', async (request) => {
            const url = request.url();
            // If we find a brand OR a Google Ad, lock the evidence immediately
            if ((url.includes('doubleclick.net') || url.includes('cenovus') || url.includes('googleads')) && !this.isLocked) {
              
              console.log(`[SCANNER-CORE] 🕵️ Forensic Match Intercepted: ${url}`);
              
              // Victory Fix: Force immediate identification and LOCK it
              this.isLocked = true; 
              this.identifiedBrand = url.includes('cenovus') ? "Cenovus Energy" : "Google Ad-Tech Diversion";
              this.finalDestination = url;
  
              if (firestoreDocId) {
                await this.updateFirestoreEntry(firestoreDocId, {
                  brandName: this.identifiedBrand,
                  pirateUrl: this.finalDestination,
                  status: 'Escalated'
                });
              }
  
              this.redirectChain.push({
                node: "Forensic Match",
                url: url,
                evidence: "High-Risk Revenue Diversion",
                timestamp: new Date().toISOString(),
                status: 'Captured'
              });
  
              console.log(`[PROTECTOR-DB] 🔒 Evidence Locked: ${this.identifiedBrand}`);
            }
          });
  
          for (let attempt = 0; attempt < 10; attempt++) {
            if (Date.now() - startTime > MAX_DURATION) break;
  
            const currentUrl = popup.url();
            
            // Force wait for the URL to actually change from the origin before tracking
            if (currentUrl === targetUrl || currentUrl === 'about:blank') {
              try { await popup.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }); } catch (e) {}
              continue; 
            }
  
            if (!this.redirectChain.some(item => item.url === currentUrl)) {
               this.redirectChain.push({
                 type: 'Navigation Hop',
                 url: currentUrl,
                 timestamp: new Date().toISOString()
               });
            }
  
            const content = await popup.content().catch(() => '');
            if (content.includes('Error 522') || content.includes('cloudflare')) {
               console.log(`[SCANNER-CORE] 📸 Evidence Captured: Cloudflare 522 Proof`);
               const bufferTracker = await popup.screenshot();
               storageUrlTracker = await this.uploadToStorage(bufferTracker, `tracker-${Date.now()}.png`);
               
               if (firestoreDocId) {
                  await this.updateFirestoreEntry(firestoreDocId, {
                     screenshot_tracker: storageUrlTracker,
                     brandName: 'Intermediary Tracker (522 State)',
                     redirectChain: this.redirectChain
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
  
            if (!storageUrlTracker && trackerKeywords.some(kw => currentUrl.toLowerCase().includes(kw))) {
               const bufferTracker = await popup.screenshot();
               storageUrlTracker = await this.uploadToStorage(bufferTracker, `tracker-${Date.now()}.png`);
               if (firestoreDocId) {
                  await this.updateFirestoreEntry(firestoreDocId, {
                     screenshot_tracker: storageUrlTracker,
                     brandName: 'Intermediary Hijack Node',
                     redirectChain: this.redirectChain
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
             const bufferDest = await popup.screenshot();
             const storageUrlDest = await this.uploadToStorage(bufferDest, `dest-${Date.now()}.png`);
             
             const visionResult = await this.analyzeWithHeuristicEngine(bufferDest);
             
             if (firestoreDocId) {
                await this.updateFirestoreEntry(firestoreDocId, {
                   // Shield: Prioritize locked brand over vision engine if available
                   brandName: this.isLocked ? this.identifiedBrand : visionResult.brand,
                   screenshot_destination: storageUrlDest,
                   evidenceImage: storageUrlDest,
                   status: 'Escalated',
                   // Shield: Prioritize locked destination URL
                   pirateUrl: this.isLocked ? this.finalDestination : popup.url()
                });
             }
             break;
          }
        }
      }

      if (firestoreDocId) {
        await this.updateFirestoreEntry(firestoreDocId, {
          brandName: this.identifiedBrand !== "Analyzing..." ? this.identifiedBrand : "Unidentified",
          // Shield: Ensure chrome-error never wins the final state
          pirateUrl: (this.finalDestination && !this.finalDestination.includes('chrome-error')) 
                     ? this.finalDestination 
                     : targetUrl,
          redirectChain: this.redirectChain,
          status: "Completed"
        });
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

  private async analyzeWithHeuristicEngine(imageBuffer: Buffer): Promise<{ isViolation: boolean, brand: string }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const prompt = "Identify the commercial entity in this forensic screenshot. JSON output: { \"brand\": \"string\" }";
      const result = await model.generateContent([prompt, { inlineData: { data: imageBuffer.toString("base64"), mimeType: "image/png" } }]);
      const response = await result.response;
      const jsonMatch = response.text().match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { isViolation: true, brand: 'Unidentified Entity' };
    } catch (error) {
      return { isViolation: true, brand: 'Unidentified Entity' };
    }
  }

  private async createFirestoreEntry(data: any) {
    if (!adminDb) return null;
    try {
      const docRef = await adminDb.collection("violations").add({
        ...data,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[PROTECTOR-DB] Hardened Write Success: ${docRef.id}`);
      return docRef.id;
    } catch (e) {
      console.error("[PROTECTOR-DB] Write Failure:", e);
      return null;
    }
  }

  private async updateFirestoreEntry(id: string, updateData: any) {
    if (!adminDb) return;
    try {
      await adminDb.collection("violations").doc(id).update(updateData);
      console.log(`[PROTECTOR-DB] Entry Synchronized: ${id}`);
    } catch (e) {
      console.error("[PROTECTOR-DB] Update Failure:", e);
    }
  }

  async stop() { if (this.browser) await this.browser.close(); }
}

export const adScoutAgent = new AdScout();
