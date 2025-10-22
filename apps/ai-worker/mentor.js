/* ==========================================================
   Desktop4Kids — AI Mentor (Sidebar Script)
   - Streams replies via window.ai.askMentor(...)
   - “Teach, not do” guardrails
   - Saves chat to localStorage (mentorHistory)
========================================================== */

(() => {
  'use strict';

  // --- DOM
  const chat       = document.getElementById('chat');
  const form       = document.getElementById('composer');
  const q          = document.getElementById('q');
  const subjectSel = document.getElementById('subject');
  const levelSel   = document.getElementById('level');
  const mCoach     = document.getElementById('mCoach');
  const mExplain   = document.getElementById('mExplain');
  const btnClear   = document.getElementById('btnClear');

  // --- Init from URL
  const p = new URLSearchParams(location.search);
  const initSubject = p.get('subject') || '';
  const initLevel   = p.get('level') || '';
  const modeDefault = (p.get('mode') === 'explain') ? 'explain' : 'coach';
  if (initSubject) subjectSel.value = initSubject;
  if (initLevel)   levelSel.value   = initLevel;
  setMode(modeDefault);

  // --- Theme sync from parent
  try {
    const t = window.top?.document?.documentElement?.getAttribute('data-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch {}
  window.addEventListener('message', (e) => {
    const d = e?.data || {};
    if (d.type === 'theme' && d.theme) {
      document.documentElement.setAttribute('data-theme', d.theme);
    } else if (d.type === 'mentor:ask' && d.payload) {
      const { subject, level, question, work, mode } = d.payload;
      if (subject) subjectSel.value = subject;
      if (level)   levelSel.value   = level;
      if (mode)    setMode(mode);
      askMentor({ question, work });
    }
  });

  // --- Modes
  [mCoach, mExplain].forEach(btn => btn?.addEventListener('click', () => setMode(btn.dataset.mode)));
  function setMode(m) {
    const coach = (m !== 'explain');
    mCoach?.classList.toggle('active', coach);
    mExplain?.classList.toggle('active', !coach);
  }
  function getMode() { return mCoach?.classList.contains('active') ? 'coach' : 'explain'; }

  // --- History helpers (localStorage)
  const HISTORY_KEY = 'mentorHistory';
  function loadHistory(){ try { return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]'); } catch { return []; } }
  function saveHistory(arr){ localStorage.setItem(HISTORY_KEY, JSON.stringify(arr)); }
  function pushHistory(role, text){
    const arr = loadHistory();
    arr.push({
      role,
      text,
      time: new Date().toISOString(),
      subject: subjectSel?.value || '',
      level:   levelSel?.value   || '',
      mode:    getMode()
    });
    saveHistory(arr);
  }

  // --- Styled confirm that prefers global app dialog
  async function confirmMentor(message) {
    // 1) Desktop/global confirm?
    if (window.top?.desktop?.dialogs?.confirm) {
      return await window.top.desktop.dialogs.confirm({ message });
    }
    if (window.top?.showConfirm) {
      return await window.top.showConfirm(message);
    }
    // 2) Local themed <dialog>
    const dlg = document.getElementById('mentorConfirm');
    if (dlg) {
      return await new Promise((resolve) => {
        const msg = dlg.querySelector('.mc__message');
        const yes = dlg.querySelector('.mc__yes');
        const no  = dlg.querySelector('.mc__no');
        msg.textContent = message;
        const onYes = () => { cleanup(); resolve(true);  };
        const onNo  = () => { cleanup(); resolve(false); };
        const cleanup = () => {
          yes.removeEventListener('click', onYes);
          no.removeEventListener('click', onNo);
          dlg.close();
        };
        yes.addEventListener('click', onYes);
        no.addEventListener('click', onNo);
        dlg.showModal();
      });
    }
    // 3) Native fallback
    return window.confirm(message);
  }

  // --- Clear button
  btnClear?.addEventListener('click', async () => {
    const ok = await confirmMentor('Clear this conversation?');
    if (!ok) return;
    chat.innerHTML = '';
    localStorage.removeItem(HISTORY_KEY);
  });

  // --- UI helpers
  function sanitize(s = '') {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\n/g,'<br>');
  }
  function addMsg(kind, text, small = '') {
    const box = document.createElement('div');
    box.className = `msg ${kind}`;
    box.innerHTML = sanitize(text) + (small ? `<div class="small">${sanitize(small)}</div>` : '');
    chat.appendChild(box);
    chat.scrollTop = chat.scrollHeight;
    if (kind === 'user') pushHistory('student', String(text || ''));
    return box;
  }
  function ensureYourTurn(s) {
    const t = String(s || '').trim();
    return /your turn:?$/i.test(t) ? t : (t + '\n\nYour turn:');
  }
  function decorateQuestion(txt, mode) {
    if (mode === 'explain') {
      return `${txt}\n\nPlease explain clearly in 3–5 short steps. End with "Your turn:" and a reflection question.`;
    }
    return `${txt}\n\nIMPORTANT: Ask one small guiding question. Give a hint, not the full answer. End with "Your turn:".`;
  }
  function trimWork(s, max = 1200) {
    if (!s) return '';
    s = String(s);
    return s.length > max ? s.slice(-max) : s;
  }

  // --- Ask flow
  async function askMentor({ question, work }) {
    if (!question?.trim()) return;

    addMsg('user', question);
    q.value = '';

    const subject = subjectSel?.value || '';
    const level   = levelSel?.value   || '';
    const mode    = getMode();

    const thinking = addMsg('bot cursor', '');

    const api = window.ai || window.top?.ai;
    if (!api?.askMentor) {
      thinking.classList.remove('cursor');
      thinking.innerHTML = sanitize("Mentor isn't ready. (Missing window.ai.askMentor bridge)");
      return;
    }

    const payload = {
      subject, level, mode,
      question: decorateQuestion(question, mode),
      work: trimWork(work),
    };

    let full = '';
    try {
      await api.askMentor(payload, (chunk) => {
        full += chunk;
        thinking.innerHTML = sanitize(full);
        chat.scrollTop = chat.scrollHeight;
      });
    } catch (err) {
      thinking.classList.remove('cursor');
      thinking.innerHTML = sanitize('Error talking to Mentor: ' + (err?.message || err));
      return;
    }

    const finalText = ensureYourTurn(full);
    thinking.classList.remove('cursor');
    thinking.classList.remove('bot'); // keep class list tidy
    thinking.classList.add('bot');
    thinking.innerHTML = sanitize(finalText);
    pushHistory('mentor', finalText);
  }

  // --- Auto-welcome on open ---------------------------------
const WELCOME_MSG = 'Welcome back! Are you ready to learn?';

function showWelcomeOncePerOpen() {
  // Only greet if the chat is visually empty (avoids duplicating after a send)
  if (!chat || chat.childElementCount > 0) return;
  addMsg('bot', WELCOME_MSG);
  // Log as mentor message so parents can see the greeting too
  pushHistory('mentor', WELCOME_MSG);
}

// Run after the current tick so DOM is ready and helpers exist
queueMicrotask(showWelcomeOncePerOpen);

  // --- Submit
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    askMentor({ question: q.value, work: '' });
  });

})();
