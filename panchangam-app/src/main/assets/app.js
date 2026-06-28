'use strict';

// IST offset from UTC in hours
const IST = 5.5;

// ── Persistence ───────────────────────────────────────────────────────────────

function loadSettings() {
  try { return JSON.parse(localStorage.getItem('panch_settings') || 'null'); } catch (_) { return null; }
}
function saveSettings(s) {
  localStorage.setItem('panch_settings', JSON.stringify(s));
}

// ── State ─────────────────────────────────────────────────────────────────────

let currentPanchData = null; // last computed panchanga — used by anga row tap handlers

let settings = loadSettings() || {
  cityIndex: 0,     // index into CITIES
  theme: 'saffron',
  calYear:  null,
  calMonth: null,
  notifEnabled: true,
  notifHour: 7,
};

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtHour(utcH) {
  const totalMin = Math.round((utcH + IST) * 60);
  const hh = Math.floor(totalMin / 60) % 24;
  const mm = totalMin % 60;
  const ap = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return h12 + ':' + String(mm).padStart(2, '0') + ' ' + ap;
}

function fmtLocalHour(localH) {
  const totalMin = Math.round(localH * 60);
  const hh = Math.floor(totalMin / 60) % 24;
  const mm = totalMin % 60;
  const ap = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return h12 + ':' + String(mm).padStart(2, '0') + ' ' + ap;
}

function fmtEndTime(hoursFromNow) {
  if (hoursFromNow <= 0) return '';
  const now = new Date();
  const end = new Date(now.getTime() + hoursFromNow * 3600000);
  const eH  = end.getHours() + end.getMinutes() / 60;
  const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
  if (end < midnight) return 'Until ' + fmtLocalHour(eH) + ' today';
  const tmMidnight = new Date(midnight); tmMidnight.setDate(tmMidnight.getDate() + 1);
  if (end < tmMidnight) return 'Until ' + fmtLocalHour(eH) + ' tomorrow';
  return 'Over 2 days';
}

