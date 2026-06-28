'use strict';

// ── Sanskrit names ────────────────────────────────────────────────────────────

const TITHIS = [
  'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami',
  'Shashthi','Saptami','Ashtami','Navami','Dashami',
  'Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima',   // Shukla 1-15
  'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami',
  'Shashthi','Saptami','Ashtami','Navami','Dashami',
  'Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Amavasya',  // Krishna 1-15
];

const NAKSHATRAS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashirsha',
  'Ardra','Punarvasu','Pushya','Ashlesha','Magha',
  'Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati',
  'Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha',
  'Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha',
  'Purva Bhadrapada','Uttara Bhadrapada','Revati',
];

const YOGAS = [
  'Vishkambha','Priti','Ayushman','Saubhagya','Shobhana',
  'Atiganda','Sukarman','Dhriti','Shula','Ganda',
  'Vriddhi','Dhruva','Vyaghata','Harshana','Vajra',
  'Siddhi','Vyatipata','Variyan','Parigha','Shiva',
  'Siddha','Sadhya','Shubha','Shukla','Brahma',
  'Indra','Vaidhriti',
];

// Movable karanas (repeat 8 times from karana index 1; indices 0,57,58,59 are fixed)
const KARANA_MOVABLE = ['Bava','Balava','Kaulava','Taitila','Garaja','Vanija','Vishti'];
const KARANA_FIXED   = ['Kimstughna','Shakuni','Chatushpada','Naga'];

function karanaName(idx) {
  if (idx === 0) return KARANA_FIXED[0];        // Kimstughna
  if (idx >= 57) return KARANA_FIXED[idx - 56]; // Shakuni / Chatushpada / Naga
  return KARANA_MOVABLE[(idx - 1) % 7];
}

const VARAS = ['Ravivar','Somvar','Mangalvar','Budhvar','Guruvar','Shukravar','Shanivar'];
const VARAS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const RASHIS = [
  'Mesha (Aries)','Vrishabha (Taurus)','Mithuna (Gemini)','Karka (Cancer)',
  'Simha (Leo)','Kanya (Virgo)','Tula (Libra)','Vrishchika (Scorpio)',
  'Dhanu (Sagittarius)','Makara (Capricorn)','Kumbha (Aquarius)','Meena (Pisces)',
];

const LUNAR_MONTHS = [
  'Chaitra','Vaishakha','Jyeshtha','Ashadha',
  'Shravana','Bhadrapada','Ashwina','Kartika',
  'Margashirsha','Pausha','Magha','Phalguna',
];

// ── Vikram Samvat ─────────────────────────────────────────────────────────────

function vikramSamvat(date) {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed
  const d = date.getDate();
  // Actual Ugadi / Chaitra Shukla Pratipada dates [month-0-indexed, day] by CE year.
  // Fallback for unknown years: April 2 as a safe midpoint approximation.
  const ugadi = {
    2023:[3,22], 2024:[4,9], 2025:[2,30],
    2026:[2,19], 2027:[3,7], 2028:[3,25], 2029:[3,14],
  };
  const u = ugadi[y] || [3, 2];
  const newYearStarted = m > u[0] || (m === u[0] && d >= u[1]);
  return y + (newYearStarted ? 57 : 56);
}

// ── Inauspicious kalam periods ────────────────────────────────────────────────
// Each value is the 1-indexed 8th-part of the day (1 = first part after sunrise)

const RAHU_PERIOD   = [8, 2, 7, 5, 6, 4, 3]; // index by weekday (0=Sun)
const YAMA_PERIOD   = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_PERIOD = [7, 6, 5, 4, 3, 2, 1];

// Given period index (1-8), sunrise and sunset in local hours, return {start, end} in local hours
function kalamTime(period, sunriseH, sunsetH) {
  const part = (sunsetH - sunriseH) / 8;
  return {
    start: sunriseH + (period - 1) * part,
    end:   sunriseH +  period      * part,
  };
}

// ── City database ─────────────────────────────────────────────────────────────

