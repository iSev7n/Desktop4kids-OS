/* ==========================================================
   Component: Clock & Calendar (clock.js)
   ----------------------------------------------------------
   Sections
   0) Mode & refs
   1) Formatters & helpers
   2) Weekday header
   3) Month rendering
   4) Clock tick (aligned)
   5) Navigation (buttons + keyboard)
   6) Boot
========================================================== */

(function () {
  /* 0) Mode & refs */
  const params = new URLSearchParams(location.search);
  if (params.get('mode') === 'tray') document.body.classList.add('tray');

  const timeNow    = document.getElementById('timeNow');
  const dateNow    = document.getElementById('dateNow');
  const monthTitle = document.getElementById('monthTitle');
  const dowRow     = document.getElementById('dowRow');
  const grid       = document.getElementById('calGrid');
  const prevBtn    = document.getElementById('prevMonth');
  const nextBtn    = document.getElementById('nextMonth');

  let viewYear, viewMonth;   // e.g., 2025, 0..11
  let focusIndex = null;     // 0..41, keyboard focus within grid

  /* 1) Formatters & helpers */
  const fmtDate  = new Intl.DateTimeFormat([], { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const fmtMonth = new Intl.DateTimeFormat([], { month:'long', year:'numeric' });
  const fmtDow   = new Intl.DateTimeFormat([], { weekday:'short' });

  // 12h time with no leading zero on the hour
  function formatTime12(now, { seconds = true } = {}) {
    const opts = { hour: 'numeric', minute: '2-digit', hour12: true };
    if (seconds) opts.second = '2-digit';
    const parts = new Intl.DateTimeFormat([], opts).formatToParts(now);
    const get = t => parts.find(p => p.type === t)?.value || '';
    const hour = get('hour').replace(/^0(?=\d$)/, ''); // strip any single leading 0
    const min  = get('minute');
    const sec  = seconds ? `:${get('second')}` : '';
    const ap   = get('dayPeriod') ? ` ${get('dayPeriod').toUpperCase()}` : '';
    return `${hour}:${min}${sec}${ap}`;
  }

  /* 2) Weekday header (Sun..Sat) */
  function buildDow() {
    dowRow.textContent = '';
    const base = new Date(Date.UTC(2025, 0, 5)); // a Sunday
    for (let i = 0; i < 7; i++) {
      const d = new Date(base); d.setUTCDate(base.getUTCDate() + i);
      const el = document.createElement('div');
      el.textContent = fmtDow.format(d);
      el.style.textAlign = 'center';
      dowRow.appendChild(el);
    }
  }

  /* 3) Month rendering */
  function setView(y, m) {
    viewYear = y; viewMonth = m;
    focusIndex = null;
    renderMonth();
  }

  function renderMonth() {
    // Title
    const first = new Date(viewYear, viewMonth, 1);
    monthTitle.textContent = fmtMonth.format(first);

    // Grid
    grid.textContent = '';
    const today = new Date(); today.setHours(0,0,0,0);

    const startDow      = first.getDay();                        // 0..6
    const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
    const lead          = startDow;                              // leading cells from prev month
    const totalCells    = 42;                                    // 6 weeks

    for (let i = 0; i < totalCells; i++) {
      const btn = document.createElement('button');
      btn.className = 'cell';
      btn.type = 'button';
      btn.setAttribute('role', 'gridcell');
      btn.tabIndex = -1;

      let dayNum, cellDate, isOther = false;

      if (i < lead) {
        dayNum = prevMonthDays - (lead - 1 - i);
        cellDate = new Date(viewYear, viewMonth - 1, dayNum);
        isOther = true;
      } else if (i >= lead + daysInMonth) {
        dayNum = i - (lead + daysInMonth) + 1;
        cellDate = new Date(viewYear, viewMonth + 1, dayNum);
        isOther = true;
      } else {
        dayNum = (i - lead) + 1;
        cellDate = new Date(viewYear, viewMonth, dayNum);
      }

      btn.textContent = String(dayNum);
      if (isOther) btn.classList.add('other');

      const sameDay = cellDate.getTime() === today.getTime();
      if (sameDay) {
        btn.classList.add('today');
        btn.setAttribute('aria-current', 'date');
      }

      btn.addEventListener('click', () => {
        grid.querySelectorAll('.cell[aria-selected="true"]').forEach(el => el.removeAttribute('aria-selected'));
        btn.setAttribute('aria-selected', 'true');
        btn.focus();
        focusIndex = i;
      });

      btn.dataset.index = String(i);
      grid.appendChild(btn);
    }

    // default focus
    const all = grid.querySelectorAll('.cell');
    let target = grid.querySelector('.cell.today') || all[lead] || all[0];
    if (focusIndex != null && all[focusIndex]) target = all[focusIndex];
    target.tabIndex = 0; // grid itself is tabbable; no auto-focus steal
  }

  /* 4) Clock tick (aligned to the second) */
  function updateNow() {
    const now = new Date();
    timeNow.textContent = formatTime12(now, { seconds: true }); // flip to false to hide seconds
    dateNow.textContent = fmtDate.format(now);
  }
  function startClock() {
    updateNow();
    const ms = 1000 - (Date.now() % 1000);
    setTimeout(() => {
      updateNow();
      setInterval(updateNow, 1000);
    }, ms);
  }

  /* 5) Navigation (buttons + keyboard) */
  function shiftMonth(delta) {
    let m = viewMonth + delta, y = viewYear;
    while (m < 0)  { m += 12; y--; }
    while (m > 11) { m -= 12; y++; }
    setView(y, m);
  }
  prevBtn.addEventListener('click', () => shiftMonth(-1));
  nextBtn.addEventListener('click', () => shiftMonth(1));

  grid.addEventListener('keydown', (e) => {
    const cells = [...grid.querySelectorAll('.cell')];
    if (!cells.length) return;

    let idx = (focusIndex ?? cells.findIndex(el => el.tabIndex === 0));
    if (idx < 0) idx = 0;

    const col = idx % 7;
    switch (e.key) {
      case 'ArrowLeft':  idx = Math.max(0, idx - 1); break;
      case 'ArrowRight': idx = Math.min(cells.length - 1, idx + 1); break;
      case 'ArrowUp':    idx = Math.max(0, idx - 7); break;
      case 'ArrowDown':  idx = Math.min(cells.length - 1, idx + 7); break;
      case 'Home':       idx = idx - col; break;
      case 'End':        idx = idx + (6 - col); break;
      case 'PageUp':     shiftMonth(e.shiftKey ? -12 : -1); return;
      case 'PageDown':   shiftMonth(e.shiftKey ?  12 :  1); return;
      default: return;
    }
    e.preventDefault();
    cells.forEach(el => el.tabIndex = -1);
    const target = cells[idx];
    target.tabIndex = 0;
    target.focus();
    focusIndex = idx;
  });

  /* 6) Boot */
  buildDow();
  const now = new Date();
  setView(now.getFullYear(), now.getMonth());
  startClock();
})();