function fmtDate(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtFestDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Share as image ────────────────────────────────────────────────────────────

function drawShareCard(p) {
  const W = 720;

  // Determine if there are festivals today
  const todayIso = p.date.getFullYear() + '-'
    + String(p.date.getMonth() + 1).padStart(2, '0') + '-'
    + String(p.date.getDate()).padStart(2, '0');
  const fests = FESTIVALS.filter(f => f.date === todayIso);

  const H = fests.length > 0 ? 1000 : 930;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Palette (fixed saffron brand) ──
  const BG      = '#FFF8E7';
  const CARD    = '#FFFFFF';
  const TEXT    = '#2D1400';
  const MUTED   = '#8B6040';
  const ACCENT  = '#E65C00';
  const GOLD    = '#C87000';
  const BORDER  = 'rgba(0,0,0,0.09)';

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Header gradient
  const grad = ctx.createLinearGradient(0, 0, W, 168);
  grad.addColorStop(0, '#E65C00');
  grad.addColorStop(1, '#FF8C00');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 168);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('ॐ Panchangam', 36, 52);

  ctx.font = 'bold 19px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.97)';
  ctx.fillText(fmtDate(p.date), 36, 86);

  ctx.font = '15px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.80)';
  ctx.fillText('Vikram Samvat ' + p.vs + ' · ' + p.lunarM + ' · ' + p.paksha, 36, 114);
  ctx.fillText(p.city.name, 36, 140);

  let y = 188;

  // Sunrise / Sunset card
  roundRect(24, y, W - 48, 76, 14);
  ctx.fillStyle = CARD;
  ctx.fill();

  if (p.sunriseH !== null) {
    ctx.textAlign = 'left';
    ctx.fillStyle = MUTED;
    ctx.font = '600 11px sans-serif';
    ctx.fillText('SUNRISE', 48, y + 24);
    ctx.fillStyle = ACCENT;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(fmtLocalHour(p.sunriseH), 48, y + 54);

    ctx.textAlign = 'right';
    ctx.fillStyle = MUTED;
    ctx.font = '600 11px sans-serif';
    ctx.fillText('SUNSET', W - 48, y + 24);
    ctx.fillStyle = ACCENT;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(fmtLocalHour(p.sunsetH), W - 48, y + 54);
    ctx.textAlign = 'left';
  }

  y += 94;

  // Section label
  ctx.fillStyle = MUTED;
  ctx.font = '700 11px sans-serif';
  ctx.fillText('PANCHA ANGA', 24, y + 2);
  y += 18;

  // Anga rows
  const angaRows = [
    { lbl: 'Tithi',      dev: 'तिथि', val: TITHIS[p.tithiIdx - 1],       sub: (p.tithiIdx <= 15 ? 'Shukla ' : 'Krishna ') + (p.tithiIdx <= 15 ? p.tithiIdx : p.tithiIdx - 15) },
    { lbl: 'Vara',       dev: 'वार',       val: VARAS[p.wd],                   sub: VARAS_EN[p.wd] },
    { lbl: 'Nakshatra',  dev: 'नक्षत्र', val: NAKSHATRAS[p.nakshatraIdx], sub: '' },
    { lbl: 'Yoga',       dev: 'योग',       val: YOGAS[p.yogaIdx],              sub: '' },
    { lbl: 'Karana',     dev: 'करण',       val: karanaName(p.karanaIdx),        sub: '' },
    { lbl: 'Surya Rashi',dev: 'राशि', val: RASHIS[p.rashiIdx],             sub: '' },
  ];
  const rowH   = 68;
  const cardH  = angaRows.length * rowH;

  roundRect(24, y, W - 48, cardH, 16);
  ctx.fillStyle = CARD;
  ctx.fill();

  angaRows.forEach(function(row, i) {
    const ry = y + i * rowH;
    if (i > 0) {
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(48, ry);
      ctx.lineTo(W - 48, ry);
      ctx.stroke();
    }
    // Devanagari label
    ctx.fillStyle = ACCENT;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(row.dev, 48, ry + 26);
    ctx.fillStyle = MUTED;
    ctx.font = '600 10px sans-serif';
    ctx.fillText(row.lbl.toUpperCase(), 48, ry + 44);
    // Value
    ctx.fillStyle = TEXT;
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(row.val, W - 48, ry + 26);
    if (row.sub) {
      ctx.fillStyle = MUTED;
      ctx.font = '13px sans-serif';
      ctx.fillText(row.sub, W - 48, ry + 44);
    }
  });
  ctx.textAlign = 'left';

  y += cardH + 22;

  // Festival badge (if any)
  if (fests.length) {
    roundRect(24, y, W - 48, 60, 12);
    ctx.fillStyle = '#FFF3E0';
    ctx.fill();
    // Left accent bar
    ctx.fillStyle = ACCENT;
    ctx.fillRect(24, y + 10, 5, 40);
    ctx.fillStyle = ACCENT;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(fests.map(function(f){return f.name;}).join(' · '), 44, y + 36);
    y += 76;
  }

  // Footer
  ctx.fillStyle = MUTED;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('— Panchangam App', W / 2, H - 30);
  ctx.textAlign = 'left';

  return canvas;
}

function shareToday() {
  const p = computeToday();
  const canvas = drawShareCard(p);
  const base64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
  if (window.Android && typeof Android.shareImage === 'function') {
    Android.shareImage(base64);
  }
}

// Called by MainActivity after page load to sync native (SharedPreferences) settings into UI.
window.applyNativeSettings = function(notifEnabled, notifHour) {
  settings.notifEnabled = notifEnabled;
  settings.notifHour    = notifHour;
  saveSettings(settings);
  // Update the settings panel UI if it happens to be open.
  const toggle = document.getElementById('notifToggle');
  const hourSel = document.getElementById('notifHourSelect');
  if (toggle) toggle.checked = notifEnabled;
  if (hourSel) hourSel.value = String(notifHour);
};

// ── Core computation ──────────────────────────────────────────────────────────

