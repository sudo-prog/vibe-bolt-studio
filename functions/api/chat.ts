// Cloudflare Pages Function: restores POST /api/chat for the SPA build.
// Proxies chat completions to the local free gateway (OpenAI-compatible)
// and streams plain-text chunks back to the Vercel AI SDK useChat() client.
interface Env {
  OPENCODE_API_BASE_URL?: string;
  OPENCODE_API_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let messages: unknown;
  try {
    const body = (await request.json()) as { messages?: unknown };
    messages = body.messages;
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const base = (env.OPENCODE_API_BASE_URL || 'http://127.0.0.1:8081').replace(/\/$/, '');
  const apiKey = env.OPENCODE_API_KEY || 'local';

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gemini-3.5-flash',
        messages,
        stream: true,
      }),
    });
  } catch (err: any) {
    return new Response(`Upstream request failed: ${err?.message ?? String(err)}`, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return new Response(`Upstream error ${upstream.status}: ${detail}`, { status: 502 });
  }

  // Transform OpenAI SSE deltas -> raw text chunks expected by useChat().
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const content = json?.choices?.[0]?.delta?.content;
              if (content) controller.enqueue(encoder.encode(content));
            } catch {
              // ignore keep-alive / non-JSON lines
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

export const onRequest = onRequestPost;
