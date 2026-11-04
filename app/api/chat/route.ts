import OpenAI from 'openai';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  const secret = process.env.WORKSPACE_SECRET;
  if (!secret) return Response.json({ error: 'Workspace not configured' }, { status: 503 });
  if (req.headers.get('x-workspace-secret') !== secret) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: 'OpenAI API key not configured' }, { status: 503 });
  try {
    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length > 40 || JSON.stringify(messages).length > 45000 || messages.some((m: any) => !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string')) return Response.json({ error: 'Invalid conversation' }, { status: 400 });
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await client.chat.completions.create({ model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', messages: [{ role: 'system', content: 'You are the OpenAI development agent for Emulator AI Lab. Never claim to have executed tools, read repositories, or communicated with Instinct AI unless verified. Instinct AI is disconnected.' }, ...messages], max_completion_tokens: 1200 });
    return Response.json({ reply: result.choices[0]?.message?.content || 'No response.' });
  } catch (e: unknown) {
    const status = typeof e === 'object' && e !== null && 'status' in e ? Number((e as {status?: unknown}).status) : 0;
    console.error('Agent request failed', { status, type: e instanceof Error ? e.name : 'unknown' });
    if (status === 401) return Response.json({ error: 'OpenAI rejected the API key (401). Check the key in Vercel.' }, { status: 502 });
    if (status === 429) return Response.json({ error: 'OpenAI rate limit or insufficient API quota (429). Check API billing and limits.' }, { status: 502 });
    if (status === 403) return Response.json({ error: 'OpenAI denied access (403). Check project and model permissions.' }, { status: 502 });
    if (status === 404) return Response.json({ error: 'OpenAI model unavailable (404). Check OPENAI_MODEL.' }, { status: 502 });
    return Response.json({ error: 'OpenAI request failed. Check API status, billing, and Vercel logs.' }, { status: 502 });
  }
}