function computeToday() {
  const now   = new Date();
  const city  = CITIES[settings.cityIndex];
  const y     = now.getFullYear();
  const mo    = now.getMonth() + 1;
  const dy    = now.getDate();
  const wd    = now.getDay(); // 0=Sun

  // Sun/moon at current UTC moment
  const J     = Astro.jdOfDate(now);
  const sL    = Astro.sunLon(J);
  const mL    = Astro.moonLon(J);
  const ay    = Astro.ayanamsa(J);

  const tithiIdx    = Astro.tithi(sL, mL);         // 1-30
  const nakshatraIdx = Astro.nakshatra(mL, ay);     // 0-26 (sidereal)
  const yogaIdx     = Astro.yoga(sL, mL, ay);       // 0-26 (sidereal)
  const karanaIdx   = Astro.karana(sL, mL);         // 0-59
  const rashiIdx    = Astro.rashi(sL, ay);           // 0-11 (sidereal)

  const tEnd   = Astro.tithiEndsInHours(sL, mL);
  const nEnd   = Astro.nakshatraEndsInHours(mL, ay);

  const paksha = tithiIdx <= 15 ? 'Shukla Paksha' : 'Krishna Paksha';
  const lunarM = LUNAR_MONTHS[rashiIdx];
  const vs     = vikramSamvat(now);

  // Sunrise / sunset
  const ss = Astro.sunriseSunset(y, mo, dy, city.lat, city.lon);
  let sunriseH = null, sunsetH = null;
  if (ss) {
    sunriseH = ss.sunriseUTC + IST;
    sunsetH  = ss.sunsetUTC  + IST;
  }

  // Inauspicious kalams (local hours)
  let rahuTime = null, yamaTime = null, gulikaTime = null;
  if (sunriseH !== null) {
    rahuTime   = kalamTime(RAHU_PERIOD[wd],   sunriseH, sunsetH);
    yamaTime   = kalamTime(YAMA_PERIOD[wd],   sunriseH, sunsetH);
    gulikaTime = kalamTime(GULIKA_PERIOD[wd], sunriseH, sunsetH);
  }

  // Auspicious timings
  let brahmaMuhurta = null, abhijitMuhurta = null;
  if (sunriseH !== null) {
    brahmaMuhurta  = { start: sunriseH - 1.6, end: sunriseH - 0.8 };
    const solarNoon = (sunriseH + sunsetH) / 2;
    abhijitMuhurta = { start: solarNoon - 0.4, end: solarNoon + 0.4 };
  }

  return {
    date: now, city, wd,
    tithiIdx, nakshatraIdx, yogaIdx, karanaIdx, rashiIdx,
    paksha, lunarM, vs,
    tEnd, nEnd,
    sunriseH, sunsetH,
    rahuTime, yamaTime, gulikaTime,
    brahmaMuhurta, abhijitMuhurta,
    mL, ay,
  };
}

// ── Tab: Today ────────────────────────────────────────────────────────────────

// ── Anga descriptions ─────────────────────────────────────────────────────────

function showAngaDesc(type) {
  if (!currentPanchData) return;
  const p = currentPanchData;
  let title, subtitle, desc;

  if (type === 'tithi') {
    title    = TITHIS[p.tithiIdx - 1];
    subtitle = (p.tithiIdx <= 15 ? 'Shukla ' : 'Krishna ') + (p.tithiIdx <= 15 ? p.tithiIdx : p.tithiIdx - 15) + ' · Tithi';
    desc     = TITHI_DESCS[p.tithiIdx - 1];
  } else if (type === 'vara') {
    title    = VARAS[p.wd];
    subtitle = VARAS_EN[p.wd] + ' · Vara';
    desc     = VARA_DESCS[p.wd];
  } else if (type === 'nakshatra') {
    title    = NAKSHATRAS[p.nakshatraIdx];
    subtitle = 'Nakshatra';
    desc     = NAKSHATRA_DESCS[p.nakshatraIdx];
  } else if (type === 'yoga') {
    title    = YOGAS[p.yogaIdx];
    subtitle = 'Yoga';
    desc     = YOGA_DESCS[p.yogaIdx];
  } else if (type === 'karana') {
    const kn = karanaName(p.karanaIdx);
    title    = kn;
    subtitle = 'Karana';
    desc     = KARANA_DESCS[kn] || 'A half-tithi period in the Hindu lunar calendar.';
  } else if (type === 'rashi') {
    title    = RASHIS[p.rashiIdx];
    subtitle = 'Surya Rashi · Solar Sign';
    desc     = RASHI_DESCS[p.rashiIdx];
  }

  document.getElementById('angaDescTitle').textContent    = title    || '';
  document.getElementById('angaDescSubtitle').textContent = subtitle || '';
  document.getElementById('angaDescBody').textContent     = desc     || '';
  document.getElementById('angaDescOverlay').classList.remove('hidden');
  document.getElementById('angaDescPanel').classList.remove('hidden');
}