const CITIES = [
  { name: 'New Delhi',      lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai',         lat: 19.0760, lon: 72.8777 },
  { name: 'Bengaluru',      lat: 12.9716, lon: 77.5946 },
  { name: 'Chennai',        lat: 13.0827, lon: 80.2707 },
  { name: 'Hyderabad',      lat: 17.3850, lon: 78.4867 },
  { name: 'Kolkata',        lat: 22.5726, lon: 88.3639 },
  { name: 'Ahmedabad',      lat: 23.0225, lon: 72.5714 },
  { name: 'Pune',           lat: 18.5204, lon: 73.8567 },
  { name: 'Jaipur',         lat: 26.9124, lon: 75.7873 },
  { name: 'Lucknow',        lat: 26.8467, lon: 80.9462 },
  { name: 'Varanasi',       lat: 25.3176, lon: 82.9739 },
  { name: 'Prayagraj',      lat: 25.4358, lon: 81.8463 },
  { name: 'Haridwar',       lat: 29.9457, lon: 78.1642 },
  { name: 'Mathura',        lat: 27.4924, lon: 77.6737 },
  { name: 'Vrindavan',      lat: 27.5830, lon: 77.7000 },
  { name: 'Tirupati',       lat: 13.6288, lon: 79.4192 },
  { name: 'Madurai',        lat:  9.9252, lon: 78.1198 },
  { name: 'Bhubaneswar',    lat: 20.2961, lon: 85.8245 },
  { name: 'Indore',         lat: 22.7196, lon: 75.8577 },
  { name: 'Bhopal',         lat: 23.2599, lon: 77.4126 },
  { name: 'Nagpur',         lat: 21.1458, lon: 79.0882 },
  { name: 'Patna',          lat: 25.5941, lon: 85.1376 },
  { name: 'Amritsar',       lat: 31.6340, lon: 74.8723 },
  { name: 'Chandigarh',     lat: 30.7333, lon: 76.7794 },
  { name: 'Surat',          lat: 21.1702, lon: 72.8311 },
  { name: 'Coimbatore',     lat: 11.0168, lon: 76.9558 },
  { name: 'Visakhapatnam',  lat: 17.6868, lon: 83.2185 },
  { name: 'Kochi',          lat:  9.9312, lon: 76.2673 },
  { name: 'Trivandrum',     lat:  8.5241, lon: 76.9366 },
  { name: 'Guwahati',       lat: 26.1445, lon: 91.7362 },
];

// ── Festival list 2025-2026 ───────────────────────────────────────────────────
// Format: { date: 'YYYY-MM-DD', name: 'Sanskrit / common name', type: 'major'|'national'|'regional' }

const FESTIVALS = [
  // 2025
  { date: '2025-01-14', name: 'Makar Sankranti',              type: 'major' },
  { date: '2025-01-14', name: 'Pongal',                       type: 'regional' },
  { date: '2025-01-26', name: 'Republic Day',                 type: 'national' },
  { date: '2025-02-02', name: 'Basant Panchami (Saraswati Puja)', type: 'major' },
  { date: '2025-02-26', name: 'Maha Shivaratri',              type: 'major' },
  { date: '2025-03-13', name: 'Holika Dahan',                 type: 'major' },
  { date: '2025-03-14', name: 'Holi',                         type: 'major' },
  { date: '2025-03-30', name: 'Ugadi / Gudi Padwa',           type: 'major' },
  { date: '2025-03-30', name: 'Chaitra Navratri begins',      type: 'major' },
  { date: '2025-04-06', name: 'Ram Navami',                   type: 'major' },
  { date: '2025-04-14', name: 'Baisakhi / Tamil New Year',   type: 'major' },
  { date: '2025-04-14', name: 'Ambedkar Jayanti',             type: 'national' },
  { date: '2025-04-18', name: 'Hanuman Jayanti',              type: 'major' },
  { date: '2025-05-12', name: 'Buddha Purnima',               type: 'major' },
  { date: '2025-06-27', name: 'Rath Yatra',                   type: 'major' },
  { date: '2025-07-10', name: 'Guru Purnima',                 type: 'major' },
  { date: '2025-08-09', name: 'Raksha Bandhan',               type: 'major' },
  { date: '2025-08-15', name: 'Independence Day',             type: 'national' },
  { date: '2025-08-16', name: 'Janmashtami',                  type: 'major' },
  { date: '2025-09-02', name: 'Ganesh Chaturthi',             type: 'major' },
  { date: '2025-09-22', name: 'Shardiya Navratri begins',     type: 'major' },
  { date: '2025-10-02', name: 'Vijaya Dashami (Dussehra)',    type: 'major' },
  { date: '2025-10-02', name: 'Gandhi Jayanti',               type: 'national' },
  { date: '2025-10-20', name: 'Diwali (Lakshmi Puja)',        type: 'major' },
  { date: '2025-10-21', name: 'Govardhan Puja',               type: 'major' },
  { date: '2025-10-22', name: 'Bhai Dooj',                    type: 'major' },
  { date: '2025-11-02', name: 'Chhath Puja',                  type: 'major' },
  { date: '2025-11-05', name: 'Guru Nanak Jayanti',           type: 'major' },
  { date: '2025-11-05', name: 'Kartik Purnima',               type: 'major' },
  { date: '2025-12-25', name: 'Christmas',                    type: 'national' },
  // 2026
  { date: '2026-01-14', name: 'Makar Sankranti',              type: 'major' },
  { date: '2026-01-22', name: 'Basant Panchami',              type: 'major' },
  { date: '2026-01-26', name: 'Republic Day',                 type: 'national' },
  { date: '2026-02-15', name: 'Maha Shivaratri',              type: 'major' },
  { date: '2026-03-03', name: 'Holika Dahan',                 type: 'major' },
  { date: '2026-03-04', name: 'Holi',                         type: 'major' },
  { date: '2026-03-19', name: 'Ugadi / Gudi Padwa',           type: 'major' },
  { date: '2026-03-25', name: 'Chaitra Navratri begins',      type: 'major' },
  { date: '2026-04-02', name: 'Ram Navami',                   type: 'major' },
  { date: '2026-04-14', name: 'Baisakhi / Tamil New Year',   type: 'major' },
  { date: '2026-04-14', name: 'Ambedkar Jayanti',             type: 'national' },
  { date: '2026-05-01', name: 'Hanuman Jayanti',              type: 'major' },
  { date: '2026-05-31', name: 'Buddha Purnima',               type: 'major' },
  { date: '2026-08-15', name: 'Independence Day',             type: 'national' },
  { date: '2026-08-29', name: 'Janmashtami',                  type: 'major' },
  { date: '2026-10-02', name: 'Gandhi Jayanti',               type: 'national' },
  { date: '2026-10-08', name: 'Diwali (Lakshmi Puja)',        type: 'major' },
  { date: '2026-12-25', name: 'Christmas',                    type: 'national' },
];

// ── Anga descriptions ─────────────────────────────────────────────────────────

const TITHI_DESCS = [
  // Shukla 1–15
  'First day of the bright fortnight (Shukla Paksha). Auspicious for starting new ventures. Dedicated to the Moon — good for fresh beginnings.',
  'Second lunar day. Favorable for travel, hospitality, and new relationships. Associated with the Earth element.',
  'Third lunar day. Auspicious for marriage ceremonies, music, and celebrations. Associated with Goddess Gauri (Parvati).',
  'Fourth lunar day, sacred to Lord Ganesha. Vinayaka Chaturthi is observed with fasting. Removes obstacles and brings prosperity.',
  'Fifth lunar day. Associated with serpent deities (Nagas) on Naga Panchami. Dedicated to Goddess Saraswati on Vasant Panchami.',
  'Sixth lunar day. Auspicious for worshipping the Sun and Kartikeya (Murugan). Skanda Shashthi is a major festival.',
  'Seventh lunar day. Sacred to the Sun God (Surya). Rath Saptami is a key solar festival.',
  'Eighth lunar day. Sacred to Goddess Durga (Durgashtami). Devotees fast and worship Shakti for strength and protection.',
  'Ninth lunar day. Dedicated to Goddess Durga. Ram Navami celebrates Lord Rama\'s birth on Shukla Navami of Chaitra month.',
  'Tenth lunar day. Auspicious for new ventures. Vijaya Dashami (Dussehra) falls on Shukla Dashami of Ashwina.',
  'Eleventh lunar day — most sacred fast for Lord Vishnu. Devotees abstain from grains and beans. Night vigil with Vishnu Sahasranama is observed.',
  'Twelfth lunar day follows Ekadashi. Sacred to Lord Vishnu. The fast is broken at the prescribed time (Parana). Auspicious for new work.',
  'Thirteenth lunar day (Trayodashi). Pradosh Vrat is observed for Lord Shiva at twilight — approximately 90 minutes after sunset.',
  'Fourteenth lunar day. Associated with Lord Shiva. Maha Shivaratri falls on Krishna Chaturdashi, the most important night for Shiva worship.',
  'Full Moon (Purnima) — the most auspicious tithi. Sacred for all deities. Ideal for charity, Satyanarayan puja, and all spiritual practices.',
  // Krishna 1–15
  'First day of the dark fortnight (Krishna Paksha). The Moon begins to wane. Suitable for introspection and wrapping up ongoing work.',
  'Second day of Krishna Paksha. Good for travel and completing ongoing tasks.',
  'Third day of Krishna Paksha. Suitable for routine activities and family matters.',
  'Fourth day of Krishna Paksha — Sankashti Chaturthi. Monthly fast for Lord Ganesha. The fast is broken after sighting the Moon at night.',
  'Fifth day of Krishna Paksha. Associated with ancestral rituals and introspection.',
  'Sixth day of Krishna Paksha. Suitable for regular activities and prayers.',
  'Seventh day of Krishna Paksha. Good for travel and completing ongoing work.',
  'Eighth day of Krishna Paksha. Associated with Lord Krishna — Janmashtami falls on this tithi in Bhadrapada. Also sacred to Goddess Durga.',
  'Ninth day of Krishna Paksha. Auspicious for Devi worship and contemplation.',
  'Tenth day of Krishna Paksha. Suitable for completing important activities.',
  'Eleventh day of Krishna Paksha — Krishna Ekadashi. Equally sacred as Shukla Ekadashi for Lord Vishnu fast. Different Ekadashis carry specific names.',
  'Twelfth day of Krishna Paksha. Follows Ekadashi. Vishnu puja after breaking the fast. Sacred and favorable.',
  'Thirteenth day of Krishna Paksha — Masik Shivaratri / Masik Pradosh. Evening fast for Lord Shiva with night-long puja.',
  'Fourteenth day of Krishna Paksha. Intense Shiva energy — one day before the New Moon.',
  'New Moon (Amavasya). Sacred for ancestral rites (Pitru Tarpan). Offering water and sesame seeds to ancestors on this day is most meritorious.',
];

const VARA_DESCS = [
  'Sunday is dedicated to the Sun God (Surya). Auspicious for health, vitality, and success. Devotees wear orange or red, offer red flowers to Surya, and may observe a partial fast.',
  'Monday is dedicated to Lord Shiva. Most auspicious day for Shiva worship. Somvar Vrat is widely observed — devotees fast and recite the Shiva Chalisa or Maha Mrityunjaya mantra.',
  'Tuesday is dedicated to Lord Hanuman and the planet Mars (Mangal). Auspicious for courage and overcoming obstacles. Hanuman Chalisa is recited and sindoor (vermilion) offered to Hanuman.',
  'Wednesday is dedicated to Mercury (Budha) and Lord Ganesha. Favorable for intellect, business, education, and communication. Offering durva grass to Ganesha is recommended.',
  'Thursday is dedicated to Lord Vishnu and the divine teacher Brihaspati (Jupiter). Auspicious for spiritual learning, seeking a guru\'s blessings, and charitable activities.',
  'Friday is dedicated to Goddess Lakshmi and Santoshi Maa. Auspicious for wealth, beauty, and feminine blessings. Shukravar Vrat is observed by women for prosperity and marital happiness.',
  'Saturday is dedicated to Lord Shani (Saturn). Shanivar Vrat is observed to reduce Saturn\'s malefic influence. Oil and black sesame seeds are offered to Shani for protection and good karma.',
];

const NAKSHATRA_DESCS = [
  'Ashwini — Ruled by Ketu. Deity: Ashwini Kumars (divine physicians). Symbol: horse head. Auspicious for healing, travel, learning, and fresh starts.',
  'Bharani — Ruled by Venus. Deity: Yama (god of dharma). Symbol: yoni. Associated with endurance, the cycle of birth and death, and transformation.',
  'Krittika — Ruled by Sun. Deity: Agni (fire). Symbol: razor or flame. The \'Star of Fire\'. Good for purification, cooking, and determined effort.',
  'Rohini — Ruled by Moon. Deity: Brahma. Symbol: chariot. The Moon\'s own nakshatra and most beloved. Excellent for agriculture, growth, and starting projects.',
  'Mrigashirsha — Ruled by Mars. Deity: Soma (Moon god). Symbol: deer head. Associated with gentle seeking, sensitivity, and artistic beauty.',
  'Ardra — Ruled by Rahu. Deity: Rudra (storm Shiva). Symbol: teardrop. Associated with storms, grief, and radical transformation. Avoid new ventures.',
  'Punarvasu — Ruled by Jupiter. Deity: Aditi (mother of gods). Symbol: bow and quiver. The \'Star of Renewal\'. Excellent for travel, return journeys, and restoration.',
  'Pushya — Ruled by Saturn. Deity: Brihaspati. Symbol: flower, circle. The most auspicious nakshatra. Excellent for all ceremonies, new ventures, and nourishment.',
  'Ashlesha — Ruled by Mercury. Deity: Nagas (serpent deities). Symbol: coiled serpent. Associated with deep intuition, secrets, and caution.',
  'Magha — Ruled by Ketu. Deity: Pitrs (ancestors). Symbol: royal throne. Associated with royal power, ancestral reverence, and authority.',
  'Purva Phalguni — Ruled by Venus. Deity: Bhaga (delight). Symbol: swinging hammock. Associated with creativity, romance, and leisure.',
  'Uttara Phalguni — Ruled by Sun. Deity: Aryaman. Symbol: bed or two legs. Associated with social contracts, marriage alliances, and prosperity.',
  'Hasta — Ruled by Moon. Deity: Savitar (creative sun). Symbol: open hand. Excellent for healing, skilled crafts, and careful detailed work.',
  'Chitra — Ruled by Mars. Deity: Vishvakarma (divine architect). Symbol: bright jewel. Associated with beauty, brilliance, and fine craftsmanship.',
  'Swati — Ruled by Rahu. Deity: Vayu (wind). Symbol: young plant shoot. Associated with independence, movement, and flexible energy.',
  'Vishakha — Ruled by Jupiter. Deity: Indra and Agni. Symbol: potter\'s wheel. Associated with determination, ambition, and persistence.',
  'Anuradha — Ruled by Saturn. Deity: Mitra (friendship). Symbol: lotus, triumphal arch. Associated with devotion, friendship, and success through cooperation.',
  'Jyeshtha — Ruled by Mercury. Deity: Indra (king of gods). Symbol: circular earring. Associated with seniority, protective power, and wisdom.',
  'Mula — Ruled by Ketu. Deity: Nirriti (dissolution). Symbol: elephant goad. Associated with deep investigation, digging to roots, and transformation.',
  'Purva Ashadha — Ruled by Venus. Deity: Apas (water). Symbol: elephant tusk. Associated with purification, courage, and early stages of victory.',
  'Uttara Ashadha — Ruled by Sun. Deity: Vishvedevas. Symbol: elephant tusk. Associated with final victory, perseverance, and ultimate righteousness.',
  'Shravana — Ruled by Moon. Deity: Vishnu. Symbol: ear, three footprints. The \'Listening Star\' — sacred to Vishnu; excellent for learning and devotion.',
  'Dhanishtha — Ruled by Mars. Deity: Eight Vasus. Symbol: drum. Associated with wealth, music, rhythm, and abundant energy.',
  'Shatabhisha — Ruled by Rahu. Deity: Varuna (cosmic law). Symbol: empty circle. The \'Hundred Physicians\'. Associated with healing and mysticism.',
  'Purva Bhadrapada — Ruled by Jupiter. Deity: Aja Ekapada. Symbol: swords, two faces. Associated with spiritual fire and intense transformation.',
  'Uttara Bhadrapada — Ruled by Saturn. Deity: Ahir Budhnya (serpent of the deep). Symbol: twins. Associated with depth, hidden wisdom, and compassion.',
  'Revati — Ruled by Mercury. Deity: Pushan (journeys). Symbol: drum, fish. The final nakshatra — \'The Wealthy\'. Auspicious for completions, travel, and liberation.',
];

const YOGA_DESCS = [
  'Vishkambha — Inauspicious yoga. Can bring obstacles, delays, and confrontations. Best avoided for starting new ventures.',
  'Priti — Auspicious yoga meaning \'love\'. Excellent for relationships, social activities, and pleasant gatherings.',
  'Ayushman — Auspicious yoga meaning \'long-lived\'. Excellent for health matters, long-term investments, and enduring projects.',
  'Saubhagya — Auspicious yoga meaning \'good fortune\'. Excellent for all auspicious activities, new beginnings, and seeking blessings.',
  'Shobhana — Auspicious yoga meaning \'brilliant\'. Favorable for creative works, beauty treatments, and celebrations.',
  'Atiganda — Inauspicious yoga. Its name means \'great danger\'. Avoid risky activities and major financial decisions.',
  'Sukarman — Auspicious yoga meaning \'good karma\'. Excellent for charitable acts, spiritual practices, and meritorious deeds.',
  'Dhriti — Auspicious yoga meaning \'perseverance\'. Favorable for completing ongoing projects and honoring commitments.',
  'Shula — Inauspicious yoga meaning \'thorn\'. Avoid confrontations and difficult decisions during this period.',
  'Ganda — Inauspicious yoga. Can bring troubles. Exercise caution in all important activities.',
  'Vriddhi — Auspicious yoga meaning \'growth\'. Excellent for business expansion, farming, and starting new growth-oriented ventures.',
  'Dhruva — Highly auspicious yoga meaning \'fixed\'. Excellent for long-term commitments, property purchases, and stable investments.',
  'Vyaghata — Inauspicious yoga meaning \'obstructed\'. Avoid making major decisions or starting significant new work.',
  'Harshana — Auspicious yoga meaning \'joy\'. Excellent for celebrations, weddings, and all joyful occasions.',
  'Vajra — Mixed yoga meaning \'thunderbolt\'. Powerful — good for determined efforts, but can also bring sudden unexpected events.',
  'Siddhi — Highly auspicious yoga meaning \'accomplishment\'. Activities started now are very likely to succeed. Excellent for all endeavors.',
  'Vyatipata — Most inauspicious yoga. Named \'fallen from the path\'. One of two most feared yogas. Strictly avoid all auspicious activities and new ventures.',
  'Variyan — Auspicious yoga meaning \'excellence\'. Favorable for important decisions, seeking authority, and high-value activities.',
  'Parigha — Inauspicious yoga meaning \'iron bar\'. Obstacles appear from all sides. Avoid new ventures, travel, and major decisions.',
  'Shiva — Highly auspicious yoga named after Lord Shiva. Excellent for spiritual practices, worship, and deep meditation.',
  'Siddha — Highly auspicious yoga meaning \'perfected\'. Activities tend to achieve their intended purpose. Excellent for all meaningful work.',
  'Sadhya — Auspicious yoga meaning \'achievable\'. Good for practical goal-setting and realistically attainable undertakings.',
  'Shubha — Auspicious yoga meaning \'auspicious\'. Good for all positive and beneficial activities.',
  'Shukla — Auspicious yoga meaning \'bright and pure\'. Excellent for new beginnings, purification ceremonies, and clarity of mind.',
  'Brahma — Highly auspicious yoga named after Brahma. Excellent for education, creative projects, wisdom, and spiritual knowledge.',
  'Indra — Highly auspicious yoga named after Indra (king of gods). Excellent for leadership, overcoming challenges, and decisive victories.',
  'Vaidhriti — Most inauspicious yoga alongside Vyatipata. Called a \'poison yoga\'. Strictly avoid all auspicious activities, new ventures, and travel.',
];

const KARANA_DESCS = {
  'Bava':        'Movable karana ruled by the Sun. Generally auspicious for all activities, especially those requiring vitality and forward momentum.',
  'Balava':      'Movable karana ruled by the Moon. Auspicious for creative work, emotional healing, and relationship-oriented activities.',
  'Kaulava':     'Movable karana associated with family and community. Good for domestic matters and social gatherings.',
  'Taitila':     'Movable karana associated with the sesame plant. Suitable for routine daily work, purification, and steady ongoing tasks.',
  'Garaja':      'Movable karana symbolized by a donkey. Moderate karana for steady, persistent effort.',
  'Vanija':      'Movable karana meaning \'merchant\'. Most auspicious for commerce, trade, business negotiations, and financial matters.',
  'Vishti':      'Movable karana also called Bhadra. The only inauspicious movable karana — traditionally avoided for new ventures, auspicious ceremonies, and important journeys.',
  'Kimstughna':  'Fixed karana occurring at the very start of Shukla Pratipada (new month). Generally auspicious for all activities.',
  'Shakuni':     'Fixed karana near the end of the lunar month. Associated with cunning and protective strategies.',
  'Chatushpada': 'Fixed karana meaning \'four-footed\'. Associated with animals and the natural world. Suitable for agriculture and nature-related activities.',
  'Naga':        'Fixed karana meaning \'serpent\'. Occurs at the end of Amavasya. Worship of serpent deities (Naga Devatas) on this day is especially beneficial.',
};

const RASHI_DESCS = [
  'Mesha (Aries) — First solar sign, ruled by Mars (Mangal). Symbol: Ram. Associated with initiative, courage, and leadership. The Sun enters Mesha at Mesha Sankranti, marking the Hindu solar new year.',
  'Vrishabha (Taurus) — Second sign, ruled by Venus (Shukra). Symbol: Bull. Associated with patience, steadfastness, material prosperity, and love of beauty.',
  'Mithuna (Gemini) — Third sign, ruled by Mercury (Budha). Symbol: Couple. Associated with communication, duality, versatility, and quick intellect.',
  'Karka (Cancer) — Fourth sign, ruled by Moon (Chandra). Symbol: Crab. Associated with emotions, nourishment, home, family, and intuitive sensitivity.',
  'Simha (Leo) — Fifth sign, ruled by Sun (Surya). Symbol: Lion. Associated with power, authority, generosity, and natural leadership. The Sun\'s own sign.',
  'Kanya (Virgo) — Sixth sign, ruled by Mercury (Budha). Symbol: Virgin. Associated with service, discrimination, healing, and perfectionism.',
  'Tula (Libra) — Seventh sign, ruled by Venus (Shukra). Symbol: Scales. Associated with balance, justice, beauty, partnerships, and harmony.',
  'Vrishchika (Scorpio) — Eighth sign, ruled by Mars (Mangal). Symbol: Scorpion. Associated with transformation, depth, intense energy, and hidden knowledge.',
  'Dhanu (Sagittarius) — Ninth sign, ruled by Jupiter (Guru). Symbol: Archer. Associated with philosophy, higher learning, long journeys, and spirituality.',
  'Makara (Capricorn) — Tenth sign, ruled by Saturn (Shani). Symbol: Sea-goat. Associated with discipline, ambition, and worldly success. Makar Sankranti marks the Sun\'s entry here.',
  'Kumbha (Aquarius) — Eleventh sign, ruled by Saturn (Shani). Symbol: Water-bearer. Associated with humanitarianism, innovation, detachment, and universal ideals.',
  'Meena (Pisces) — Twelfth sign, ruled by Jupiter (Guru). Symbol: Two fish. Associated with spirituality, intuition, compassion, and liberation (Moksha). The most spiritual sign.',
];

// ── Vrat (fast) definitions ───────────────────────────────────────────────────
// Tithis 1-15 = Shukla, 16-30 = Krishna

const VRAT_TITHIS = {
  4:  { name: 'Vinayaka Chaturthi',  hindiName: 'विनायक चतुर्थी',
        desc: 'Monthly fast for Lord Ganesha (Shukla Paksha). Worship Ganesha with modak offerings and durva grass. Removes obstacles and grants blessings.' },
  8:  { name: 'Shukla Ashtami',      hindiName: 'शुक्ल अष्टमी',
        desc: 'The eighth day of the bright fortnight. Sacred to Goddess Durga. Devotees fast and perform Devi puja for strength and divine protection.' },
  11: { name: 'Shukla Ekadashi',     hindiName: 'शुक्ल एकादशी',
        desc: 'Most sacred Vishnu fast. Devotees abstain from grains and beans. Night vigil with Vishnu Sahasranama or Bhagavad Gita recitation is observed. Each Ekadashi has its own name and specific merit.' },
  13: { name: 'Shukla Pradosh',      hindiName: 'शुक्ल प्रदोष',
        desc: 'Pradosh Vrat for Lord Shiva on the 13th bright day. Shiva puja is performed at the twilight hour (Pradosh Kaal — about 90 min after sunset). Fast is kept through the day.' },
  15: { name: 'Purnima',             hindiName: 'पूर्णिमा',
        desc: 'Full Moon — most auspicious tithi. Satyanarayan puja is widely observed. Ideal for charity, sacred river baths, and all spiritual practices. Each Purnima is named after its lunar month.' },
  19: { name: 'Sankashti Chaturthi', hindiName: 'संकष्टी चतुर्थी',
        desc: 'Monthly Ganesha fast on Krishna Chaturthi. \'Sankashti\' means liberation from difficulties. The fast is broken after sighting the Moon at night. Highly popular across India.' },
  23: { name: 'Krishna Ashtami',     hindiName: 'कृष्ण अष्टमी',
        desc: 'Eighth day of the dark fortnight. Janmashtami (Lord Krishna\'s birth) falls on Krishna Ashtami of Bhadrapada. Also sacred to Goddess Durga each month.' },
  26: { name: 'Krishna Ekadashi',    hindiName: 'कृष्ण एकादशी',
        desc: 'Vishnu fast on the dark fortnight\'s 11th day. Equally sacred as Shukla Ekadashi. Specific Ekadashis like Nirjala, Devshayani, and Devprabodhini carry special significance.' },
  28: { name: 'Masik Shivaratri',    hindiName: 'मासिक शिवरात्रि',
        desc: 'Monthly Shiva night on Krishna Trayodashi (Pradosh). Night fasting and Shiva puja are observed. Maha Shivaratri — the great one in Magha/Phalguna — is the most important of all.' },
  30: { name: 'Amavasya',            hindiName: 'अमावस्या',
        desc: 'New Moon — sacred for ancestral rites (Pitru Tarpan). Offering water and sesame seeds to ancestors on Amavasya is most meritorious. Mahalaya Amavasya is the most significant.' },
};

function upcomingVrats(fromDate, days) {
  const vrats = [];
  const seen = new Set();
  for (let i = 0; i <= (days || 60); i++) {
    const d = new Date(fromDate);
    d.setDate(fromDate.getDate() + i);
    const y  = d.getFullYear();
    const mo = d.getMonth() + 1;
    const dy = d.getDate();
    const J  = Astro.jd(y, mo, dy, 6.5);
    const sL = Astro.sunLon(J);
    const mL = Astro.moonLon(J);
    const t  = Astro.tithi(sL, mL);
    if (VRAT_TITHIS[t]) {
      const iso = y + '-' + String(mo).padStart(2,'0') + '-' + String(dy).padStart(2,'0');
      const key = iso + '-' + t;
      if (!seen.has(key)) {
        seen.add(key);
        const vd = VRAT_TITHIS[t];
        vrats.push({ date: iso, tithiIdx: t, tithiName: TITHIS[t - 1],
          name: vd.name, hindiName: vd.hindiName, desc: vd.desc });
      }
    }
  }
  return vrats;
}

// ── Panchak ───────────────────────────────────────────────────────────────────
// Panchak: Moon's sidereal longitude >= 296.67° (Dhanishtha 3rd pada through Revati)

function upcomingPanchak(fromDate, days) {
  var periods = [];
  var inPanchak = false;
  var start = null;
  for (var i = 0; i <= (days || 60); i++) {
    var d = new Date(fromDate.getTime());
    d.setDate(fromDate.getDate() + i);
    var y = d.getFullYear(), mo = d.getMonth() + 1, dy = d.getDate();
    var J = Astro.jd(y, mo, dy, 6.5);
    var mL = Astro.moonLon(J);
    var ay = Astro.ayanamsa(J);
    var sid = ((mL - ay) % 360 + 360) % 360;
    var active = sid >= 296.67;
    var iso = y + '-' + String(mo).padStart(2,'0') + '-' + String(dy).padStart(2,'0');
    if (active && !inPanchak) { inPanchak = true; start = iso; }
    else if (!active && inPanchak) { inPanchak = false; periods.push({ start: start, end: iso }); }
  }
  if (inPanchak && start) { periods.push({ start: start, end: null }); }
  return periods;
}

// ── Pitru Paksha (Shradh) ─────────────────────────────────────────────────────

const SHRADH_PERIODS = [
  {
    start: '2025-09-29', end: '2025-10-13',
    name: 'Pitru Paksha 2025',
    desc: 'The 16-day period for ancestor remembrance. Shradh rites, tarpan (water offerings with black sesame), and pind daan are performed for departed ancestors. Begins on Bhadrapada Purnima and ends on Mahalaya Amavasya (Ashwina Krishna Amavasya).',
  },
  {
    start: '2026-09-17', end: '2026-10-01',
    name: 'Pitru Paksha 2026',
    desc: 'The 16-day period for ancestor remembrance. Shradh rites, tarpan, and pind daan are performed. Begins on Bhadrapada Purnima and ends on Mahalaya Amavasya. The last day (Sarvapitri Amavasya) is the most important for all ancestors.',
  },
];

function upcomingShradh(fromDate) {
  var todayIso = fromDate.getFullYear() + '-'
    + String(fromDate.getMonth() + 1).padStart(2,'0') + '-'
    + String(fromDate.getDate()).padStart(2,'0');
  return SHRADH_PERIODS.filter(function(p) { return p.end >= todayIso; });
}

// Upcoming festivals from a given date (returns next N)
function upcomingFestivals(fromDate, count) {
  // Use local date components so the cutoff matches the device's IST calendar day,
  // not the UTC date (which lags up to 5h30m behind IST midnight).
  const d = fromDate;
  const today = d.getFullYear() + '-'
    + String(d.getMonth() + 1).padStart(2, '0') + '-'
    + String(d.getDate()).padStart(2, '0');
  return FESTIVALS.filter(f => f.date >= today).slice(0, count || 20);
}
