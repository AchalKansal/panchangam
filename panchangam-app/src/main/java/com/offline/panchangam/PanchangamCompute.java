package com.offline.panchangam;

// Port of astro.js + data.js astronomical engine for use in background notification.
public class PanchangamCompute {

    static final double DEG = Math.PI / 180.0;
    static final double IST = 5.5;

    // ── Name tables ───────────────────────────────────────────────────────────

    static final String[] TITHIS = {
        "Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami",
        "Shashthi","Saptami","Ashtami","Navami","Dashami",
        "Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima",
        "Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami",
        "Shashthi","Saptami","Ashtami","Navami","Dashami",
        "Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Amavasya",
    };

    static final String[] NAKSHATRAS = {
        "Ashwini","Bharani","Krittika","Rohini","Mrigashirsha",
        "Ardra","Punarvasu","Pushya","Ashlesha","Magha",
        "Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati",
        "Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha",
        "Uttara Ashadha","Shravana","Dhanishtha","Shatabhisha",
        "Purva Bhadrapada","Uttara Bhadrapada","Revati",
    };

    static final String[] YOGAS = {
        "Vishkambha","Priti","Ayushman","Saubhagya","Shobhana",
        "Atiganda","Sukarman","Dhriti","Shula","Ganda",
        "Vriddhi","Dhruva","Vyaghata","Harshana","Vajra",
        "Siddhi","Vyatipata","Variyan","Parigha","Shiva",
        "Siddha","Sadhya","Shubha","Shukla","Brahma",
        "Indra","Vaidhriti",
    };

    static final String[] KARANA_MOVABLE = {"Bava","Balava","Kaulava","Taitila","Garaja","Vanija","Vishti"};
    static final String[] KARANA_FIXED   = {"Kimstughna","Shakuni","Chatushpada","Naga"};

    static final String[] VARAS_EN = {"Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"};

    static final int[] RAHU_PERIOD = {8, 2, 7, 5, 6, 4, 3};

    // ── City database (mirrors data.js CITIES array) ──────────────────────────

    static final String[] CITY_NAMES = {
        "New Delhi","Mumbai","Bengaluru","Chennai","Hyderabad","Kolkata",
        "Ahmedabad","Pune","Jaipur","Lucknow","Varanasi","Prayagraj",
        "Haridwar","Mathura","Vrindavan","Tirupati","Madurai","Bhubaneswar",
        "Indore","Bhopal","Nagpur","Patna","Amritsar","Chandigarh",
        "Surat","Coimbatore","Visakhapatnam","Kochi","Trivandrum","Guwahati",
    };

    static final double[] CITY_LAT = {
        28.6139, 19.0760, 12.9716, 13.0827, 17.3850, 22.5726, 23.0225, 18.5204,
        26.9124, 26.8467, 25.3176, 25.4358, 29.9457, 27.4924, 27.5830, 13.6288,
         9.9252, 20.2961, 22.7196, 23.2599, 21.1458, 25.5941, 31.6340, 30.7333,
        21.1702, 11.0168, 17.6868,  9.9312,  8.5241, 26.1445,
    };

    static final double[] CITY_LON = {
        77.2090, 72.8777, 77.5946, 80.2707, 78.4867, 88.3639, 72.5714, 73.8567,
        75.7873, 80.9462, 82.9739, 81.8463, 78.1642, 77.6737, 77.7000, 79.4192,
        78.1198, 85.8245, 75.8577, 77.4126, 79.0882, 85.1376, 74.8723, 76.7794,
        72.8311, 76.9558, 83.2185, 76.2673, 76.9366, 91.7362,
    };

    // ── Festival list (mirrors data.js FESTIVALS) ─────────────────────────────

