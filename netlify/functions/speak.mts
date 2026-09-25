import type { Context, Config } from "@netlify/functions";

/**
 * BLAIR · ElevenLabs speech
 *
 * Only ELEVENLABS_API_KEY is required. If ELEVENLABS_VOICE_ID is not set,
 * the function asks ElevenLabs which voices the account has and picks a
 * sensible one for BLAIR, then reuses it for the life of the instance.
 *
 * Optional:
 *   ELEVENLABS_VOICE_ID   pin a specific voice
 *   ELEVENLABS_MODEL_ID   default eleven_multilingual_v2
 */

const MAX_CHARS = 1200;
const API = "https://api.elevenlabs.io/v1";

/** Fallback order if no voice is pinned. ELEVENLABS_VOICE_ID always wins,
 *  and pinning it is the only way to guarantee the voice BLATW picked. */
const PREFERRED = ["jessica", "sarah", "matilda", "rachel", "lily", "alice", "charlotte"];

let resolvedVoice: string | null = null;

async function listVoices(key: string) {
  const res = await fetch(`${API}/voices`, { headers: { "xi-api-key": key } });
  if (!res.ok) throw new Error(`voices ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return (data?.voices ?? []) as Array<{ voice_id: string; name: string; category?: string }>;
}

async function pickVoice(key: string): Promise<string | null> {
  if (resolvedVoice) return resolvedVoice;
  const pinned = Netlify.env.get("ELEVENLABS_VOICE_ID");
  if (pinned) { resolvedVoice = pinned.trim(); return resolvedVoice; }

  const voices = await listVoices(key);
  if (!voices.length) return null;

  // A voice the account cloned itself beats a stock one.
  const cloned = voices.find((v) => v.category === "cloned" || v.category === "professional");
  if (cloned) { resolvedVoice = cloned.voice_id; return resolvedVoice; }

  for (const want of PREFERRED) {
    const hit = voices.find((v) => (v.name || "").toLowerCase().includes(want));
    if (hit) { resolvedVoice = hit.voice_id; return resolvedVoice; }
  }
  resolvedVoice = voices[0].voice_id;
  return resolvedVoice;
}

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  const key = Netlify.env.get("ELEVENLABS_API_KEY");

  /* Which voices does this account have? Names and ids only — never the key. */
  if (url.pathname.endsWith("/voices")) {
    if (!key) return Response.json({ ok: false, error: "ELEVENLABS_API_KEY is not set on this site" }, { status: 503 });
    try {
      const voices = await listVoices(key);
      return Response.json({
        ok: true,
        pinned: Netlify.env.get("ELEVENLABS_VOICE_ID") ?? null,
        using: await pickVoice(key),
        voices: voices.map((v) => ({ id: v.voice_id, name: v.name, category: v.category ?? null })),
      });
    } catch (e) {
      return Response.json({ ok: false, error: String((e as Error).message) }, { status: 502 });
    }
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!key) return new Response("ELEVENLABS_API_KEY is not set on this site.", { status: 503 });

  let text = "";
  try {
    const body = await req.json();
    text = typeof body?.text === "string" ? body.text.trim() : "";
  } catch {
    return new Response("Expected JSON { text }", { status: 400 });
  }
  if (!text) return new Response("Nothing to say", { status: 400 });
  if (text.length > MAX_CHARS) return new Response(`Text over ${MAX_CHARS} characters`, { status: 413 });

  let voice: string | null;
  try {
    voice = await pickVoice(key);
  } catch (e) {
    console.error("voice lookup failed", e);
    return new Response("Could not reach ElevenLabs to choose a voice.", { status: 502 });
  }
  if (!voice) return new Response("This ElevenLabs account has no voices available.", { status: 503 });

  const model = Netlify.env.get("ELEVENLABS_MODEL_ID") ?? "eleven_multilingual_v2";

  const res = await fetch(`${API}/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("elevenlabs tts", res.status, detail.slice(0, 300));
    return new Response(`Speech error ${res.status}`, { status: 502 });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "X-Blair-Voice": voice,
      "Cache-Control": "public, max-age=86400, s-maxage=2592000",
    },
  });
};

export const config: Config = {
  path: ["/api/speak", "/api/voices"],
};
