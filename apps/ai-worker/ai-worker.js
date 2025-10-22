/* ==========================================================
   Desktop4Kids — AI Mentor Addon (Sidebar Loader API)
   Usage (inside an app):
     import { createMentorSidebar } from '../../ai-worker/ai-worker.js';
     const sidebar = createMentorSidebar({
       mount: document.getElementById('rightPane'),
       subject: 'Writing',
       level: 'Grade 5',
     });
     sidebar.ask({ question: 'How do I start a mystery story?', work: editor.value });
========================================================== */

export function createMentorSidebar(opts = {}) {
  const {
    mount = document.body,
    subject = '',
    level = '',
    startOpen = true,
    width = 360,
    onOpen,
    onClose,
  } = opts;

  // host container
  const wrap = document.createElement('div');
  wrap.className = 'mentor-host';
  wrap.style.cssText = `
    position: relative;
    width: ${startOpen ? width : 0}px;
    max-width: 100%;
    transition: width .18s ease;
    overflow: hidden;
    border-left: 1px solid var(--line, #222);
    background: var(--bg, #0b0b12);
  `;
  mount.appendChild(wrap);

  // iframe
  const iframe = document.createElement('iframe');
  iframe.src = `../ai-worker/mentor.html?subject=${encodeURIComponent(subject)}&level=${encodeURIComponent(level)}&mode=sidebar`;
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
  iframe.style.cssText = 'border:0;width:100%;height:100%;display:block;';
  wrap.appendChild(iframe);

  // state
  let isOpen = !!startOpen;
  let _id = 0;

  // open/close control
  function open() {
    if (isOpen) return;
    isOpen = true;
    wrap.style.width = width + 'px';
    onOpen && onOpen();
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    wrap.style.width = '0px';
    onClose && onClose();
  }
  function toggle() { (isOpen ? close : open)(); }

  // Message helpers
  function post(msg) {
    try { iframe.contentWindow?.postMessage(msg, '*'); } catch {}
  }

  // Public ask(): sends a request to mentor iframe
  function ask({ subject, level, question, work, mode } = {}) {
    const id = `m-${Date.now()}-${++_id}`;
    post({ type: 'mentor:ask', id, payload: { subject, level, question, work, mode } });
    open();
    return id;
  }

  // Allow host to push current theme to iframe
  function syncTheme(theme) {
    post({ type: 'theme', theme });
  }

  // bubble host theme on load
  iframe.addEventListener('load', () => {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    syncTheme(theme);
  });

  // Expose a simple API
  return { el: wrap, iframe, open, close, toggle, ask, syncTheme };
}
