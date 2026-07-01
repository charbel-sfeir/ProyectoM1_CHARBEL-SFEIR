/* ===========================================================
   Colorfly Studio — Generador de Paletas Interactivo
   script.js
   =========================================================== */

(() => {
  'use strict';

  // ---------- State ----------
  /** @type {{hsl: [number, number, number], locked: boolean}[]} */
  let currentPalette = [];
  let currentSize = 6;
  let currentFormat = 'hex';

  const STORAGE_KEY = 'colorfly_saved_palettes';

  // ---------- DOM refs ----------
  const paletteList = document.getElementById('palette-list');
  const generateBtn = document.getElementById('generate-btn');
  const saveBtn = document.getElementById('save-btn');
  const clearSavedBtn = document.getElementById('clear-saved-btn');
  const savedList = document.getElementById('saved-list');
  const toastEl = document.getElementById('toast');
  const sizeInputs = document.querySelectorAll('input[name="palette-size"]');
  const formatInputs = document.querySelectorAll('input[name="color-format"]');
  const backToTopBtn = document.getElementById('back-to-top');
  const gradientPreview = document.getElementById('gradient-preview');
  const gradientTypeInputs = document.querySelectorAll('input[name="gradient-type"]');
  const copyGradientBtn = document.getElementById('copy-gradient-btn');
  const rolesList = document.getElementById('roles-list');
  const pairsList = document.getElementById('pairs-list');
  const themeToggle = document.getElementById('theme-toggle');
  const downloadPngBtn = document.getElementById('download-png-btn');
  const printBtn = document.getElementById('print-btn');
  const shareBtn = document.getElementById('share-btn');
  const historyStrip = document.getElementById('history-strip');
  const imageInput = document.getElementById('image-input');
  const extractPreviewRow = document.getElementById('extract-preview-row');
  const extractPreviewImg = document.getElementById('extract-preview-img');
  const extractPreviewName = document.getElementById('extract-preview-name');

  let currentGradientType = '135deg';
  const THEME_KEY = 'colorfly_theme';
  const HISTORY_KEY = 'colorfly_history';

  // ---------- Color helpers ----------

  // Punto de partida de matiz aleatorio en cada generación, para que las
  // paletas no siempre arranquen del mismo lugar de la rueda de color.
  let hueCursor = Math.random() * 360;

  /**
   * Genera un color HSL "distinto" en cada llamada, avanzando el matiz con
   * el ángulo áureo (~137.5°). Esto evita que colores consecutivos queden
   * muy parecidos entre sí y da paletas más variadas y vivas.
   */
  function randomHsl() {
    hueCursor = (hueCursor + 137.5 + (Math.random() * 20 - 10)) % 360;
    const h = Math.floor(hueCursor);
    const s = Math.floor(Math.random() * 55) + 40; // 40–95%
    const l = Math.floor(Math.random() * 55) + 25; // 25–80%
    return [h, s, l];
  }

  function hslToString([h, s, l]) {
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  function hslToHex([h, s, l]) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
  }

  /** Decide si el texto sobre el swatch debe ser claro u oscuro según luminosidad */
  function getReadableTextColor([h, s, l]) {
    return l > 60 ? '#1B1B1F' : '#FFFFFF';
  }

  function formatColor(hsl, format) {
    return format === 'hex' ? hslToHex(hsl) : hslToString(hsl);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Genera una escalera de tints/shades para un color: del más oscuro al
   * más claro, manteniendo el mismo matiz. Sirve para ver variaciones
   * tonales usables como estados (hover, fondos suaves, bordes, etc).
   */
  function getVariations([h, s, l]) {
    const steps = [-36, -18, 0, 18, 36];
    return steps.map(delta => {
      const newL = clamp(l + delta, 6, 95);
      const newS = delta === 0 ? s : clamp(s - Math.abs(delta) * 0.15, 15, 100);
      return [h, Math.round(newS), Math.round(newL)];
    });
  }

  // ---------- WCAG contrast helpers ----------
  function hexToRgbArray(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }

  function relativeLuminance([r, g, b]) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function contrastRatio(hexA, hexB) {
    const lumA = relativeLuminance(hexToRgbArray(hexA));
    const lumB = relativeLuminance(hexToRgbArray(hexB));
    const lighter = Math.max(lumA, lumB);
    const darker = Math.min(lumA, lumB);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // ---------- Toast ----------
  let toastTimer = null;
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 2200);
  }

  // ---------- Palette generation ----------
  function generatePalette() {
    generateBtn.classList.add('is-spinning');
    setTimeout(() => generateBtn.classList.remove('is-spinning'), 400);

    const next = [];
    for (let i = 0; i < currentSize; i++) {
      const existing = currentPalette[i];
      if (existing && existing.locked) {
        next.push(existing);
      } else {
        next.push({ hsl: randomHsl(), locked: false });
      }
    }
    currentPalette = next;
    renderPalette();
    pushHistory();
    showToast('Nueva paleta generada ✓');
  }

  // ---------- Historial reciente (automático, distinto de "guardadas") ----------
  function getHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function pushHistory() {
    const hexes = currentPalette.map(c => hslToHex(c.hsl));
    const key = hexes.join(',');
    let history = getHistory().filter(h => h.colors.join(',') !== key);
    history.unshift({ id: Date.now(), colors: hexes });
    history = history.slice(0, 10);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    const history = getHistory();
    historyStrip.innerHTML = '';

    if (history.length === 0) {
      const p = document.createElement('p');
      p.className = 'history__empty';
      p.textContent = 'Las últimas paletas que generes van a aparecer acá.';
      historyStrip.appendChild(p);
      return;
    }

    history.forEach(entry => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'history__item';
      item.setAttribute('aria-label', `Cargar paleta de ${entry.colors.length} colores del historial`);
      entry.colors.forEach(hex => {
        const span = document.createElement('span');
        span.style.background = hex;
        item.appendChild(span);
      });
      item.addEventListener('click', () => loadPaletteFromHexes(entry.colors));
      historyStrip.appendChild(item);
    });
  }

  function loadPaletteFromHexes(hexes) {
    if ([6, 8, 9].includes(hexes.length)) {
      currentSize = hexes.length;
      const sizeInput = document.querySelector(`input[name="palette-size"][value="${currentSize}"]`);
      if (sizeInput) sizeInput.checked = true;
    }
    currentPalette = hexes.map(hex => ({ hsl: hexToHsl(hex), locked: false }));
    renderPalette();
    showToast('Paleta cargada');
  }

  function renderPalette() {
    paletteList.dataset.size = String(currentSize);
    paletteList.style.setProperty('--cols', String(currentSize <= 6 ? 3 : currentSize <= 8 ? 4 : 3));
    // Use a responsive column count: aim for ~3 columns on wider rows automatically via CSS,
    // but ensure base columns scale with palette size for desktop layout.
    if (currentSize === 6) paletteList.style.setProperty('--cols', '3');
    if (currentSize === 8) paletteList.style.setProperty('--cols', '4');
    if (currentSize === 9) paletteList.style.setProperty('--cols', '3');

    paletteList.innerHTML = '';

    currentPalette.forEach((color, index) => {
      const hex = hslToHex(color.hsl);
      const textColor = getReadableTextColor(color.hsl);
      const displayCode = formatColor(color.hsl, currentFormat);

      const li = document.createElement('li');
      li.className = 'swatch';
      li.style.setProperty('--card-bg', hex);
      li.style.color = textColor;
      li.style.animationDelay = `${index * 45}ms`;
      if (color.locked) li.classList.add('is-locked');

      const top = document.createElement('div');
      top.className = 'swatch__top';

      const lockBtn = document.createElement('button');
      lockBtn.type = 'button';
      lockBtn.className = 'swatch__lock';
      lockBtn.style.color = '#221E19';
      lockBtn.setAttribute(
        'aria-label',
        color.locked ? `Desbloquear color ${hex}` : `Bloquear color ${hex}`
      );
      lockBtn.setAttribute('aria-pressed', String(color.locked));
      lockBtn.textContent = color.locked ? '🔒' : '🔓';
      lockBtn.addEventListener('click', () => toggleLock(index));

      top.appendChild(lockBtn);
      li.appendChild(top);

      const variationsRow = document.createElement('div');
      variationsRow.className = 'swatch__variations';
      getVariations(color.hsl).forEach(variantHsl => {
        const variantHex = hslToHex(variantHsl);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.background = variantHex;
        btn.setAttribute('aria-label', `Copiar variación ${variantHex}`);
        btn.addEventListener('click', e => {
          e.stopPropagation();
          copyToClipboard(variantHex, 'variación');
        });
        variationsRow.appendChild(btn);
      });
      li.appendChild(variationsRow);

      const codeBtn = document.createElement('button');
      codeBtn.type = 'button';
      codeBtn.className = 'swatch__code-btn';
      codeBtn.textContent = displayCode;
      codeBtn.setAttribute('aria-label', `Copiar código ${displayCode} al portapapeles`);
      codeBtn.addEventListener('click', () => copyToClipboard(displayCode));
      li.appendChild(codeBtn);

      paletteList.appendChild(li);
    });

    updateGradient();
    updateSuggestions();
  }

  function toggleLock(index) {
    currentPalette[index].locked = !currentPalette[index].locked;
    renderPalette();
    showToast(currentPalette[index].locked ? 'Color bloqueado' : 'Color desbloqueado');
  }

  // ---------- Gradient ----------
  function buildGradientCss() {
    const hexes = currentPalette.map(c => hslToHex(c.hsl));
    const stops = hexes
      .map((hex, i) => `${hex} ${Math.round((i / (hexes.length - 1 || 1)) * 100)}%`)
      .join(', ');
    return currentGradientType === 'radial'
      ? `radial-gradient(circle, ${stops})`
      : `linear-gradient(${currentGradientType}, ${stops})`;
  }

  function updateGradient() {
    const css = buildGradientCss();
    gradientPreview.style.background = css;
  }

  // ---------- Role & combination suggestions ----------
  function getPaletteRoles() {
    const items = currentPalette.map(c => ({
      hex: hslToHex(c.hsl),
      h: c.hsl[0], s: c.hsl[1], l: c.hsl[2],
    }));

    const byLightness = [...items].sort((a, b) => a.l - b.l);
    const bySaturation = [...items].sort((a, b) => b.s - a.s);

    const text = byLightness[0];
    const bg = byLightness[byLightness.length - 1];
    const accent = bySaturation.find(c => c.hex !== text.hex && c.hex !== bg.hex) || bySaturation[0];
    const secondary = items.filter(
      c => c.hex !== text.hex && c.hex !== bg.hex && c.hex !== accent.hex
    );

    return { bg, text, accent, secondary };
  }

  function renderRoleCard(label, hex) {
    const card = document.createElement('div');
    card.className = 'role-card';
    card.innerHTML = `
      <div class="role-card__swatch" style="background:${hex}"></div>
      <div>
        <p class="role-card__label">${label}</p>
        <p class="role-card__code">${hex}</p>
      </div>
    `;
    return card;
  }

  function updateSuggestions() {
    if (currentPalette.length === 0) return;
    const { bg, text, accent, secondary } = getPaletteRoles();

    rolesList.innerHTML = '';
    rolesList.appendChild(renderRoleCard('Fondo sugerido', bg.hex));
    rolesList.appendChild(renderRoleCard('Texto principal', text.hex));
    rolesList.appendChild(renderRoleCard('Acento / CTA', accent.hex));
    secondary.slice(0, 3).forEach((c, i) => {
      rolesList.appendChild(renderRoleCard(`Secundario ${i + 1}`, c.hex));
    });

    // Mejores pares de contraste para texto sobre fondo
    const hexes = currentPalette.map(c => hslToHex(c.hsl));
    const pairs = [];
    for (let i = 0; i < hexes.length; i++) {
      for (let j = 0; j < hexes.length; j++) {
        if (i === j) continue;
        pairs.push({
          bg: hexes[i],
          fg: hexes[j],
          ratio: contrastRatio(hexes[i], hexes[j]),
        });
      }
    }
    pairs.sort((a, b) => b.ratio - a.ratio);
    const topPairs = pairs.slice(0, 3);

    pairsList.innerHTML = '';
    topPairs.forEach(pair => {
      const ratioLabel = `${pair.ratio.toFixed(1)}:1`;
      const isAA = pair.ratio >= 4.5;
      const card = document.createElement('div');
      card.className = 'pair-card';
      card.innerHTML = `
        <span class="pair-card__demo" style="background:${pair.bg};color:${pair.fg}">Aa Texto</span>
        <span class="pair-card__text">Fondo ${pair.bg} + texto ${pair.fg} — ${
          isAA ? 'buen contraste, sirve para texto de cuerpo.' : 'usar solo para texto grande o decorativo.'
        }</span>
        <span class="pair-card__ratio ${isAA ? 'pair-card__ratio--aa' : 'pair-card__ratio--low'}">${ratioLabel} ${isAA ? '· AA' : ''}</span>
      `;
      pairsList.appendChild(card);
    });
  }

  async function copyGradientCss() {
    const css = `background: ${buildGradientCss()};`;
    try {
      await navigator.clipboard.writeText(css);
      showToast('CSS del gradiente copiado');
    } catch {
      showToast('No se pudo copiar. Copialo manualmente.');
    }
  }

  // ---------- Exportar como PNG ----------
  function downloadPaletteAsPng() {
    if (currentPalette.length === 0) return;

    const swatchWidth = 220;
    const swatchHeight = 260;
    const headerHeight = 56;
    const width = swatchWidth * currentPalette.length;
    const height = headerHeight + swatchHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#F5EFE2';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#221E19';
    ctx.font = '700 22px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('Colorfly Studio — Paleta generada', 20, 36);

    currentPalette.forEach((color, i) => {
      const hex = hslToHex(color.hsl);
      const label = formatColor(color.hsl, currentFormat);
      const textColor = getReadableTextColor(color.hsl);

      ctx.fillStyle = hex;
      ctx.fillRect(i * swatchWidth, headerHeight, swatchWidth, swatchHeight);

      ctx.fillStyle = textColor;
      ctx.font = '700 15px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, i * swatchWidth + swatchWidth / 2, headerHeight + swatchHeight - 24);
    });

    const link = document.createElement('a');
    link.download = `paleta-colorfly-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('PNG descargado ✓');
  }

  // ---------- Compartir por link ----------
  function buildShareUrl() {
    const hexes = currentPalette.map(c => hslToHex(c.hsl));
    const param = hexes.map(h => h.replace('#', '')).join('-');
    const url = new URL(window.location.href);
    url.searchParams.set('p', param);
    url.searchParams.set('f', currentFormat);
    return url.toString();
  }

  async function sharePalette() {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copiado — pegalo donde quieras compartirlo');
    } catch {
      showToast('No se pudo copiar el link automáticamente');
    }
  }

  function loadPaletteFromQueryString() {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    if (!p) return false;

    const hexes = p
      .split('-')
      .map(h => `#${h}`)
      .filter(h => /^#[0-9A-Fa-f]{6}$/i.test(h));

    if (![6, 8, 9].includes(hexes.length)) return false;

    const format = params.get('f');
    if (format === 'hsl' || format === 'hex') {
      currentFormat = format;
      const formatInput = document.querySelector(`input[name="color-format"][value="${format}"]`);
      if (formatInput) formatInput.checked = true;
    }

    currentSize = hexes.length;
    const sizeInput = document.querySelector(`input[name="palette-size"][value="${currentSize}"]`);
    if (sizeInput) sizeInput.checked = true;

    currentPalette = hexes.map(hex => ({ hsl: hexToHsl(hex), locked: false }));
    renderPalette();
    showToast('Paleta cargada desde el link compartido');
    return true;
  }

  async function copyToClipboard(text, label = 'código') {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Copiado (${label}): ${text}`);
    } catch (err) {
      showToast('No se pudo copiar. Copialo manualmente.');
    }
  }

  // ---------- Saved palettes (localStorage) ----------
  function getSavedPalettes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function setSavedPalettes(palettes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes));
  }

  function savePalette() {
    const palettes = getSavedPalettes();
    const entry = {
      id: Date.now(),
      colors: currentPalette.map(c => hslToHex(c.hsl)),
    };
    palettes.unshift(entry);
    setSavedPalettes(palettes);
    renderSavedPalettes();
    showToast('Paleta guardada en este navegador');
  }

  function deleteSavedPalette(id) {
    const palettes = getSavedPalettes().filter(p => p.id !== id);
    setSavedPalettes(palettes);
    renderSavedPalettes();
    showToast('Paleta eliminada');
  }

  function clearAllSaved() {
    setSavedPalettes([]);
    renderSavedPalettes();
    showToast('Se borraron todas las paletas guardadas');
  }

  function loadSavedPalette(id) {
    const palettes = getSavedPalettes();
    const entry = palettes.find(p => p.id === id);
    if (!entry) return;

    currentSize = entry.colors.length;
    document.querySelector(`input[name="palette-size"][value="${currentSize}"]`)?.click();

    currentPalette = entry.colors.map(hex => ({ hsl: hexToHsl(hex), locked: false }));
    renderPalette();
    showToast('Paleta cargada');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    return [h, Math.round(s * 100), Math.round(l * 100)];
  }

  // ---------- Extraer paleta desde una imagen ----------
  function rgbToHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    return [h, Math.round(s * 100), Math.round(l * 100)];
  }

  /** K-means muy liviano en espacio RGB, para agrupar píxeles en N colores dominantes. */
  function kMeansColors(pixels, k, iterations = 6) {
    if (pixels.length === 0) return [];
    let centroids = [];
    const used = new Set();
    while (centroids.length < k && centroids.length < pixels.length) {
      const idx = Math.floor(Math.random() * pixels.length);
      if (!used.has(idx)) {
        used.add(idx);
        centroids.push(pixels[idx].slice());
      }
    }
    for (let iter = 0; iter < iterations; iter++) {
      const groups = Array.from({ length: centroids.length }, () => []);
      pixels.forEach(p => {
        let bestIdx = 0, bestDist = Infinity;
        centroids.forEach((c, i) => {
          const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
          if (d < bestDist) { bestDist = d; bestIdx = i; }
        });
        groups[bestIdx].push(p);
      });
      centroids = groups.map((g, i) => {
        if (g.length === 0) return centroids[i];
        const sum = g.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
        return [sum[0] / g.length, sum[1] / g.length, sum[2] / g.length];
      });
    }
    return centroids.map(c => c.map(v => Math.round(v)));
  }

  function extractPaletteFromImage(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 160;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let data;
        try {
          data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        } catch (err) {
          showToast('No se pudo leer esta imagen (¿es de otro dominio?)');
          return;
        }

        const pixels = [];
        for (let i = 0; i < data.length; i += 4 * 2) {
          if (data[i + 3] < 128) continue; // ignora píxeles muy transparentes
          pixels.push([data[i], data[i + 1], data[i + 2]]);
        }

        const clusters = kMeansColors(pixels, currentSize, 6);
        currentPalette = clusters.map(rgb => ({ hsl: rgbToHsl(rgb), locked: false }));
        renderPalette();
        pushHistory();
        showToast('Paleta extraída de la imagen ✓');

        extractPreviewImg.src = e.target.result;
        extractPreviewName.textContent = file.name;
        extractPreviewRow.hidden = false;
      };
      img.onerror = () => showToast('No se pudo cargar la imagen');
      img.src = e.target.result;
    };
    reader.onerror = () => showToast('No se pudo leer el archivo');
    reader.readAsDataURL(file);
  }

  function renderSavedPalettes() {
    const palettes = getSavedPalettes();
    savedList.innerHTML = '';

    if (palettes.length === 0) {
      const li = document.createElement('li');
      li.className = 'saved__empty';
      li.textContent = 'Todavía no guardaste ninguna paleta.';
      savedList.appendChild(li);
      return;
    }

    palettes.forEach(entry => {
      const li = document.createElement('li');
      li.className = 'saved__item';

      const swatches = document.createElement('div');
      swatches.className = 'saved__swatches';
      entry.colors.forEach(hex => {
        const span = document.createElement('span');
        span.style.background = hex;
        swatches.appendChild(span);
      });

      const meta = document.createElement('span');
      meta.className = 'saved__meta';
      meta.textContent = `${entry.colors.length} colores`;

      const loadBtn = document.createElement('button');
      loadBtn.type = 'button';
      loadBtn.className = 'saved__load';
      loadBtn.textContent = 'Cargar';
      loadBtn.addEventListener('click', () => loadSavedPalette(entry.id));

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'saved__delete';
      deleteBtn.textContent = 'Eliminar';
      deleteBtn.setAttribute('aria-label', `Eliminar paleta de ${entry.colors.length} colores`);
      deleteBtn.addEventListener('click', () => deleteSavedPalette(entry.id));

      li.append(swatches, meta, loadBtn, deleteBtn);
      savedList.appendChild(li);
    });
  }

  // ---------- Event listeners ----------
  generateBtn.addEventListener('click', generatePalette);
  saveBtn.addEventListener('click', savePalette);
  clearSavedBtn.addEventListener('click', clearAllSaved);

  sizeInputs.forEach(input => {
    input.addEventListener('change', e => {
      currentSize = Number(e.target.value);
      generatePalette();
    });
  });

  formatInputs.forEach(input => {
    input.addEventListener('change', e => {
      currentFormat = e.target.value;
      renderPalette();
    });
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  gradientTypeInputs.forEach(input => {
    input.addEventListener('change', e => {
      currentGradientType = e.target.value;
      updateGradient();
    });
  });

  copyGradientBtn.addEventListener('click', copyGradientCss);

  // ---------- Theme (claro / oscuro) ----------
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    themeToggle.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
    );
    themeToggle.querySelector('.theme-toggle__icon').textContent =
      theme === 'dark' ? '☀️' : '🌙';
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      applyTheme(saved);
      return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

  downloadPngBtn.addEventListener('click', downloadPaletteAsPng);
  printBtn.addEventListener('click', () => window.print());
  shareBtn.addEventListener('click', sharePalette);

  imageInput.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Elegí un archivo de imagen válido');
      return;
    }
    extractPaletteFromImage(file);
  });

  // ---------- Init ----------
  function init() {
    initTheme();
    currentSize = Number(document.querySelector('input[name="palette-size"]:checked').value);
    currentFormat = document.querySelector('input[name="color-format"]:checked').value;

    const loadedFromLink = loadPaletteFromQueryString();
    if (!loadedFromLink) {
      generatePalette();
    }

    renderSavedPalettes();
    renderHistory();
  }

  document.addEventListener('DOMContentLoaded', init);
})();