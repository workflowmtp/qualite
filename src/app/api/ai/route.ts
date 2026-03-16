import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    const n8nUser = process.env.N8N_BASIC_USER;
    const n8nPass = process.env.N8N_BASIC_PASS;

    if (!n8nUrl) {
      return NextResponse.json({ error: 'N8N webhook not configured' }, { status: 500 });
    }

    const payload = JSON.stringify(body);
    const credentials = (n8nUser && n8nPass)
      ? Buffer.from(`${n8nUser}:${n8nPass}`).toString('base64')
      : null;

    // Try multiple auth strategies for n8n compatibility
    const strategies = [
      // Strategy 1: Basic Auth header
      credentials ? { 'Content-Type': 'application/json', 'Authorization': `Basic ${credentials}` } : null,
      // Strategy 2: No auth (webhook-test mode often doesn't require auth)
      { 'Content-Type': 'application/json' },
    ].filter(Boolean) as Record<string, string>[];

    let response: Response | null = null;
    let data = '';

    for (const headers of strategies) {
      console.log('[N8N] Trying webhook with headers:', Object.keys(headers).join(', '));
      response = await fetch(n8nUrl, { method: 'POST', headers, body: payload });
      data = await response.text();
      console.log('[N8N] Response status:', response.status, '| Body:', data.substring(0, 300));

      // If success or not an auth error, stop trying
      if (response.ok || (!data.includes('Authorization') && response.status !== 401 && response.status !== 403)) {
        break;
      }
      console.log('[N8N] Auth failed, trying next strategy...');
    }

    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = { output: data };
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[N8N] Webhook error:', message);
    return NextResponse.json({ error: 'Erreur de communication avec l\'agent IA', details: message }, { status: 500 });
  }
}
