(function () {
  'use strict';

  // ── helpers ──────────────────────────────────────────────────────────────────

  function rgbToHsb(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0, s = max === 0 ? 0 : d / max, v = max;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      b: Math.round(v * 100)
    };
  }

  function parseBgColor(el) {
    const raw = window.getComputedStyle(el).backgroundColor;
    const m = raw.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3] };
  }

  function isVividColor(r, g, b) {
    // reject near-white, near-black, near-gray, and transparent-looking neutrals
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const range = max - min;
    if (r === 0 && g === 0 && b === 0) return false;         // black bg (page bg)
    if (range < 18) return false;                             // grayscale
    if (max < 20) return false;                               // too dark
    if (min > 235 && range < 25) return false;               // near white
    return true;
  }

  function toHex(r, g, b) {
    return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
  }

  // ── overlay ───────────────────────────────────────────────────────────────────

  const overlay = document.createElement('div');
  overlay.id = '__dialed_helper__';
  overlay.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    background: #111;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 14px 16px;
    width: 230px;
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 13px;
    color: #fff;
    box-shadow: 0 4px 24px rgba(0,0,0,.6);
    user-select: none;
    transition: opacity .2s;
    opacity: 0;
    pointer-events: none;
  `;

  overlay.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <div id="__dc_swatch__" style="width:36px;height:36px;border-radius:8px;border:1px solid #444;flex-shrink:0"></div>
      <div>
        <div id="__dc_hex__" style="font-size:15px;font-weight:600;letter-spacing:.03em"></div>
        <div id="__dc_label__" style="font-size:10px;color:#777;margin-top:1px">target color</div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:9px">

      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="color:#aaa;font-size:11px">H — hue</span>
          <span id="__dc_h_val__" style="color:#fff;font-weight:600;font-size:11px"></span>
        </div>
        <div style="position:relative;height:10px;border-radius:5px;overflow:hidden;background:linear-gradient(to right,hsl(0,100%,50%),hsl(30,100%,50%),hsl(60,100%,50%),hsl(90,100%,50%),hsl(120,100%,50%),hsl(150,100%,50%),hsl(180,100%,50%),hsl(210,100%,50%),hsl(240,100%,50%),hsl(270,100%,50%),hsl(300,100%,50%),hsl(330,100%,50%),hsl(360,100%,50%))">
          <div id="__dc_h_pin__" style="position:absolute;top:-1px;width:3px;height:12px;background:#fff;border-radius:2px;transform:translateX(-50%);box-shadow:0 0 4px rgba(0,0,0,.7)"></div>
        </div>
      </div>

      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="color:#aaa;font-size:11px">S — saturation</span>
          <span id="__dc_s_val__" style="color:#fff;font-weight:600;font-size:11px"></span>
        </div>
        <div id="__dc_s_track__" style="position:relative;height:10px;border-radius:5px;overflow:hidden">
          <div id="__dc_s_pin__" style="position:absolute;top:-1px;width:3px;height:12px;background:#fff;border-radius:2px;transform:translateX(-50%);box-shadow:0 0 4px rgba(0,0,0,.7)"></div>
        </div>
      </div>

      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="color:#aaa;font-size:11px">B — brightness</span>
          <span id="__dc_b_val__" style="color:#fff;font-weight:600;font-size:11px"></span>
        </div>
        <div id="__dc_b_track__" style="position:relative;height:10px;border-radius:5px;overflow:hidden">
          <div id="__dc_b_pin__" style="position:absolute;top:-1px;width:3px;height:12px;background:#fff;border-radius:2px;transform:translateX(-50%);box-shadow:0 0 4px rgba(0,0,0,.7)"></div>
        </div>
      </div>

    </div>

    <div style="margin-top:12px;padding-top:10px;border-top:1px solid #2a2a2a;display:flex;justify-content:space-between;align-items:center">
      <span id="__dc_tip__" style="font-size:10px;color:#555;flex:1;line-height:1.4"></span>
      <button id="__dc_toggle__" style="background:#222;border:1px solid #444;color:#aaa;font-size:10px;border-radius:6px;padding:3px 8px;cursor:pointer;flex-shrink:0;margin-left:8px">hide</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // toggle button
  let hidden = false;
  overlay.querySelector('#__dc_toggle__').addEventListener('click', () => {
    hidden = !hidden;
    overlay.querySelector('#__dc_toggle__').textContent = hidden ? 'show' : 'hide';
    overlay.querySelectorAll('div:not(:last-child), div > div').forEach(() => {});
    // just dim non-header content
    const content = overlay.querySelectorAll('div > div > div, div > div > span');
    // simple: just toggle inner sections
    const body = overlay.querySelector('div[style*="flex-direction:column"]');
    const comparison = overlay.querySelector('#__dc_tip__').parentElement;
    if (body) body.style.display = hidden ? 'none' : 'flex';
    if (comparison) comparison.style.display = hidden ? 'none' : 'flex';
    overlay.style.width = hidden ? 'auto' : '230px';
  });

  function updateOverlay(r, g, b) {
    const hsb = rgbToHsb(r, g, b);
    const hex = toHex(r, g, b);
    const hue = hsb.h, sat = hsb.s, bri = hsb.b;

    overlay.querySelector('#__dc_swatch__').style.background = hex;
    overlay.querySelector('#__dc_hex__').textContent = hex.toUpperCase();
    overlay.querySelector('#__dc_h_val__').textContent = hue + '°';
    overlay.querySelector('#__dc_s_val__').textContent = sat + '%';
    overlay.querySelector('#__dc_b_val__').textContent = bri + '%';

    // hue pin
    overlay.querySelector('#__dc_h_pin__').style.left = (hue / 360 * 100) + '%';

    // saturation track: grey → vivid hue
    const sTrack = overlay.querySelector('#__dc_s_track__');
    sTrack.style.background = `linear-gradient(to right, hsl(${hue},0%,${bri}%), hsl(${hue},100%,${bri/2 + bri/4}%))`;
    overlay.querySelector('#__dc_s_pin__').style.left = sat + '%';

    // brightness track: black → full color
    const bTrack = overlay.querySelector('#__dc_b_track__');
    bTrack.style.background = `linear-gradient(to right, #000, hsl(${hue},${sat}%,50%))`;
    overlay.querySelector('#__dc_b_pin__').style.left = bri + '%';

    // tip
    const tips = [];
    if (hue < 30 || hue >= 330) tips.push('red family');
    else if (hue < 75) tips.push('yellow/orange family');
    else if (hue < 150) tips.push('green family');
    else if (hue < 195) tips.push('teal/cyan family');
    else if (hue < 255) tips.push('blue family');
    else if (hue < 330) tips.push('purple/pink family');
    if (sat < 30) tips.push('low saturation — nearly grey');
    else if (sat > 85) tips.push('very vivid');
    if (bri < 35) tips.push('dark');
    else if (bri > 80) tips.push('bright');
    overlay.querySelector('#__dc_tip__').textContent = tips.join(' · ');

    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
  }

  // ── detection ────────────────────────────────────────────────────────────────

  let lastHex = null;

  function scanForColor() {
    // Walk all elements — find big-ish ones with a vivid bg color
    const candidates = document.querySelectorAll('div, canvas');
    let bestEl = null, bestArea = 0;

    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area < 10000) continue;   // smaller than ~100×100

      const rgb = parseBgColor(el);
      if (!rgb) continue;
      if (!isVividColor(rgb.r, rgb.g, rgb.b)) continue;

      if (area > bestArea) {
        bestArea = area;
        bestEl = el;
      }
    }

    if (bestEl) {
      const { r, g, b } = parseBgColor(bestEl);
      const hex = toHex(r, g, b);
      if (hex !== lastHex) {
        lastHex = hex;
        updateOverlay(r, g, b);
      }
    }
  }

  // Poll — dialed.gg updates colors via JS, MutationObserver alone misses style changes
  let pollId = null;

  function startPolling() {
    if (pollId) return;
    pollId = setInterval(scanForColor, 120);
  }

  // Also observe DOM mutations to catch when the game initialises
  const mo = new MutationObserver(() => {
    scanForColor();
    startPolling();
  });
  mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

  startPolling();

  // clean up on page unload
  window.addEventListener('beforeunload', () => clearInterval(pollId));

})();