function closeAngaDesc() {
  document.getElementById('angaDescOverlay').classList.add('hidden');
  document.getElementById('angaDescPanel').classList.add('hidden');
}

// ── Tab: Today ────────────────────────────────────────────────────────────────

function renderToday(p) {
  const el = id => document.getElementById(id);

  // Header date info
  el('todayDate').textContent = fmtDate(p.date);
  el('todaySamvat').textContent =
    'Vikram Samvat ' + p.vs + ' · ' + p.lunarM + ' · ' + p.paksha;
  el('todayCity').textContent = p.city.name;

  // Sunrise / Sunset
  if (p.sunriseH !== null) {
    el('sunriseVal').textContent = fmtLocalHour(p.sunriseH);
    el('sunsetVal').textContent  = fmtLocalHour(p.sunsetH);
  } else {
    el('sunriseVal').textContent = '–';
    el('sunsetVal').textContent  = '–';
  }

  // Tithi
  el('tithiName').textContent = TITHIS[p.tithiIdx - 1];
  el('tithiNum').textContent  = p.tithiIdx === 30 ? 'Amavasya'
    : p.paksha === 'Shukla Paksha' ? 'Shukla ' + p.tithiIdx
    : 'Krishna ' + (p.tithiIdx - 15);
  el('tithiEnd').textContent  = fmtEndTime(p.tEnd);

  // Vara
  el('varaName').textContent = VARAS[p.wd] + ' (' + VARAS_EN[p.wd] + ')';

  // Nakshatra
  el('nakshatraName').textContent = NAKSHATRAS[p.nakshatraIdx];
  el('nakshatraEnd').textContent  = fmtEndTime(p.nEnd);

  // Yoga
  el('yogaName').textContent  = YOGAS[p.yogaIdx];

  // Karana
  el('karanaName').textContent = karanaName(p.karanaIdx);

  // Rashi (solar)
  el('rashiName').textContent = RASHIS[p.rashiIdx];

  // Rahu Kaal quick card
  var rahuQuickEl = document.getElementById('rahuQuickTime');
  if (rahuQuickEl) {
    rahuQuickEl.textContent = p.rahuTime
      ? fmtLocalHour(p.rahuTime.start) + ' – ' + fmtLocalHour(p.rahuTime.end)
      : 'N/A';
  }

  // Next vrat countdown
  var nextVratEl = document.getElementById('nextVratInfo');
  if (nextVratEl) {
    var nextVrats = upcomingVrats(new Date(), 15);
    if (nextVrats.length) {
      var nv = nextVrats[0];
      var vd = new Date(nv.date + 'T00:00:00');
      var todayMid = new Date(p.date.getFullYear(), p.date.getMonth(), p.date.getDate());
      var diff = Math.round((vd - todayMid) / 86400000);
      if (diff === 0) {
        nextVratEl.textContent = nv.name + ' · Today';
      } else if (diff === 1) {
        nextVratEl.textContent = nv.name + ' · Tomorrow';
      } else {
        nextVratEl.textContent = nv.name + ' · ' + diff + ' days';
      }
    } else {
      nextVratEl.textContent = 'None upcoming';
    }
  }

  // Panchak banner — Moon sidereal longitude >= 296.67° means Panchak
  var panchakBannerEl = document.getElementById('panchakBanner');
  if (panchakBannerEl && p.mL !== undefined && p.ay !== undefined) {
    var siderealMoon = ((p.mL - p.ay) % 360 + 360) % 360;
    panchakBannerEl.classList.toggle('hidden', siderealMoon < 296.67);
  }

  // Store for anga row tap handlers
  currentPanchData = p;
}

