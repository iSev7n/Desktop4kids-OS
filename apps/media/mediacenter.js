/* ==========================================================
   Desktop4Kids — Media Center
   ----------------------------------------------------------
   Sections
   0) Wiring & constants
   1) Theme sync
   2) Helpers (paths, urls, time, buttons)
   3) Grid render (list + lazy thumbs)
   4) Image viewer
   5) Audio player (visualizer + controls)
   6) Video player (custom controls)
   7) Open dispatcher
   8) Boot
========================================================== */

(function () {
  'use strict';

  /* 0) Wiring & constants
     ------------------------------------------------------ */
  const fs = window.top.fsAPI;
  const grid = document.getElementById('grid');
  const viewer = document.getElementById('viewer');

  const EXT = {
    IMG: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
    AUD: ['mp3', 'wav', 'ogg'],
    VID: ['mp4', 'mov', 'webm'],
  };

  const extOf = (n) => (n.split('.').pop() || '').toLowerCase();
  const dirOf = (r) => (r.includes('/') ? r.slice(0, r.lastIndexOf('/')) : 'user');

  /* 1) Theme sync
     ------------------------------------------------------ */
  try {
    const t =
      window.top?.document?.documentElement?.getAttribute('data-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch {}
  window.addEventListener('message', (e) => {
    if (e?.data?.type === 'theme' && e.data.theme) {
      document.documentElement.setAttribute('data-theme', e.data.theme);
    }
  });

  /* 2) Helpers (paths, urls, time, buttons)
     ------------------------------------------------------ */
  async function getPlayableUrl(rel, ext, kind) {
    // Accept data:, base64, or fall back to a file:// URL
    try {
      const txt = await fs.readText(rel);
      if (/^data:/.test(txt)) return txt;

      // "Probably" base64 — lenient but works for your saved files
      if (/^[A-Za-z0-9+/=\s]+$/.test(txt)) {
        const mime =
          kind === 'aud'
            ? ext === 'mp3'
              ? 'audio/mpeg'
              : ext === 'wav'
              ? 'audio/wav'
              : ext === 'ogg'
              ? 'audio/ogg'
              : 'audio/*'
            : ext === 'mp4'
            ? 'video/mp4'
            : ext === 'mov'
            ? 'video/quicktime'
            : ext === 'webm'
            ? 'video/webm'
            : 'video/*';
        return `data:${mime};base64,${txt}`;
      }
    } catch {}
    return await fs.fileUrl(rel);
  }

  const fmtTime = (s) => {
    s = Math.max(0, Math.floor(s || 0));
    const m = Math.floor(s / 60);
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  };

  function makeButton(text, aria) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.setAttribute('aria-label', aria || text);
    b.textContent = text;
    return b;
  }

  /* 3) Grid render (list + lazy thumbs)
     ------------------------------------------------------ */
  async function listAndRender(rel) {
    const items = (await fs.list(rel)).filter((x) => x.type === 'file');
    grid.innerHTML = '';

    const io = new IntersectionObserver(loadThumb, {
      root: grid,
      threshold: 0.1,
    });

    items.forEach((it) => {
      const e = extOf(it.name);
      const kind = EXT.IMG.includes(e)
        ? 'img'
        : EXT.AUD.includes(e)
        ? 'aud'
        : EXT.VID.includes(e)
        ? 'vid'
        : null;
      if (!kind) return;

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'card';
      card.dataset.rel = it.rel;
      card.dataset.ext = e;
      card.dataset.kind = kind;

      const ph = document.createElement('img');
      ph.className = 'thumb';
      ph.alt = '';
      ph.src =
        kind === 'img'
          ? '../../assets/icons/file.svg' // will be swapped by lazy loader
          : kind === 'aud'
          ? '../../assets/icons/file-song.svg'
          : '../../assets/icons/file-video.svg';

      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = it.name;

      card.appendChild(ph);
      card.appendChild(label);
      card.addEventListener('click', () => open(it.rel, kind, e));
      grid.appendChild(card);

      if (kind === 'img') io.observe(card);
    });
  }

  async function loadThumb(entries, obs) {
    for (const ent of entries) {
      if (!ent.isIntersecting) continue;
      obs.unobserve(ent.target);
      const rel = ent.target.dataset.rel;
      try {
        const txt = await fs.readText(rel);
        const url = /^data:image\//.test(txt)
          ? txt
          : /^[A-Za-z0-9+/=\s]+$/.test(txt)
          ? `data:image/${ent.target.dataset.ext || 'png'};base64,${txt}`
          : await fs.fileUrl(rel);
        ent.target.querySelector('img').src = url;
      } catch {
        // leave placeholder on failure
      }
    }
  }

  /* 4) Image viewer
     ------------------------------------------------------ */
  async function buildImageUI(rel, ext) {
    viewer.innerHTML = '';
    viewer.classList.remove('hide');

    let url = null;
    try {
      const txt = await fs.readText(rel);
      if (txt && /^data:image\//.test(txt)) url = txt;
      else if (txt && /^[A-Za-z0-9+/=\s]+$/.test(txt))
        url = `data:image/${ext || 'png'};base64,${txt}`;
      else url = await fs.fileUrl(rel);
    } catch {
      url = await fs.fileUrl(rel);
    }

    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    viewer.appendChild(img);
  }

  /* 5) Audio player (visualizer + controls)
     ------------------------------------------------------ */
  function buildAudioUI(url) {
    viewer.innerHTML = '';
    viewer.classList.remove('hide');

    // visualizer canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    viewer.appendChild(canvas);

    // audio element (hidden, driven by custom UI)
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.src = url;
    audio.controls = false;
    audio.setAttribute(
      'controlslist',
      'nodownload noplaybackrate noremoteplayback',
    );
    audio.setAttribute('disablepictureinpicture', '');
    audio.style.display = 'none';
    viewer.appendChild(audio);

    // viz mode buttons
    const tools = document.createElement('div');
    tools.className = 'viz-tools';
    tools.innerHTML = `
      <button type="button" data-viz="bars"   class="active">Bars</button>
      <button type="button" data-viz="circle">Circle</button>
      <button type="button" data-viz="wave">Wave</button>`;
    viewer.appendChild(tools);
    let vizMode = 'bars';
    tools.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-viz]');
      if (!btn) return;
      vizMode = btn.dataset.viz;
      tools
        .querySelectorAll('button')
        .forEach((b) => b.classList.toggle('active', b === btn));
    });

    // custom controls
    const ctrls = document.createElement('div');
    ctrls.className = 'ctrls';
    const btnPlay = makeButton('►', 'Play/Pause');
    const timeEl = document.createElement('div');
    timeEl.className = 'time';
    timeEl.textContent = '0:00 / 0:00';
    const seek = document.createElement('div');
    seek.className = 'seek';
    seek.innerHTML =
      '<input type="range" min="0" max="100" value="0" aria-label="Seek">';
    const vol = document.createElement('div');
    vol.className = 'vol';
    vol.innerHTML =
      '<span aria-hidden="true">🔊</span><input type="range" min="0" max="1" step="0.01" value="1" aria-label="Volume">';
    ctrls.append(btnPlay, timeEl, seek, vol);
    viewer.appendChild(ctrls);

    // sizing
    function resize() {
      canvas.width = viewer.clientWidth - 32;
      canvas.height = Math.max(120, viewer.clientHeight - 110);
    }
    new ResizeObserver(resize).observe(viewer);
    resize();

    // wire controls
    btnPlay.addEventListener('click', async () => {
      if (audio.paused) {
        try {
          await audio.play();
        } catch {}
      } else {
        audio.pause();
      }
    });
    audio.addEventListener('play', () => (btnPlay.textContent = '❚❚'));
    audio.addEventListener('pause', () => (btnPlay.textContent = '►'));

    const seekEl = seek.querySelector('input');
    const volEl = vol.querySelector('input');
    volEl.addEventListener('input', () => (audio.volume = +volEl.value));
    seekEl.addEventListener(
      'input',
      () => (audio.currentTime = (+seekEl.value / 100) * (audio.duration || 0)),
    );

    function updateTime() {
      const cur = audio.currentTime || 0;
      const dur = audio.duration || 0;
      timeEl.textContent = `${fmtTime(cur)} / ${fmtTime(dur)}`;
      if (dur)
        seekEl.value = Math.min(100, Math.max(0, Math.round((cur / dur) * 100)));
    }
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateTime);

    // WebAudio analyser
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = new AC();
    const src = ac.createMediaElementSource(audio);
    const analyser = ac.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    analyser.connect(ac.destination);

    const freqN = analyser.frequencyBinCount;
    const freq = new Uint8Array(freqN);
    const wave = new Uint8Array(analyser.fftSize);

    function draw() {
      requestAnimationFrame(draw);
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (vizMode === 'bars') {
        analyser.getByteFrequencyData(freq);
        const bw = (canvas.width / freqN) * 1.25;
        let x = 0;
        for (let i = 0; i < freqN; i++) {
          const h = (freq[i] / 255) * (canvas.height - 20);
          const hue = (i / freqN) * 360;
          ctx.fillStyle = `hsl(${hue},80%,55%)`;
          ctx.fillRect(x, canvas.height - h, bw, h);
          x += bw + 1;
        }
      } else if (vizMode === 'circle') {
        analyser.getByteFrequencyData(freq);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const r = Math.min(cx, cy) * 0.45;
        for (let i = 0; i < freqN; i++) {
          const a = (i / freqN) * Math.PI * 2;
          const len = r + (freq[i] / 255) * r * 0.8;
          const x1 = cx + Math.cos(a) * r,
            y1 = cy + Math.sin(a) * r;
          const x2 = cx + Math.cos(a) * len,
            y2 = cy + Math.sin(a) * len;
          const hue = (i / freqN) * 360;
          ctx.strokeStyle = `hsl(${hue},80%,60%)`;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      } else {
        analyser.getByteTimeDomainData(wave);
        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const step = canvas.width / wave.length;
        for (let i = 0; i < wave.length; i++) {
          const v = wave[i] / 255;
          const y = v * canvas.height;
          const x = i * step;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    draw();

    // autoplay when user interacts with the viz area
    canvas.addEventListener('click', () => btnPlay.click());
  }

  /* 6) Video player (custom controls)
     ------------------------------------------------------ */
  function buildVideoUI(url) {
    viewer.innerHTML = '';
    viewer.classList.remove('hide');

    const video = document.createElement('video');
    video.src = url;
    video.playsInline = true;
    video.controls = false; // custom controls only
    video.setAttribute(
      'controlslist',
      'nodownload noplaybackrate noremoteplayback nofullscreen',
    );
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('disableremoteplayback', '');
    viewer.appendChild(video);

    const ctrls = document.createElement('div');
    ctrls.className = 'ctrls';
    const btnPlay = makeButton('►', 'Play/Pause');
    const timeEl = document.createElement('div');
    timeEl.className = 'time';
    timeEl.textContent = '0:00 / 0:00';
    const seek = document.createElement('div');
    seek.className = 'seek';
    seek.innerHTML =
      '<input type="range" min="0" max="100" value="0" aria-label="Seek">';
    const vol = document.createElement('div');
    vol.className = 'vol';
    vol.innerHTML =
      '<span aria-hidden="true">🔊</span><input type="range" min="0" max="1" step="0.01" value="1" aria-label="Volume">';
    ctrls.append(btnPlay, timeEl, seek, vol);
    viewer.appendChild(ctrls);

    btnPlay.addEventListener('click', async () => {
      if (video.paused) {
        try {
          await video.play();
        } catch {}
      } else {
        video.pause();
      }
    });
    video.addEventListener('play', () => (btnPlay.textContent = '❚❚'));
    video.addEventListener('pause', () => (btnPlay.textContent = '►'));

    const seekEl = seek.querySelector('input');
    const volEl = vol.querySelector('input');
    volEl.addEventListener('input', () => (video.volume = +volEl.value));
    seekEl.addEventListener(
      'input',
      () => (video.currentTime = (+seekEl.value / 100) * (video.duration || 0)),
    );

    function updateTime() {
      const cur = video.currentTime || 0;
      const dur = video.duration || 0;
      timeEl.textContent = `${fmtTime(cur)} / ${fmtTime(dur)}`;
      if (dur)
        seekEl.value = Math.min(100, Math.max(0, Math.round((cur / dur) * 100)));
    }
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateTime);

    // click-to-toggle on the video
    video.addEventListener('click', () => btnPlay.click());
  }

  /* 7) Open dispatcher
     ------------------------------------------------------ */
  async function open(rel, kind, ext) {
    if (kind === 'img') return buildImageUI(rel, ext);
    if (kind === 'aud') return buildAudioUI(await getPlayableUrl(rel, ext, 'aud'));
    if (kind === 'vid') return buildVideoUI(await getPlayableUrl(rel, ext, 'vid'));
  }

  /* 8) Boot
     ------------------------------------------------------ */
  (async function boot() {
    const p = new URLSearchParams(location.search);
    const rel = p.get('file');

    if (rel) {
      const e = extOf(rel);
      const kind = EXT.IMG.includes(e)
        ? 'img'
        : EXT.AUD.includes(e)
        ? 'aud'
        : EXT.VID.includes(e)
        ? 'vid'
        : null;
      if (kind) open(rel, kind, e);
      await listAndRender(dirOf(rel));
    } else {
      await listAndRender('user/Pictures');
    }
  })();
})();
