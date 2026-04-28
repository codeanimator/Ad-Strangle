import { NextResponse } from 'next/server';
import { adScoutAgent } from '../../../agents/AdScout';
import { db } from '../../../lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const KNOWN_PIRATE_POOLS: Record<string, string[]> = {
  'physics wallah': [
    'https://new7.hdhub4u.fo/',
    'https://t.me/s/pw_leaked_lectures',
    'https://free-course-site.com/'
  ],
  'deadpool': [
    'https://streameast.to',
    'https://soap2day.rs',
    'https://hdtoday.tv',
    'https://flixhq.to'
  ],
  'ipl': [
    'https://streameast.to',
    'https://cricfree.live',
    'https://crichd.tv',
    'https://totalsportek.pro'
  ]
};

export async function POST(req: Request) {
  try {
    const { assetName } = await req.json();
    if (!assetName) {
      return NextResponse.json({ error: 'Asset name is required' }, { status: 400 });
    }

    console.log(`[Search & Destroy] 🕵️‍♂️ Initiating search for: ${assetName}`);
    
    // Simulate search delay for realism in the UI demo
    await new Promise(resolve => setTimeout(resolve, 2000));

    let sites: string[] = [];
    const normalizedAsset = assetName.toLowerCase();
    
    // Phase 1: Reliable Search (Hardcoded Demo Mode)
    for (const key of Object.keys(KNOWN_PIRATE_POOLS)) {
      if (normalizedAsset.includes(key)) {
        sites = KNOWN_PIRATE_POOLS[key];
        console.log(`[Search & Destroy] 🎯 Found ${sites.length} hardcoded targets for: ${key}`);
        break;
      }
    }

    // Generic fallback if not a special keyword
    if (sites.length === 0) {
      sites = [
        'https://new7.hdhub4u.fo/',
        'https://streameast.to',
        'https://fmovies24.to'
      ];
      console.log(`[Search & Destroy] 🎯 Using generic fallback targets.`);
    }

    // Phase 2: Log Discovery Session to Firestore
    const docRef = await addDoc(collection(db, 'discoveries'), {
      assetName,
      targets: sites,
      timestamp: serverTimestamp(),
      status: 'Active'
    });

    // Phase 3: Background Scan Execution (Fire and Forget)
    (async () => {
      console.log(`[Search & Destroy] 🚀 Launching background fleet for ${sites.length} targets...`);
      for (const site of sites) {
        try {
          await adScoutAgent.startScanningSession(site);
        } catch (e) {
          console.error(`[Search & Destroy] ❌ Scan failed for ${site}:`, e);
        }
      }
      console.log(`[Search & Destroy] ✅ Fleet mission complete for: ${assetName}`);
    })();

    return NextResponse.json({ 
      success: true, 
      discoveryId: docRef.id,
      targetsCount: sites.length,
      targets: sites
    });

  } catch (error: any) {
    console.error('Search & Destroy API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