// ── Tab: Timings ──────────────────────────────────────────────────────────────

function renderTimings(p) {
  function kalamRow(t) {
    if (!t) return '–';
    return fmtLocalHour(t.start) + ' – ' + fmtLocalHour(t.end);
  }
  document.getElementById('timingCity').textContent = p.city.name;
  document.getElementById('rahuVal').textContent   = kalamRow(p.rahuTime);
  document.getElementById('yamaVal').textContent   = kalamRow(p.yamaTime);
  document.getElementById('gulikaVal').textContent = kalamRow(p.gulikaTime);
  document.getElementById('brahmaVal').textContent = kalamRow(p.brahmaMuhurta);
  document.getElementById('abhijitVal').textContent = kalamRow(p.abhijitMuhurta);

  // Current-time highlight for kalam rows
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  function markActive(elementId, t) {
    if (!t) return;
    const row = document.getElementById(elementId).closest('.timing-row');
    if (row) row.classList.toggle('active-kalam', nowH >= t.start && nowH < t.end);
  }
  markActive('rahuVal',    p.rahuTime);
  markActive('yamaVal',    p.yamaTime);
  markActive('gulikaVal',  p.gulikaTime);
  markActive('brahmaVal',  p.brahmaMuhurta);
  markActive('abhijitVal', p.abhijitMuhurta);
}

// ── Tab: Calendar ─────────────────────────────────────────────────────────────

