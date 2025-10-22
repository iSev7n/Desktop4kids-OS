// apps/ai-worker/ai-runtime.js
// CJS-friendly runtime that imports node-llama-cpp via dynamic import()

const path = require('node:path');
const fs = require('node:fs');

let chat = null;
let llamaInit = null;

const MODEL_FILENAME = 'llama-3.2-1b-instruct-q4_k_m.gguf';

// Resolve to <repo>/models/... in dev, and resources/models/... in prod
function devModelPath() {
  // __dirname = <repo>/apps/ai-worker
  // up two levels → <repo>
  return path.join(__dirname, '..', '..', 'models', MODEL_FILENAME);
}
function prodModelPath() {
  // When packaged by Electron
  return path.join(process.resourcesPath || '', 'models', MODEL_FILENAME);
}
function modelPath() {
  const dev = devModelPath();
  if (fs.existsSync(dev)) return dev;
  return prodModelPath();
}
function modelExists() {
  try {
    const p = modelPath();
    const st = fs.statSync(p);
    return st.isFile() && st.size > 0;
  } catch {
    return false;
  }
}

const SYSTEM_PROMPT = `
You are "Mentor", a kid-safe tutor inside Desktop4Kids. You teach, you do not do the work.
Principles:
- Ask one small guiding question at a time.
- Keep language friendly and short (ages 7–13).
- Offer hints before solutions; only reveal tiny pieces if asked.
- Use examples sparingly (tiny, 1–3 lines).
- End with: "Your turn:" so the student responds.
- Never browse the web; never mention external tools.
`.trim();

function buildUserMsg(payload = {}) {
  const { subject = '', level = '', mode = 'coach', question = '', work = '' } = payload;
  return [
    subject && `Subject: ${subject}`,
    level && `Level: ${level}`,
    mode && `Mode: ${mode}`,
    question && `Question: ${question}`,
    work && `Student work:\n${work}`,
    mode === 'explain'
      ? 'Please explain clearly in 3–5 short steps. End with "Your turn:" and a reflection question.'
      : 'Ask one small guiding question and give a hint (not the full answer). End with "Your turn:".',
  ].filter(Boolean).join('\n');
}

// ---------- v3 init path: getLlama -> loadModel -> createContext ----------
async function ensureChat() {
  if (chat) return chat;

  if (!llamaInit) {
    llamaInit = (async () => {
      if (!modelExists()) {
        throw new Error(`Model not found at ${modelPath()}. Put the GGUF at: ${modelPath()}`);
      }

      const raw = await import('node-llama-cpp');
      const mod = raw?.default ?? raw;

      // optional debug — handy during bring-up
      console.log('[mentor/llama ABI]', {
        electron: process.versions.electron,
        node: process.versions.node,
        modules: process.versions.modules,
        platform: process.platform,
        arch: process.arch,
      });

      const llama  = await mod.getLlama(); // will use staged prebuilt or your last local build
      const model  = await llama.loadModel({ modelPath: modelPath() });
      const ctx    = await model.createContext({ contextSize: 2048 });

      chat = new mod.LlamaChatSession({
        contextSequence: ctx.getSequence(),
        systemPrompt: SYSTEM_PROMPT,
      });

      return chat;
    })();
  }

  chat = await llamaInit;
  return chat;
}

/**
 * Preferred: streaming tokens.
 * Returns AsyncIterable<string>
 * (Polyfills streaming if the runtime doesn’t expose promptStreaming)
 */
async function askMentorStreaming(payload = {}) {
  const c = await ensureChat();
  const userMsg = buildUserMsg(payload);

  const opts = {
    temperature: 0.7,
    top_k: 40,
    top_p: 0.95,
    repeatPenalty: 1.1,
    maxTokens: 800,
  };

  if (typeof c.promptStreaming === 'function') {
    return c.promptStreaming(userMsg, opts);
  }

  // Polyfill: yield the one-shot result in small chunks so the UI can stream
  const full = await c.prompt(userMsg, opts);
  async function* chunker(str, n = 48) {
    const s = String(str ?? '');
    for (let i = 0; i < s.length; i += n) {
      yield s.slice(i, i + n);
      await new Promise(r => setTimeout(r, 0));
    }
  }
  return chunker(full);
}

/**
 * Fallback: one-shot text (no streaming).
 * Returns Promise<string>
 */
async function askMentorText(payload = {}) {
  const c = await ensureChat();
  const userMsg = buildUserMsg(payload);
  const text = await c.prompt(userMsg, {
    temperature: 0.7,
    top_k: 40,
    top_p: 0.95,
    repeatPenalty: 1.1,
    maxTokens: 400,
  });
  return String(text || '');
}

module.exports = { askMentorStreaming, askMentorText, modelPath, modelExists };
