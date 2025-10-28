'use strict';

// Theme sync from parent (like other apps)
try {
  const t = window.top?.document?.documentElement?.getAttribute('data-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
} catch {}
window.addEventListener('message', (e) => {
  if (e?.data?.type === 'theme') document.documentElement.setAttribute('data-theme', e.data.theme);
});

const display = document.getElementById('display');
const tape    = document.getElementById('tape');
const keys    = document.querySelector('.keys');

let lastResult = null;

function appendTape(line){
  const p = document.createElement('div');
  p.textContent = line;
  tape.appendChild(p);
  tape.scrollTop = tape.scrollHeight;
}

function sanitize(expr){
  // normalize symbols, trim spaces
  expr = String(expr || '').replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/\^/g,'**').trim();

  // simple % handling: "50%" => "(50*0.01)"
  expr = expr.replace(/(\d+(\.\d+)?)%/g, '($1*0.01)');

  // allow digits, ops, dots, parentheses, spaces, exponent **
  if (!/^[\d+\-*/().\s*]*$/.test(expr)) throw new Error('Invalid characters');

  // guard: sequence of operators (except unary - and parentheses cases)
  if (/[+\/*]{2,}/.test(expr.replace(/\*\*/g,'^'))) throw new Error('Bad operator sequence');

  return expr;
}

function compute(){
  const raw = display.value;
  try{
    const expr = sanitize(raw);
    /* eslint no-new-func:0 */
    const result = Function(`"use strict"; return (${expr});`)();
    if (result == null || !isFinite(result)) throw new Error('Math error');
    const out = Number(result.toPrecision(12)) * 1; // trim float noise
    appendTape(`${raw} = ${out}`);
    display.value = String(out);
    lastResult = out;
  }catch(err){
    appendTape(`${raw} = Error`);
  }
}

function backspace(){ display.value = display.value.slice(0,-1); }
function clearAll(){ display.value=''; }
function clearEntry(){ display.value=''; }

function press(val){
  const map = { '÷':'/', '×':'*', '−':'-', '+':'+', '.':'.', '(': '(', ')': ')', '%':'%', '^':'^' };
  if (val in map) display.value += map[val];
  else if (/^\d$/.test(val)) display.value += val;
  else if (val === '±'){
    // toggle sign for the last number chunk
    const m = display.value.match(/(-?\d*\.?\d+)(?!.*-?\d*\.?\d+)/);
    if (m){
      const start = display.value.lastIndexOf(m[1]);
      const before = display.value.slice(0,start);
      const after  = display.value.slice(start + m[1].length);
      const n = -Number(m[1]);
      display.value = before + n + after;
    } else if (display.value.trim()==='' && lastResult!=null){
      display.value = String(-Number(lastResult));
    }
  }
}

keys.addEventListener('click', (e)=>{
  const b = e.target.closest('button'); if (!b) return;
  const k = b.dataset.k;
  if (k === '=') return compute();
  if (k === 'C')  return clearAll();
  if (k === 'CE') return clearEntry();
  if (k === '←')  return backspace();
  press(k);
  display.focus();
});

display.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter') { e.preventDefault(); compute(); return; }
  if (e.key === 'Escape'){ clearEntry(); return; }
});
display.focus();