function renderCalendar(year, month, city) {
  // month is 0-indexed here (JS Date style)
  const mo1 = month + 1;

  document.getElementById('calMonthLabel').textContent =
    new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  // Day headers
  ['S','M','T','W','T','F','S'].forEach(d => {
    const h = document.createElement('div');
    h.className = 'cal-hdr';
    h.textContent = d;
    grid.appendChild(h);
  });

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Empty cells before day 1
  for (let i = 0; i < firstWeekday; i++) {
    const blank = document.createElement('div');
    blank.className = 'cal-cell empty';
    grid.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    // Compute tithi at noon IST = 06:30 UTC for this day
    const J   = Astro.jd(year, mo1, day, 6.5);
    const sL  = Astro.sunLon(J);
    const mL  = Astro.moonLon(J);
    const t   = Astro.tithi(sL, mL);
    const isShukla = t <= 15;
    const tLabel = isShukla ? t : (t - 15);

    const isToday = (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day);

    const cell = document.createElement('div');
    cell.className = 'cal-cell' + (isToday ? ' today' : '');

    const dn = document.createElement('span');
    dn.className = 'cal-day';
    dn.textContent = day;

    const tn = document.createElement('span');
    tn.className = 'cal-tithi' + (isShukla ? ' shukla' : ' krishna');
    tn.textContent = tLabel;

    cell.appendChild(dn);
    cell.appendChild(tn);

    // Festival marker
    const dayIso = year + '-' + String(mo1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
    const fest = FESTIVALS.find(f => f.date === dayIso);
    if (fest) {
      const dot = document.createElement('span');
      dot.className = 'cal-fest-dot';
      dot.title = fest.name;
      cell.appendChild(dot);
    }

    // Tap a date → show that day's panchanga
    cell.addEventListener('click', () => showDayDetail(year, mo1, day));

    grid.appendChild(cell);
  }
}

// ── Day detail sheet ──────────────────────────────────────────────────────────

function showDayDetail(year, mo1, day) {
  const city = CITIES[settings.cityIndex];

  // Astronomical data at noon IST for this day
  const J  = Astro.jd(year, mo1, day, 6.5);
  const sL = Astro.sunLon(J);
  const mL = Astro.moonLon(J);
  const ay = Astro.ayanamsa(J);

  const tithiIdx    = Astro.tithi(sL, mL);            // 1-30
  const nakshatraIdx = Astro.nakshatra(mL, ay);        // 0-26 (sidereal)
  const yogaIdx     = Astro.yoga(sL, mL, ay);          // 0-26 (sidereal)
  const karanaIdx   = Astro.karana(sL, mL);            // 0-59
  const paksha      = tithiIdx <= 15 ? 'Shukla' : 'Krishna';
  const tLabel      = tithiIdx <= 15 ? tithiIdx : (tithiIdx - 15);
  const tithiName   = TITHIS[tithiIdx - 1];

  // Sunrise / sunset
  const ss = Astro.sunriseSunset(year, mo1, day, city.lat, city.lon);
  const srStr = ss ? fmtHour(ss.sunriseUTC) : '–';
  const ssStr = ss ? fmtHour(ss.sunsetUTC)  : '–';

  // Weekday
  const wd = new Date(year, mo1 - 1, day).getDay();

  // Fill the panel
  const dt = new Date(year, mo1 - 1, day);
  document.getElementById('dayDetailDate').textContent =
    dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('dayDetailSamvat').textContent =
    paksha + ' Paksha · ' + VARAS[wd];

  document.getElementById('dayDetailSunrise').textContent = '🌅 ' + srStr;
  document.getElementById('dayDetailSunset').textContent  = '🌇 ' + ssStr;

  // Anga rows
  const angas = document.getElementById('dayDetailAngas');
  angas.innerHTML = '';
  const rows = [
    ['Tithi',     paksha + ' ' + tLabel + ' · ' + tithiName],
    ['Nakshatra', NAKSHATRAS[nakshatraIdx]],
    ['Yoga',      YOGAS[yogaIdx]],
    ['Karana',    karanaName(karanaIdx)],
  ];
  rows.forEach(([key, val]) => {
    const row = document.createElement('div');
    row.className = 'day-detail-row';
    row.innerHTML = '<span class="day-detail-key">' + key + '</span>'
                  + '<span class="day-detail-val">' + val  + '</span>';
    angas.appendChild(row);
  });

  // Festival(s) on this day
  const dayIso = year + '-' + String(mo1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
  const fests  = FESTIVALS.filter(f => f.date === dayIso);
  const festEl = document.getElementById('dayDetailFest');
  if (fests.length) {
    festEl.textContent = '🪔 ' + fests.map(f => f.name).join(' · ');
    festEl.classList.remove('hidden');
  } else {
    festEl.classList.add('hidden');
  }

  document.getElementById('dayDetailOverlay').classList.remove('hidden');
  document.getElementById('dayDetailPanel').classList.remove('hidden');
}

function closeDayDetail() {
  document.getElementById('dayDetailOverlay').classList.add('hidden');
  document.getElementById('dayDetailPanel').classList.add('hidden');
}

// ── Tab: Festivals ────────────────────────────────────────────────────────────

function renderFestivals() {
  const list  = document.getElementById('festList');
  list.innerHTML = '';
  const items = upcomingFestivals(new Date(), 30);
  if (!items.length) { list.textContent = 'No upcoming festivals found.'; return; }

  items.forEach(f => {
    const row = document.createElement('div');
    row.className = 'fest-row ' + (f.type === 'major' ? 'fest-major' : f.type === 'national' ? 'fest-national' : 'fest-regional');

    const dateSpan = document.createElement('span');
    dateSpan.className = 'fest-date';
    dateSpan.textContent = fmtFestDate(f.date);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'fest-name';
    nameSpan.textContent = f.name;

    const badge = document.createElement('span');
    badge.className = 'fest-badge';
    badge.textContent = f.type === 'major' ? 'Hindu' : f.type === 'national' ? 'National' : 'Regional';

    row.appendChild(dateSpan);
    row.appendChild(nameSpan);
    row.appendChild(badge);
    list.appendChild(row);
  });
}

// ── Tab: Panchak & Shradh ─────────────────────────────────────────────────────

function renderPanchakShradh() {
  var listEl = document.getElementById('panchakShraddhaList');
  if (!listEl) return;
  listEl.innerHTML = '';

  var panchaks  = upcomingPanchak(new Date(), 60);
  var shraddhas = upcomingShradh(new Date());

  if (!panchaks.length && !shraddhas.length) {
    var msg = document.createElement('div');
    msg.className = 'panchak-empty';
    msg.textContent = 'No Panchak or Pitru Paksha periods in the next 60 days.';
    listEl.appendChild(msg);
    return;
  }

  panchaks.forEach(function(period) {
    var row = document.createElement('div');
    row.className = 'panchak-row';

    var top = document.createElement('div');
    top.className = 'panchak-top';

    var badge = document.createElement('span');
    badge.className = 'panchak-badge';
    badge.textContent = 'Panchak';

    var dateSpan = document.createElement('span');
    dateSpan.className = 'panchak-date';
    dateSpan.textContent = period.end
      ? fmtFestDate(period.start) + ' – ' + fmtFestDate(period.end)
      : 'From ' + fmtFestDate(period.start);

    top.appendChild(badge);
    top.appendChild(dateSpan);

    var descDiv = document.createElement('div');
    descDiv.className = 'panchak-desc';
    descDiv.textContent = 'Moon in Dhanishtha–Revati (last 5 nakshatras). Avoid beginning major new work, south-facing construction, or long south-bound journeys during this period.';

    row.appendChild(top);
    row.appendChild(descDiv);
    listEl.appendChild(row);
  });

  shraddhas.forEach(function(period) {
    var row = document.createElement('div');
    row.className = 'shradh-row';

    var top = document.createElement('div');
    top.className = 'panchak-top';

    var badge = document.createElement('span');
    badge.className = 'shradh-badge';
    badge.textContent = 'Pitru Paksha';

    var dateSpan = document.createElement('span');
    dateSpan.className = 'panchak-date';
    dateSpan.textContent = fmtFestDate(period.start) + ' – ' + fmtFestDate(period.end);

    top.appendChild(badge);
    top.appendChild(dateSpan);

    var nameDiv = document.createElement('div');
    nameDiv.className = 'shradh-name';
    nameDiv.textContent = period.name;

    var descDiv = document.createElement('div');
    descDiv.className = 'panchak-desc';
    descDiv.textContent = period.desc;

    row.appendChild(top);
    row.appendChild(nameDiv);
    row.appendChild(descDiv);
    listEl.appendChild(row);
  });
}

// ── Tab: Vrats ────────────────────────────────────────────────────────────────

function renderVrats() {
  const list = document.getElementById('vratList');
  list.innerHTML = '';
  const items = upcomingVrats(new Date(), 60);
  if (!items.length) { list.textContent = 'No upcoming vrats found.'; return; }

  items.forEach(function(v) {
    const row = document.createElement('div');
    row.className = 'vrat-row';

    const top = document.createElement('div');
    top.className = 'vrat-top';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'vrat-date';
    dateSpan.textContent = fmtFestDate(v.date);

    const tithiSpan = document.createElement('span');
    tithiSpan.className = 'vrat-tithi-badge';
    tithiSpan.textContent = v.tithiName;

    top.appendChild(dateSpan);
    top.appendChild(tithiSpan);

    const nameDiv = document.createElement('div');
    nameDiv.className = 'vrat-name';
    nameDiv.textContent = v.name;

    const hindiDiv = document.createElement('div');
    hindiDiv.className = 'vrat-hindi';
    hindiDiv.textContent = v.hindiName;

    const descDiv = document.createElement('div');
    descDiv.className = 'vrat-desc';
    descDiv.textContent = v.desc;

    row.appendChild(top);
    row.appendChild(nameDiv);
    row.appendChild(hindiDiv);
    row.appendChild(descDiv);
    list.appendChild(row);
  });
}

// ── City picker ───────────────────────────────────────────────────────────────

function buildCityPicker() {
  const sel = document.getElementById('citySelect');
  sel.innerHTML = '';
  CITIES.forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = c.name;
    if (i === settings.cityIndex) opt.selected = true;
    sel.appendChild(opt);
  });
}

