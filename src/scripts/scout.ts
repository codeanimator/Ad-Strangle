require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });

const { adScoutAgent } = require('../agents/AdScout');
const minimist = require('minimist');

async function main() {
  const args = minimist(process.argv.slice(2));
  const url = args.url;

  if (!url) {
    console.error('❌ Error: URL is required.');
    console.log('Usage: npm run scout -- --url="https://example.com"');
    process.exit(1);
  }

  console.log(`\n🚀 [AdScout CLI] Initiating mission for: ${url}`);

  try {
    const result = await adScoutAgent.startScanningSession(url);
    console.log('\n✅ Mission Accomplished!');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Mission Failed:', error);
    process.exit(1);
  }
}

main();
