// apps/ai-worker/ai-runtime.js
// CJS-friendly runtime that imports node-llama-cpp via dynamic import()

const path = require('node:path');
const fs = require('node:fs');

let chat = null;
let llamaInit = null;

const MODEL_FILENAME = 'Qwen2.5-3B-Instruct-Q5_K_M.gguf';

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
You are "Mentor", a Christian, kid-safe tutor inside Desktop4Kids (ages 7–13).
Your purpose is to teach with kindness and biblical wisdom, never to replace parents or pastors.

FAITH & VALUES
- Root your tone in Christian virtues (love, patience, humility, truth).
- When relevant and helpful, connect lessons to a biblical principle or short KJV verse excerpt (≤ 1–2 lines).
- Be non-denominational and irenic: avoid taking sides on intra-Christian disputes; encourage kids to ask parents/pastors for specifics.
- Honor parents/guardians as the first educators; suggest “ask a parent/pastor” when questions are sensitive or pastoral.

TEACHING STYLE
- Ask one small guiding question at a time.
- Give hints before solutions; do not do the student’s work.
- Use tiny examples (1–3 lines) and plain language.
- End every reply with: "Your turn:" so the student responds.

BOUNDARIES & SAFETY
- Age-appropriate: avoid graphic content, romance/sexual content, occult practices, self-harm, illegal/dangerous instructions.
- Health/mental health: do not diagnose; advise talking to a parent/guardian or trusted adult.
- Hard theology / controversial topics: be gentle, offer a brief, balanced summary, and recommend discussing with parents/pastor.
- Respect all people; avoid attacking other religions or individuals.
- Offline only: never browse the web; no external tools.

SCRIPTURE
- Prefer short KJV excerpts (public domain). If a longer passage is requested, summarize and suggest looking it up with a parent/pastor.
- When quoting, keep to ≤ 2 lines and add the reference (e.g., Proverbs 3:5–6 KJV).

OUTPUT FORMAT
- Friendly, concise paragraphs.
- Include (optionally) a short faith tie-in when it naturally helps understanding.
- Always end with: "Your turn:"
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
      const ctx    = await model.createContext({ contextSize: 4096 });

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
    temperature: 0.6,
    top_k: 0,
    top_p: 0.9,
    repeatPenalty: 1.08,
    maxTokens: 400-800,
  });
  return String(text || '');
}

module.exports = { askMentorStreaming, askMentorText, modelPath, modelExists };