// ── Settings panel ────────────────────────────────────────────────────────────

function openSettings() {
  buildCityPicker();
  document.querySelectorAll('.theme-opt').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === settings.theme);
  });
  const toggle = document.getElementById('notifToggle');
  const hourSel = document.getElementById('notifHourSelect');
  if (toggle) toggle.checked = settings.notifEnabled !== false;
  if (hourSel) hourSel.value = String(settings.notifHour || 7);
  document.getElementById('settingsOverlay').classList.remove('hidden');
  document.getElementById('settingsPanel').classList.remove('hidden');
}
function closeSettings() {
  document.getElementById('settingsOverlay').classList.add('hidden');
  document.getElementById('settingsPanel').classList.add('hidden');
}
function applyTheme(t) {
  document.body.className = t;
}

// ── Tab switching ─────────────────────────────────────────────────────────────

function switchTab(tab) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('pane-' + tab).classList.remove('hidden');
  document.querySelector('.tab-btn[data-tab="' + tab + '"]').classList.add('active');
}

// ── Insets (native → CSS) ─────────────────────────────────────────────────────

function applyInsets(topPx, bottomPx) {
  document.documentElement.style.setProperty('--inset-top',    topPx    + 'px');
  document.documentElement.style.setProperty('--inset-bottom', bottomPx + 'px');
}
window.applyInsets = applyInsets;

