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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (n8nUser && n8nPass) {
      const credentials = Buffer.from(`${n8nUser}:${n8nPass}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.text();

    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = { output: data };
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('N8N webhook error:', message);
    return NextResponse.json({ error: 'Erreur de communication avec l\'agent IA', details: message }, { status: 500 });
  }
}
