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
  } catch (e) { console.error('Agent request failed', e); return Response.json({ error: 'Agent request failed' }, { status: 500 }); }
}