    private static final String[][] FESTIVALS_DATA = {
        {"2025-01-14","Makar Sankranti"},
        {"2025-01-14","Pongal"},
        {"2025-01-26","Republic Day"},
        {"2025-02-02","Basant Panchami"},
        {"2025-02-26","Maha Shivaratri"},
        {"2025-03-13","Holika Dahan"},
        {"2025-03-14","Holi"},
        {"2025-03-30","Ugadi / Gudi Padwa"},
        {"2025-04-06","Ram Navami"},
        {"2025-04-14","Baisakhi / Tamil New Year"},
        {"2025-04-14","Ambedkar Jayanti"},
        {"2025-04-18","Hanuman Jayanti"},
        {"2025-05-12","Buddha Purnima"},
        {"2025-06-27","Rath Yatra"},
        {"2025-07-10","Guru Purnima"},
        {"2025-08-09","Raksha Bandhan"},
        {"2025-08-15","Independence Day"},
        {"2025-08-16","Janmashtami"},
        {"2025-09-02","Ganesh Chaturthi"},
        {"2025-09-22","Shardiya Navratri begins"},
        {"2025-10-02","Vijaya Dashami (Dussehra)"},
        {"2025-10-02","Gandhi Jayanti"},
        {"2025-10-20","Diwali (Lakshmi Puja)"},
        {"2025-10-21","Govardhan Puja"},
        {"2025-10-22","Bhai Dooj"},
        {"2025-11-02","Chhath Puja"},
        {"2025-11-05","Guru Nanak Jayanti"},
        {"2025-11-05","Kartik Purnima"},
        {"2025-12-25","Christmas"},
        {"2026-01-14","Makar Sankranti"},
        {"2026-01-22","Basant Panchami"},
        {"2026-01-26","Republic Day"},
        {"2026-02-15","Maha Shivaratri"},
        {"2026-03-03","Holika Dahan"},
        {"2026-03-04","Holi"},
        {"2026-03-19","Ugadi / Gudi Padwa"},
        {"2026-03-25","Chaitra Navratri begins"},
        {"2026-04-02","Ram Navami"},
        {"2026-04-14","Baisakhi / Tamil New Year"},
        {"2026-04-14","Ambedkar Jayanti"},
        {"2026-05-01","Hanuman Jayanti"},
        {"2026-05-31","Buddha Purnima"},
        {"2026-08-15","Independence Day"},
        {"2026-08-29","Janmashtami"},
        {"2026-10-02","Gandhi Jayanti"},
        {"2026-10-08","Diwali (Lakshmi Puja)"},
        {"2026-12-25","Christmas"},
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static double norm(double x) { return ((x % 360) + 360) % 360; }

    // ── Astronomical methods (ported from astro.js) ───────────────────────────

    static double jd(int year, int mon, int day, double utcHour) {
        int y = year, m = mon;
        if (m <= 2) { y--; m += 12; }
        int A = y / 100;
        int B = 2 - A + A / 4;
        return Math.floor(365.25 * (y + 4716))
             + Math.floor(30.6001 * (m + 1))
             + day + utcHour / 24.0 + B - 1524.5;
    }

    static double sunLon(double J) {
        double nn = J - 2451545.0;
        double L  = norm(280.460 + 0.9856474 * nn);
        double g  = norm(357.528 + 0.9856003 * nn) * DEG;
        return norm(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
    }

    static double moonLon(double J) {
        double T  = (J - 2451545.0) / 36525.0;
        double Lp = norm(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T);
        double D  = norm(297.8501921 + 445267.1114034  * T - 0.0018819 * T * T);
        double M  = norm(357.5291092 + 35999.0502909   * T - 0.0001536 * T * T);
        double Mp = norm(134.9633964 + 477198.8675055  * T + 0.0087414 * T * T);
        double F  = norm(93.2720950  + 483202.0175233  * T - 0.0036539 * T * T);
        double dL =
             6288774 * Math.sin(Mp * DEG)
           + 1274027 * Math.sin((2 * D - Mp) * DEG)
           +  658314 * Math.sin(2 * D * DEG)
           +  213618 * Math.sin(2 * Mp * DEG)
           -  185116 * Math.sin(M * DEG)
           -  114332 * Math.sin(2 * F * DEG)
           +   58793 * Math.sin((2 * D - 2 * Mp) * DEG)
           +   57066 * Math.sin((2 * D - M - Mp) * DEG)
           +   53322 * Math.sin((2 * D + Mp) * DEG)
           +   45758 * Math.sin((2 * D - M) * DEG)
           -   40923 * Math.sin((M - Mp) * DEG)
           -   34720 * Math.sin(D * DEG)
           -   30383 * Math.sin((M + Mp) * DEG);
        return norm(Lp + dL / 1e6);
    }

    static double ayanamsa(double J) {
        return 23.92 + (J - 2451545.0) / 36525.0 * 0.01397;
    }

    static int tithi(double sL, double mL)      { return (int) Math.floor(norm(mL - sL) / 12) + 1; }
    static int nakshatra(double mL, double ay)  { return (int) Math.floor(norm(mL - ay) * 27 / 360); }
    static int yoga(double sL, double mL, double ay) { return (int) Math.floor(norm(sL + mL - 2 * ay) * 27 / 360); }
    static int karana(double sL, double mL)     { return ((int) Math.floor(norm(mL - sL) / 6)) % 60; }

    // Returns {sunriseUTC, sunsetUTC} in fractional hours, or null for polar extremes.
    static double[] sunriseSunset(int year, int mon, int day, double lat, double lon) {
        double J   = jd(year, mon, day, 12);
        double T   = (J - 2451545.0) / 36525.0;
        double L0  = norm(280.46646 + 36000.76983 * T);
        double M_  = norm(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
        double Mr  = M_ * DEG;
        double C   = (1.914602 - 0.004817 * T) * Math.sin(Mr)
                   + 0.019993 * Math.sin(2 * Mr)
                   + 0.000289 * Math.sin(3 * Mr);
        double om  = norm(125.04 - 1934.136 * T);
        double lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om * DEG);
        double e0  = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
        double eps = e0 + 0.00256 * Math.cos(om * DEG);
        double dec = Math.asin(Math.sin(eps * DEG) * Math.sin(lam * DEG));
        double yy  = Math.tan(eps / 2 * DEG) * Math.tan(eps / 2 * DEG);
        double L0r = L0 * DEG;
        double eot = 4 * (yy * Math.sin(2 * L0r)
                        - 2 * 0.016708634 * Math.sin(Mr)
                        + 4 * 0.016708634 * yy * Math.sin(Mr) * Math.cos(2 * L0r)
                        - 0.5 * yy * yy * Math.sin(4 * L0r)
                        - 1.25 * 0.016708634 * 0.016708634 * Math.sin(2 * Mr)) / DEG;
        double latR  = lat * DEG;
        double cosHA = Math.cos(90.833 * DEG) / (Math.cos(latR) * Math.cos(dec))
                     - Math.tan(latR) * Math.tan(dec);
        if (cosHA < -1 || cosHA > 1) return null;
        double HA   = Math.acos(cosHA) / DEG;
        double noon = 720 - 4 * lon - eot;
        return new double[]{(noon - 4 * HA) / 60, (noon + 4 * HA) / 60};
    }

    static String karanaName(int idx) {
        if (idx == 0) return KARANA_FIXED[0];
        if (idx >= 57) return KARANA_FIXED[idx - 56];
        return KARANA_MOVABLE[(idx - 1) % 7];
    }

    // Format UTC fractional hour as IST 12-hour string.
    static String fmtHour(double utcH) {
        int totalMin = (int) Math.round((utcH + IST) * 60);
        int hh = (totalMin / 60) % 24;
        int mm = totalMin % 60;
        String ap = hh >= 12 ? "PM" : "AM";
        int h12 = hh % 12;
        if (h12 == 0) h12 = 12;
        return h12 + ":" + String.format("%02d", mm) + " " + ap;
    }

    // Returns comma-separated festival names on the given date, or empty string.
    static String todayFestival(int year, int month1, int day) {
        String today = String.format("%04d-%02d-%02d", year, month1, day);
        StringBuilder sb = new StringBuilder();
        for (String[] f : FESTIVALS_DATA) {
            if (f[0].equals(today)) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(f[1]);
            }
        }
        return sb.toString();
    }

    static int vikramSamvat(int year, int month0, int day) {
        int[][] ugadi = {{2023,3,22},{2024,4,9},{2025,2,30},{2026,2,19},{2027,3,7},{2028,3,25},{2029,3,14}};
        int uMon = 3, uDay = 2;
        for (int[] u : ugadi) {
            if (u[0] == year) { uMon = u[1]; uDay = u[2]; break; }
        }
        boolean after = month0 > uMon || (month0 == uMon && day >= uDay);
        return year + (after ? 57 : 56);
    }

    // ── High-level: compute today's panchanga for notification text ───────────

    static String buildNotificationText(int cityIndex) {
        java.util.Calendar cal = java.util.Calendar.getInstance();
        int y  = cal.get(java.util.Calendar.YEAR);
        int mo = cal.get(java.util.Calendar.MONTH) + 1; // 1-indexed
        int dy = cal.get(java.util.Calendar.DAY_OF_MONTH);
        int wd = cal.get(java.util.Calendar.DAY_OF_WEEK) - 1; // 0=Sun

        // Astronomical data at current UTC moment
        long nowMs = cal.getTimeInMillis();
        double utcH = cal.get(java.util.Calendar.HOUR_OF_DAY)
                    + cal.get(java.util.Calendar.MINUTE) / 60.0
                    + cal.get(java.util.Calendar.SECOND) / 3600.0;
        // Subtract timezone offset to get UTC
        int tzOffsetMs = cal.getTimeZone().getOffset(nowMs);
        double utcActual = utcH - tzOffsetMs / 3600000.0;

        double J  = jd(y, mo, dy, utcActual);
        double sL = sunLon(J);
        double mL = moonLon(J);
        double ay = ayanamsa(J);

        int tIdx = tithi(sL, mL);
        int nIdx = nakshatra(mL, ay);
        int yIdx = yoga(sL, mL, ay);
        String paksha = tIdx <= 15 ? "Shukla" : "Krishna";
        int tNum = tIdx <= 15 ? tIdx : tIdx - 15;

        // Sunrise / Rahu Kalam
        String sunriseStr = "–";
        String rahuStr    = "–";
        double lat = CITY_LAT[cityIndex];
        double lon = CITY_LON[cityIndex];
        double[] ss = sunriseSunset(y, mo, dy, lat, lon);
        if (ss != null) {
            double srH = ss[0] + IST;
            double stH = ss[1] + IST;
            sunriseStr = fmtHour(ss[0]);
            double dayPart = (stH - srH) / 8.0;
            int rp = RAHU_PERIOD[wd];
            double rahuStart = srH + (rp - 1) * dayPart;
            double rahuEnd   = srH + rp * dayPart;
            rahuStr = fmtLocalHour(rahuStart) + " – " + fmtLocalHour(rahuEnd);
        }

        String festival = todayFestival(y, mo, dy);

        StringBuilder sb = new StringBuilder();
        sb.append(VARAS_EN[wd]).append(" · ");
        sb.append(paksha).append(" ").append(tNum).append(" · ");
        sb.append(TITHIS[tIdx - 1]).append("\n");
        sb.append("Nakshatra: ").append(NAKSHATRAS[nIdx]).append("\n");
        sb.append("Yoga: ").append(YOGAS[yIdx]).append("\n");
        sb.append("Sunrise: ").append(sunriseStr).append("  ·  Rahu Kalam: ").append(rahuStr);
        if (!festival.isEmpty()) {
            sb.append("\n🪔 ").append(festival);
        }
        return sb.toString();
    }

    static String fmtLocalHour(double localH) {
        int totalMin = (int) Math.round(localH * 60);
        int hh = (totalMin / 60) % 24;
        int mm = totalMin % 60;
        String ap = hh >= 12 ? "PM" : "AM";
        int h12 = hh % 12;
        if (h12 == 0) h12 = 12;
        return h12 + ":" + String.format("%02d", mm) + " " + ap;
    }
}
