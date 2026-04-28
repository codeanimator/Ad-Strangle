import { adScoutAgent } from '../agents/AdScout';

async function run() {
  console.log("Starting simple scan...");
  try {
    const r = await adScoutAgent.startScanningSession("https://example.com");
    console.log("Result:", JSON.stringify(r, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
