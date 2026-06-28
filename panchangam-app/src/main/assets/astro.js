'use strict';

// Pure astronomical engine — no DOM, no side effects.
// Angles in degrees; JD = Julian Day Number.

const Astro = (() => {
  const DEG = Math.PI / 180;

  function r(deg) { return deg * DEG; }
  function n(x)   { return ((x % 360) + 360) % 360; }   // normalize 0-360

  // Julian Day from UTC components
  function jd(year, mon, day, utcHour) {
    utcHour = utcHour || 0;
    let y = year, m = mon;
    if (m <= 2) { y--; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716))
         + Math.floor(30.6001 * (m + 1))
         + day + utcHour / 24.0 + B - 1524.5;
  }

  // JD for a JS Date object
  function jdOfDate(date) {
    return jd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
              date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600);
  }

  // Sun's ecliptic longitude (degrees) — accurate to ~1'
  function sunLon(J) {
    const nn = J - 2451545.0;
    const L = n(280.460 + 0.9856474 * nn);
    const g = r(n(357.528 + 0.9856003 * nn));
    return n(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
  }

  // Moon's ecliptic longitude (degrees) — accurate to ~0.3°
  function moonLon(J) {
    const T = (J - 2451545.0) / 36525.0;
    let Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
    let D  = 297.8501921 + 445267.1114034  * T - 0.0018819 * T * T;
    let M  = 357.5291092 + 35999.0502909   * T - 0.0001536 * T * T;
    let Mp = 134.9633964 + 477198.8675055  * T + 0.0087414 * T * T;
    let F  = 93.2720950  + 483202.0175233  * T - 0.0036539 * T * T;
    [Lp, D, M, Mp, F] = [Lp, D, M, Mp, F].map(n);
    const dL =
        6288774 * Math.sin(r(Mp))
      + 1274027 * Math.sin(r(2 * D - Mp))
      +  658314 * Math.sin(r(2 * D))
      +  213618 * Math.sin(r(2 * Mp))
      -  185116 * Math.sin(r(M))
      -  114332 * Math.sin(r(2 * F))
      +   58793 * Math.sin(r(2 * D - 2 * Mp))
      +   57066 * Math.sin(r(2 * D - M - Mp))
      +   53322 * Math.sin(r(2 * D + Mp))
      +   45758 * Math.sin(r(2 * D - M))
      -   40923 * Math.sin(r(M - Mp))
      -   34720 * Math.sin(r(D))
      -   30383 * Math.sin(r(M + Mp));
    return n(Lp + dL / 1e6);
  }

  // Sunrise & sunset — NOAA algorithm.
  // Returns { sunriseUTC, sunsetUTC } in fractional hours, or null for polar extremes.
  function sunriseSunset(year, mon, day, lat, lon) {
    const J = jd(year, mon, day, 12);          // compute at solar noon
    const T = (J - 2451545.0) / 36525.0;

    const L0  = n(280.46646 + 36000.76983 * T);
    const M_  = n(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
    const Mr  = r(M_);
    const C   = (1.914602 - 0.004817 * T) * Math.sin(Mr)
              + 0.019993 * Math.sin(2 * Mr)
              + 0.000289 * Math.sin(3 * Mr);
    const om  = n(125.04 - 1934.136 * T);
    const lam = L0 + C - 0.00569 - 0.00478 * Math.sin(r(om));
    const e0  = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = e0 + 0.00256 * Math.cos(r(om));
    const dec = Math.asin(Math.sin(r(eps)) * Math.sin(r(lam)));

    const y_   = Math.tan(r(eps / 2)) * Math.tan(r(eps / 2));
    const L0r  = r(L0);
    const eot  = 4 * (y_ * Math.sin(2 * L0r)
                     - 2 * 0.016708634 * Math.sin(Mr)
                     + 4 * 0.016708634 * y_ * Math.sin(Mr) * Math.cos(2 * L0r)
                     - 0.5 * y_ * y_ * Math.sin(4 * L0r)
                     - 1.25 * 0.016708634 * 0.016708634 * Math.sin(2 * Mr)) / DEG;

    const latR  = r(lat);
    const cosHA = (Math.cos(r(90.833)) / (Math.cos(latR) * Math.cos(dec)))
                - Math.tan(latR) * Math.tan(dec);
    if (cosHA < -1 || cosHA > 1) return null;

    const HA   = Math.acos(cosHA) / DEG;
    const noon = 720 - 4 * lon - eot;       // minutes from UTC midnight
    return {
      sunriseUTC: (noon - 4 * HA) / 60,
      sunsetUTC:  (noon + 4 * HA) / 60,
    };
  }

  // ── Panchanga computations ──────────────────────────────────────────────────

  // Lahiri ayanamsa (~23.92° in 2025-26). Advances ~0.014°/year from 2025 baseline.
  // Subtracting from tropical longitude gives sidereal (nirayana) longitude,
  // required for nakshatra, yoga, and rashi. Tithi/karana use moon-sun difference
  // so the ayanamsa cancels and tropical values are fine for those.
  function ayanamsa(J) {
    return 23.92 + (J - 2451545.0) / 36525.0 * 0.01397;
  }

  // Tithi 1-30  (1-15 Shukla, 16-30 Krishna; 15=Purnima, 30=Amavasya)
  function tithi(sL, mL) { return Math.floor(n(mL - sL) / 12) + 1; }

  // Nakshatra 0-26  (sidereal moon longitude required)
  function nakshatra(mL, ay) { return Math.floor(n(mL - ay) * 27 / 360); }

  // Yoga 0-26  (sidereal sun + moon; ayanamsa applied twice)
  function yoga(sL, mL, ay) { return Math.floor(n(sL + mL - 2 * ay) * 27 / 360); }

  // Karana 0-59
  function karana(sL, mL) { return Math.floor(n(mL - sL) / 6) % 60; }

  // Approximate hours until the current tithi ends (moon travels ~12.19 deg/day relative to sun)
  function tithiEndsInHours(sL, mL) {
    const remaining = 12 - (n(mL - sL) % 12);
    return remaining / (12.19 / 24);
  }

  // Approximate hours until the current nakshatra ends (moon travels ~13.17 deg/day)
  function nakshatraEndsInHours(mL, ay) {
    const w = 360 / 27;
    const remaining = w - (n(mL - ay) % w);
    return remaining / (13.17 / 24);
  }

  // Rashi (solar month) 0-11  (sidereal sun longitude required)
  function rashi(sL, ay) { return Math.floor(n(sL - ay) / 30); }

  return {
    jd, jdOfDate, sunLon, moonLon, sunriseSunset, ayanamsa,
    tithi, nakshatra, yoga, karana, rashi,
    tithiEndsInHours, nakshatraEndsInHours,
  };
})();