// ── Boot ──────────────────────────────────────────────────────────────────────

function boot() {
  applyTheme(settings.theme);

  const panchData = computeToday();
  renderToday(panchData);
  renderTimings(panchData);

  const now = new Date();
  settings.calYear  = now.getFullYear();
  settings.calMonth = now.getMonth();
  renderCalendar(settings.calYear, settings.calMonth, CITIES[settings.cityIndex]);

  renderFestivals();
  renderVrats();
  renderPanchakShradh();

  // Tab bar
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Anga row tap → description panel
  document.querySelectorAll('.anga-tappable').forEach(function(row) {
    row.addEventListener('click', function() { showAngaDesc(row.dataset.type); });
  });
  document.getElementById('angaDescOverlay').addEventListener('click', closeAngaDesc);
  document.getElementById('angaDescClose').addEventListener('click', closeAngaDesc);

  // Calendar prev/next
  document.getElementById('calPrev').addEventListener('click', () => {
    settings.calMonth--;
    if (settings.calMonth < 0) { settings.calMonth = 11; settings.calYear--; }
    renderCalendar(settings.calYear, settings.calMonth, CITIES[settings.cityIndex]);
  });
  document.getElementById('calNext').addEventListener('click', () => {
    settings.calMonth++;
    if (settings.calMonth > 11) { settings.calMonth = 0; settings.calYear++; }
    renderCalendar(settings.calYear, settings.calMonth, CITIES[settings.cityIndex]);
  });
  document.getElementById('calToday').addEventListener('click', () => {
    const n = new Date();
    settings.calYear = n.getFullYear(); settings.calMonth = n.getMonth();
    renderCalendar(settings.calYear, settings.calMonth, CITIES[settings.cityIndex]);
  });

  // Share
  document.getElementById('shareBtn').addEventListener('click', shareToday);

  // Settings
  document.getElementById('dayDetailOverlay').addEventListener('click', closeDayDetail);

  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('settingsOverlay').addEventListener('click', closeSettings);
  document.getElementById('cancelSettingsBtn').addEventListener('click', closeSettings);

  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const sel     = document.getElementById('citySelect');
    const toggle  = document.getElementById('notifToggle');
    const hourSel = document.getElementById('notifHourSelect');
    settings.cityIndex    = parseInt(sel.value);
    settings.notifEnabled = toggle ? toggle.checked : true;
    settings.notifHour    = hourSel ? parseInt(hourSel.value) : 7;
    closeSettings();
    saveSettings(settings);
    // Sync notification prefs and alarm to native layer.
    if (window.Android && typeof Android.saveNativeSettings === 'function') {
      Android.saveNativeSettings(settings.cityIndex, settings.notifEnabled, settings.notifHour);
    }
    // Re-render everything with new city
    const p = computeToday();
    renderToday(p);
    renderTimings(p);
    renderCalendar(settings.calYear, settings.calMonth, CITIES[settings.cityIndex]);
  });

  document.querySelectorAll('.theme-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      settings.theme = btn.dataset.theme;
      applyTheme(settings.theme);
      saveSettings(settings);
      document.querySelectorAll('.theme-opt').forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  // Auto-refresh panchanga each minute
  setInterval(() => {
    const p = computeToday();
    renderToday(p);
    renderTimings(p);
  }, 60000);
}

boot();
