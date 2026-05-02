import { NextResponse } from 'next/server';
import { adScoutAgent } from '@/agents/AdScout';

/**
 * API Route: /api/scan
 * Triggers the AdScout agent to scan a target URL.
 */
export async function POST(request: Request) {
  try {
    const { targetUrl } = await request.json();

    if (!targetUrl) {
      return NextResponse.json({ error: 'Target URL is required' }, { status: 400 });
    }

    // URL Sanitization: Remove double https and trim whitespace
    let cleanUrl = targetUrl.trim().replace(/^https?:\/\/\s*https?:\/\//, 'https://');
    if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;

    console.log(`[API] Received scan request for: ${cleanUrl}`);
    
    // Start the scanning session
    const result = await adScoutAgent.startScanningSession(cleanUrl);

    return NextResponse.json({
      message: 'Scan completed successfully',
      data: result
    });

  } catch (error: any) {
    console.error(`[API] Scan failed:`, error);
    return NextResponse.json({ 
      error: 'Failed to complete scan session',
      details: error.message 
    }, { status: 500 });
  }
}
