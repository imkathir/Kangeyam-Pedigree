'use strict';

/**
 * Seed data — a realistic slice of the Kongu Kangeyam cattle world.
 * Every animal is keyed so parents can be linked in a second pass.
 */

const OWNERS = [
  { key: 'o1', name_ta: 'முருகேசன்', name_en: 'Murugesan', farm_name: 'Thambi Farms', phone: '+91 98432 11045', village: 'Kangeyam', district: 'Tiruppur', is_contact_public: 1 },
  { key: 'o2', name_ta: 'சுப்பிரமணி', name_en: 'Subramani', farm_name: 'Vellakoil Kangeyam Kudil', phone: '+91 94421 88290', village: 'Vellakoil', district: 'Tiruppur', is_contact_public: 0 },
  { key: 'o3', name_ta: 'ராஜேந்திரன்', name_en: 'Rajendran', farm_name: 'Sri Muniappan Kangeyam Farm', phone: '+91 90956 77311', village: 'Dharapuram', district: 'Tiruppur', is_contact_public: 0 },
  { key: 'o4', name_ta: 'கண்ணுசாமி', name_en: 'Kannusamy', farm_name: 'Kongu Semmai Farms', phone: null, village: 'Palladam', district: 'Tiruppur', is_contact_public: 0 },
  { key: 'o5', name_ta: 'லட்சுமி அம்மாள்', name_en: 'Lakshmi Ammal', farm_name: null, phone: '+91 97890 44120', village: 'Pollachi', district: 'Coimbatore', is_contact_public: 1 },
  { key: 'o6', name_ta: 'பழனியப்பன்', name_en: 'Palaniappan', farm_name: 'Palani Andavar Kangeyam', phone: '+91 96294 55017', village: 'Udumalpet', district: 'Tiruppur', is_contact_public: 0 },
  { key: 'o7', name_ta: 'செல்வராஜ்', name_en: 'Selvaraj', farm_name: null, phone: '+91 95001 23476', village: 'Avinashi', district: 'Tiruppur', is_contact_public: 1 },
];

const ANIMALS = [
  // ── Generation 0 — founders (unknown parents) ───────────────────────────
  {
    key: 'vel', tag: 'KGR-2011-001', name_ta: 'வேல்', name_en: 'Vel', sex: 'BULL',
    dob: '2011-03-10', dob_precision: 'EXACT', dentition_stage: 'FULL_MOUTH',
    birth_color: 'RED_FAWN', current_color: 'KARI',
    distinctive_markings: 'வெள்ளை நெற்றிப் பொட்டு (forehead star), கருப்பு வால் குஞ்சம், மேல்நோக்கி வளைந்த கொம்புகள்',
    village: 'Kangeyam', district: 'Tiruppur', sire: null, dam: null, is_stub: 0,
    notes: 'Founder bull of Thambi Farms bloodline. Documented from a herd at Kangeyam weekly shandy in 2011.',
    ownerships: [{ owner: 'o1', role: 'BREEDER', sequence_order: 1, from_date: '2011-03', place_note: 'Kangeyam' }],
    media: [
      { url: '/media/bull-portrait.jpg', life_stage: 'ADULT', caption: 'வேல் — 9 வயதில், கருமயிலை நிறத்தில் / Vel at 9 years', is_primary: 1 },
      { url: '/media/show.jpg', life_stage: 'EVENT', caption: 'Kangeyam Maadu Kaatchi 2019 — Best Senior Bull', is_primary: 0 },
    ],
    achievements: [
      { category: 'BREED_SHOW', event_name: 'Kangeyam Maadu Kaatchi', location: 'Kangeyam', event_date: '2019-02-14', rank_or_metric: 'Best Senior Bull (முதிர்ந்த காளை சிறப்பு)' },
      { category: 'PROGENY_MILESTONE', event_name: 'Registry progeny audit', location: 'Thambi Farms', event_date: '2025-06-01', rank_or_metric: '24 registered progeny across 4 generations' },
    ],
  },
  {
    key: 'kalingan', tag: null, name_ta: 'காளிங்கன்', name_en: 'Kalingan', sex: 'BULL',
    dob: '2012-01-01', dob_precision: 'YEAR_ONLY', dentition_stage: null,
    birth_color: 'RED_FAWN', current_color: 'SEVALAI',
    distinctive_markings: 'சிவந்த உடல், குட்டையான கொம்பு',
    village: 'Vellakoil', district: 'Tiruppur', sire: null, dam: null, is_stub: 1,
    notes: 'Stub ancestor — breeder remembers the name and village only. Upgrade to a full profile to add photos and records.',
    ownerships: [{ owner: 'o2', role: 'PREVIOUS_OWNER', sequence_order: 1, from_date: null, place_note: 'Vellakoil' }],
    media: [], achievements: [],
  },
  {
    key: 'arasan', tag: null, name_ta: 'அரசன்', name_en: 'Arasan', sex: 'BULL',
    dob: null, dob_precision: 'ESTIMATED_BY_TEETH', dentition_stage: 'FULL_MOUTH',
    birth_color: null, current_color: 'MAYILAI',
    distinctive_markings: null,
    village: 'Dharapuram', district: 'Tiruppur', sire: null, dam: null, is_stub: 1,
    notes: 'Stub ancestor recorded from an oral account of the Dharapuram shandy.',
    ownerships: [{ owner: 'o3', role: 'PREVIOUS_OWNER', sequence_order: 1, place_note: 'Dharapuram' }],
    media: [], achievements: [
      { category: 'DRAUGHT_ENDURANCE', event_name: 'Kongu Erumai-Maadu Uzhavu Vizha', location: 'Dharapuram', event_date: '2014-08-11', rank_or_metric: 'Ploughed 5 acres in a single day (ஒரு நாளில் 5 ஏக்கர்)' },
    ],
  },
  {
    key: 'muthu', tag: null, name_ta: 'முத்து', name_en: 'Muthu', sex: 'BULL',
    dob: null, dob_precision: 'ESTIMATED_BY_TEETH', dentition_stage: 'SIX_TOOTH',
    birth_color: null, current_color: 'KARAM_PASU',
    distinctive_markings: null,
    village: 'Palladam', district: 'Tiruppur', sire: null, dam: null, is_stub: 1,
    ownerships: [{ owner: 'o4', role: 'PREVIOUS_OWNER', sequence_order: 1, place_note: 'Palladam' }],
    media: [], achievements: [],
  },
  {
    key: 'mayilai', tag: 'KGR-2012-004', name_ta: 'மயிலை', name_en: 'Mayilai', sex: 'COW',
    dob: '2012-06-01', dob_precision: 'MONTH_YEAR', dentition_stage: 'FULL_MOUTH',
    birth_color: 'RED_FAWN', current_color: 'MAYILAI',
    distinctive_markings: 'மயில் நிற உடல், வெள்ளை வயிறு, நீண்ட வால் குஞ்சம்',
    village: 'Kangeyam', district: 'Tiruppur', sire: null, dam: null, is_stub: 0,
    notes: 'Founder dam. Calved 7 times; every calf registered.',
    ownerships: [
      { owner: 'o1', role: 'BREEDER', sequence_order: 1, from_date: '2012-06', place_note: 'Kangeyam' },
    ],
    media: [
      { url: '/media/cow-portrait.jpg', life_stage: 'ADULT', caption: 'மயிலை — மயில் நிறத்தின் சிறந்த எடுத்துக்காட்டு / Mayilai, a textbook Mayilai coat', is_primary: 1 },
      { url: '/media/cow-grazing.jpg', life_stage: 'ADULT', caption: 'Kangeyam pasture, Thambi Farms', is_primary: 0 },
    ],
    achievements: [
      { category: 'BREED_SHOW', event_name: 'Kangeyam Maadu Kaatchi', location: 'Kangeyam', event_date: '2021-02-12', rank_or_metric: 'Best Kangeyam Dam (சிறந்த காங்கேயம் தாய்)' },
      { category: 'DAIRY_LACTATION', event_name: 'Lactation record — 4th parity', location: 'Thambi Farms', event_date: '2020-11-20', rank_or_metric: 'Peak 3.5 L/day, A2 milk' },
    ],
  },
  {
    key: 'kaarthi', tag: 'KGR-2013-007', name_ta: 'கார்த்தி', name_en: 'Kaarthi', sex: 'COW',
    dob: '2013-01-15', dob_precision: 'YEAR_ONLY', dentition_stage: 'FULL_MOUTH',
    birth_color: 'RED_FAWN', current_color: 'KARI',
    distinctive_markings: 'கருமயிலை, வெள்ளை நெற்றிப் பட்டை',
    village: 'Vellakoil', district: 'Tiruppur', sire: null, dam: null, is_stub: 0,
    ownerships: [
      { owner: 'o2', role: 'BREEDER', sequence_order: 1, from_date: '2013-01', place_note: 'Vellakoil' },
      { owner: 'o3', role: 'CURRENT_OWNER', sequence_order: 3, from_date: '2021-07', place_note: 'Dharapuram' },
    ],
    media: [{ url: '/media/cow-grazing.jpg', life_stage: 'ADULT', caption: 'கார்த்தி at Dharapuram', is_primary: 1 }],
    achievements: [{ category: 'DAIRY_LACTATION', event_name: 'Vellakoil A2 milk record', location: 'Vellakoil', event_date: '2019-03-05', rank_or_metric: '3.1 L/day peak, 6th parity' }],
  },
  {
    key: 'thangam', tag: 'KGR-2014-011', name_ta: 'தங்கம்', name_en: 'Thangam', sex: 'COW',
    dob: '2014-04-20', dob_precision: 'EXACT', dentition_stage: 'FULL_MOUTH',
    birth_color: 'GREY', current_color: 'SEVALAI',
    distinctive_markings: 'செவலை நிறம், வால் முனையில் வெள்ளை',
    village: 'Dharapuram', district: 'Tiruppur', sire: null, dam: null, is_stub: 0,
    ownerships: [{ owner: 'o3', role: 'BREEDER', sequence_order: 1, from_date: '2014-04', place_note: 'Dharapuram' }],
    media: [{ url: '/media/cow-portrait.jpg', life_stage: 'ADULT', caption: 'தங்கம் (செவலை நிறம்)', is_primary: 1 }],
    achievements: [],
  },
  {
    key: 'ponni', tag: 'KGR-2014-013', name_ta: 'பொன்னி', name_en: 'Ponni', sex: 'COW',
    dob: '2014-08-09', dob_precision: 'MONTH_YEAR', dentition_stage: 'FULL_MOUTH',
    birth_color: 'GREY', current_color: 'OTHER',
    distinctive_markings: 'வெள்ளை உடல், கருப்பு கண் வட்டம் (காளைக் கண்)',
    village: 'Pollachi', district: 'Coimbatore', sire: null, dam: null, is_stub: 0,
    ownerships: [{ owner: 'o5', role: 'BREEDER', sequence_order: 1, from_date: '2014-08', place_note: 'Pollachi' }],
    media: [{ url: '/media/cow-grazing.jpg', life_stage: 'ADULT', caption: 'பொன்னி at Pollachi', is_primary: 1 }],
    achievements: [{ category: 'BREED_SHOW', event_name: 'Pollachi Maattu Vizha', location: 'Pollachi', event_date: '2022-01-19', rank_or_metric: '2nd Place — Vellai (white) class' }],
  },
  {
    key: 'komathi', tag: 'KGR-2013-009', name_ta: 'கோமதி', name_en: 'Komathi', sex: 'COW',
    dob: '2013-11-02', dob_precision: 'MONTH_YEAR', dentition_stage: 'FULL_MOUTH',
    birth_color: 'RED_FAWN', current_color: 'MAYILAI',
    distinctive_markings: null,
    village: 'Avinashi', district: 'Tiruppur', sire: null, dam: null, is_stub: 0,
    ownerships: [{ owner: 'o7', role: 'BREEDER', sequence_order: 1, from_date: '2013-11', place_note: 'Avinashi' }],
    media: [{ url: '/media/cow-portrait.jpg', life_stage: 'ADULT', caption: 'கோமதி', is_primary: 1 }],
    achievements: [],
  },

  // ── Generation 1 ────────────────────────────────────────────────────────
  {
    key: 'semmai', tag: 'KGR-2016-021', name_ta: 'செம்மை', name_en: 'Semmai', sex: 'BULL',
    dob: '2016-02-18', dob_precision: 'EXACT', dentition_stage: 'FULL_MOUTH',
    birth_color: 'RED_FAWN', current_color: 'KARI',
    distinctive_markings: 'கருமயிலை, இரு பக்கமும் சமமான கொம்பு வளைவு',
    village: 'Kangeyam', district: 'Tiruppur', sire: 'vel', dam: 'mayilai', is_stub: 0,
    notes: 'First son of Vel. Sire of the Kangeyam "Semmai line".',
    ownerships: [
      { owner: 'o1', role: 'BREEDER', sequence_order: 1, from_date: '2016-02', place_note: 'Kangeyam' },
      { owner: 'o6', role: 'CURRENT_OWNER', sequence_order: 2, from_date: '2022-10', place_note: 'Udumalpet' },
    ],
    media: [
      { url: '/media/bull-herd.jpg', life_stage: 'ADULT', caption: 'செம்மை leading the herd', is_primary: 1 },
      { url: '/media/rekla.jpg', life_stage: 'EVENT', caption: 'Rekla practice run, Udumalpet', is_primary: 0 },
    ],
    achievements: [
      { category: 'REKLA_RACE', event_name: 'Kangeyam Rekla Race 2023', location: 'Kangeyam', event_date: '2023-01-16', rank_or_metric: '1st Place — 200m (24.8s)', partner_animal: 'veeran' },
      { category: 'PROGENY_MILESTONE', event_name: 'Registry progeny audit', location: 'Kongu region', event_date: '2025-06-01', rank_or_metric: '12 registered progeny across 3 generations' },
    ],
  },
  {
    key: 'pugazh', tag: 'KGR-2016-024', name_ta: 'புகழ்', name_en: 'Pugazh', sex: 'BULL',
    dob: '2016-07-07', dob_precision: 'MONTH_YEAR', dentition_stage: 'FULL_MOUTH',
    birth_color: 'RED_FAWN', current_color: 'SEVALAI',
    distinctive_markings: 'சிவந்த செவலை நிறம், சிறிய நெற்றிப் பொட்டு',
    village: 'Vellakoil', district: 'Tiruppur', sire: 'kalingan', dam: 'kaarthi', is_stub: 0,
    ownerships: [
      { owner: 'o2', role: 'BREEDER', sequence_order: 1, from_date: '2016-07', place_note: 'Vellakoil' },
      { owner: 'o5', role: 'PREVIOUS_OWNER', sequence_order: 2, from_date: '2020-02', to_date: '2021-06', place_note: 'Pollachi' },
      { owner: 'o2', role: 'CURRENT_OWNER', sequence_order: 3, from_date: '2021-06', place_note: 'Vellakoil' },
    ],
    media: [{ url: '/media/bull-portrait.jpg', life_stage: 'ADULT', caption: 'புகழ் — செவலை நிறக் காளை', is_primary: 1 }],
    achievements: [
      { category: 'JALLIKATTU', event_name: 'Palamedu Jallikattu', location: 'Palamedu, Madurai', event_date: '2022-01-15', rank_or_metric: 'Pidipadaatha Kaalai — not caught in 30 attempts' },
      { category: 'BREED_SHOW', event_name: 'Vellakoil Kangeyam Vizha', location: 'Vellakoil', event_date: '2024-02-09', rank_or_metric: 'Best Bull — Sevalai class' },
    ],
  },
  {
    key: 'kaveri', tag: 'KGR-2016-027', name_ta: 'காவேரி', name_en: 'Kaveri', sex: 'COW',
    dob: '2016-03-22', dob_precision: 'EXACT', dentition_stage: 'FULL_MOUTH',
    birth_color: 'RED_FAWN', current_color: 'MAYILAI',
    distinctive_markings: 'மயிலை நிறம், நீண்ட மடி (well-set udder)',
    village: 'Kangeyam', district: 'Tiruppur', sire: 'vel', dam: 'thangam', is_stub: 0,
    ownerships: [{ owner: 'o1', role: 'BREEDER', sequence_order: 1, from_date: '2016-03', place_note: 'Kangeyam' }],
    media: [{ url: '/media/cow-portrait.jpg', life_stage: 'ADULT', caption: 'காவேரி', is_primary: 1 }],
    achievements: [
      { category: 'DAIRY_LACTATION', event_name: 'Lactation record — 3rd parity', location: 'Thambi Farms', event_date: '2021-09-14', rank_or_metric: 'Peak 3.5 L/day A2 yield' },
      { category: 'BREED_SHOW', event_name: 'Kangeyam Maadu Kaatchi 2024', location: 'Kangeyam', event_date: '2024-02-11', rank_or_metric: 'Best Kangeyam Dam' },
    ],
  },
  {
    key: 'nandhini', tag: 'KGR-2017-031', name_ta: 'நந்தினி', name_en: 'Nandhini', sex: 'COW',
    dob: '2017-05-05', dob_precision: 'MONTH_YEAR', dentition_stage: 'FULL_MOUTH',
    birth_color: 'GREY', current_color: 'KARAM_PASU',
    distinctive_markings: 'கரம்பை நிறம், கருப்பு வால் குஞ்சம்',
    village: 'Pollachi', district: 'Coimbatore', sire: 'arasan', dam: 'ponni', is_stub: 0,
    ownerships: [
      { owner: 'o5', role: 'BREEDER', sequence_order: 1, from_date: '2017-05', place_note: 'Pollachi' },
      { owner: 'o4', role: 'CURRENT_OWNER', sequence_order: 2, from_date: '2023-03', place_note: 'Palladam' },
    ],
    media: [{ url: '/media/cow-grazing.jpg', life_stage: 'ADULT', caption: 'நந்தினி grazing at Palladam', is_primary: 1 }],
    achievements: [{ category: 'DAIRY_LACTATION', event_name: 'Pollachi milk recording', location: 'Pollachi', event_date: '2022-08-30', rank_or_metric: '3.2 L/day peak, A2' }],
  },

  // ── Generation 2 ────────────────────────────────────────────────────────
  {
    key: 'veeran', tag: 'KGR-2019-042', name_ta: 'வீரன்', name_en: 'Veeran', sex: 'BULL',
    dob: '2019-04-11', dob_precision: 'EXACT', dentition_stage: 'FULL_MOUTH',
    birth_color: 'RED_FAWN', current_color: 'KARI',
    distinctive_markings: 'கருமயிலை, வெள்ளை நெற்றிப் பொட்டு, கூரான கொம்பு',
    village: 'Udumalpet', district: 'Tiruppur', sire: 'semmai', dam: 'kaveri', is_stub: 0,
    notes: 'Rekla pair-mate of Semmai; twice a Jallikattu "uncaught bull".',
    ownerships: [
      { owner: 'o6', role: 'BREEDER', sequence_order: 1, from_date: '2019-04', place_note: 'Udumalpet' },
      { owner: 'o1', role: 'CURRENT_OWNER', sequence_order: 2, from_date: '2024-01', place_note: 'Kangeyam' },
    ],
    media: [
      { url: '/media/jallikattu.jpg', life_stage: 'EVENT', caption: 'வீரன் entering the vadivasal, Palamedu', is_primary: 1 },
      { url: '/media/bull-herd.jpg', life_stage: 'ADULT', caption: 'Home pasture, Kangeyam', is_primary: 0 },
    ],
    achievements: [
      { category: 'JALLIKATTU', event_name: 'Palamedu Jallikattu', location: 'Palamedu, Madurai', event_date: '2023-01-15', rank_or_metric: 'Pidipadaatha Kaalai — 0 of 42 attempts succeeded' },
      { category: 'JALLIKATTU', event_name: 'Alanganallur Jallikattu', location: 'Alanganallur, Madurai', event_date: '2024-01-16', rank_or_metric: '2nd Prize — Thavasal (uncaught)' },
      { category: 'PROGENY_MILESTONE', event_name: 'Registry progeny audit', location: 'Kongu region', event_date: '2026-03-01', rank_or_metric: '8 progeny registered' },
    ],
  },
  {
    key: 'singam', tag: 'KGR-2019-046', name_ta: 'சிங்கம்', name_en: 'Singam', sex: 'BULL',
    dob: '2019-09-19', dob_precision: 'MONTH_YEAR', dentition_stage: 'FULL_MOUTH',
    birth_color: 'RED_FAWN', current_color: 'SEVALAI',
    distinctive_markings: 'செவலை நிறம், அகன்ற மார்பு',
    village: 'Vellakoil', district: 'Tiruppur', sire: 'pugazh', dam: 'nandhini', is_stub: 0,
    ownerships: [{ owner: 'o2', role: 'BREEDER', sequence_order: 1, from_date: '2019-09', place_note: 'Vellakoil' }],
    media: [{ url: '/media/bull-portrait.jpg', life_stage: 'ADULT', caption: 'சிங்கம்', is_primary: 1 }],
    achievements: [{ category: 'REKLA_RACE', event_name: 'Vellakoil Rekla Vizha 2025', location: 'Vellakoil', event_date: '2025-01-18', rank_or_metric: '2nd Place — 300m (38.4s)' }],
  },
  {
    key: 'valli', tag: 'KGR-2019-048', name_ta: 'வள்ளி', name_en: 'Valli', sex: 'COW',
    dob: '2019-11-30', dob_precision: 'MONTH_YEAR', dentition_stage: 'SIX_TOOTH',
    birth_color: 'RED_FAWN', current_color: 'MAYILAI',
    distinctive_markings: 'மயிலை நிறம், வெள்ளை வயிறு',
    village: 'Palladam', district: 'Tiruppur', sire: 'semmai', dam: 'nandhini', is_stub: 0,
    ownerships: [
      { owner: 'o4', role: 'BREEDER', sequence_order: 1, from_date: '2019-11', place_note: 'Palladam' },
      { owner: 'o2', role: 'CURRENT_OWNER', sequence_order: 2, from_date: '2025-02', place_note: 'Vellakoil' },
    ],
    media: [{ url: '/media/cow-portrait.jpg', life_stage: 'ADULT', caption: 'வள்ளி', is_primary: 1 }],
    achievements: [],
  },
  {
    key: 'amaravathi', tag: 'KGR-2020-053', name_ta: 'அமராவதி', name_en: 'Amaravathi', sex: 'COW',
    dob: '2020-06-14', dob_precision: 'EXACT', dentition_stage: 'FOUR_TOOTH',
    birth_color: 'RED_FAWN', current_color: 'KARI',
    distinctive_markings: 'கருமயிலை, நீண்ட கொம்பு',
    village: 'Kangeyam', district: 'Tiruppur', sire: 'pugazh', dam: 'kaveri', is_stub: 0,
    ownerships: [{ owner: 'o1', role: 'BREEDER', sequence_order: 1, from_date: '2020-06', place_note: 'Kangeyam' }],
    media: [{ url: '/media/cow-grazing.jpg', life_stage: 'ADULT', caption: 'அமராவதி', is_primary: 1 }],
    achievements: [{ category: 'BREED_SHOW', event_name: 'Tiruppur Maattu Vizha 2026', location: 'Tiruppur', event_date: '2026-01-10', rank_or_metric: '2nd Place — Kari Mayilai class' }],
  },

  // ── Generation 3 ────────────────────────────────────────────────────────
  {
    key: 'kannan', tag: 'KGR-2022-061', name_ta: 'கண்ணன்', name_en: 'Kannan', sex: 'BULL',
    dob: '2022-02-08', dob_precision: 'EXACT', dentition_stage: 'FOUR_TOOTH',
    birth_color: 'RED_FAWN', current_color: 'MAYILAI',
    distinctive_markings: 'மயிலை நிறம், சிவந்த கண் விளிம்பு, வெள்ளை வால் குஞ்சம்',
    village: 'Kangeyam', district: 'Tiruppur', sire: 'veeran', dam: 'amaravathi', is_stub: 0,
    notes: 'Young star of the 2025–26 Rekla season, paired with Kovai.',
    ownerships: [{ owner: 'o1', role: 'BREEDER', sequence_order: 1, from_date: '2022-02', place_note: 'Kangeyam' }],
    media: [
      { url: '/media/rekla.jpg', life_stage: 'EVENT', caption: 'கண்ணன் & கோவை at the Kangeyam Rekla 2026 finish line', is_primary: 1 },
      { url: '/media/bull-herd.jpg', life_stage: 'ADULT', caption: 'Kannan at four-tooth stage', is_primary: 0 },
    ],
    achievements: [
      { category: 'REKLA_RACE', event_name: 'Kangeyam Rekla Race 2026', location: 'Kangeyam', event_date: '2026-01-16', rank_or_metric: '1st Place — 200m (23.9s)', partner_animal: 'kovai' },
      { category: 'REKLA_RACE', event_name: 'Tiruppur Maattu Rekla 2026', location: 'Tiruppur', event_date: '2026-02-01', rank_or_metric: '1st Place — 300m (37.2s)', partner_animal: 'kovai' },
    ],
  },
  {
    key: 'tamilselvi', tag: 'KGR-2022-064', name_ta: 'தமிழ்செல்வி', name_en: 'Tamilselvi', sex: 'COW',
    dob: '2022-04-27', dob_precision: 'MONTH_YEAR', dentition_stage: 'FOUR_TOOTH',
    birth_color: 'RED_FAWN', current_color: 'SEVALAI',
    distinctive_markings: 'செவலை நிறம், நெற்றியில் சிறு பொட்டு',
    village: 'Vellakoil', district: 'Tiruppur', sire: 'singam', dam: 'valli', is_stub: 0,
    ownerships: [{ owner: 'o2', role: 'BREEDER', sequence_order: 1, from_date: '2022-04', place_note: 'Vellakoil' }],
    media: [{ url: '/media/cow-portrait.jpg', life_stage: 'ADULT', caption: 'தமிழ்செல்வி', is_primary: 1 }],
    achievements: [{ category: 'DAIRY_LACTATION', event_name: 'First lactation record', location: 'Vellakoil', event_date: '2025-12-04', rank_or_metric: 'Peak 2.8 L/day A2, 1st parity' }],
  },
  {
    key: 'murugan', tag: 'KGR-2022-067', name_ta: 'முருகன்', name_en: 'Murugan', sex: 'BULL',
    dob: '2022-08-02', dob_precision: 'EXACT', dentition_stage: 'FOUR_TOOTH',
    birth_color: 'GREY', current_color: 'KARAM_PASU',
    distinctive_markings: 'கரம்பை நிறம், குட்டையான கூரிய கொம்புகள்',
    village: 'Palladam', district: 'Tiruppur', sire: 'veeran', dam: 'valli', is_stub: 0,
    ownerships: [{ owner: 'o4', role: 'BREEDER', sequence_order: 1, from_date: '2022-08', place_note: 'Palladam' }],
    media: [{ url: '/media/jallikattu.jpg', life_stage: 'EVENT', caption: 'முருகன் at the Alanganallur vadivasal', is_primary: 1 }],
    achievements: [
      { category: 'JALLIKATTU', event_name: 'Alanganallur Jallikattu 2025', location: 'Alanganallur, Madurai', event_date: '2025-01-16', rank_or_metric: '1st Prize — Thavasal (uncaught)' },
      { category: 'JALLIKATTU', event_name: 'Sooriyur Jallikattu 2026', location: 'Sooriyur, Trichy', event_date: '2026-01-17', rank_or_metric: 'Pidipadaatha Kaalai' },
    ],
  },
  {
    key: 'sankari', tag: 'KGR-2023-072', name_ta: 'சங்கரி', name_en: 'Sankari', sex: 'COW',
    dob: '2023-01-25', dob_precision: 'EXACT', dentition_stage: 'TWO_TOOTH',
    birth_color: 'RED_FAWN', current_color: 'MAYILAI',
    distinctive_markings: 'மயிலை நிறம், நீண்ட வால்',
    village: 'Kangeyam', district: 'Tiruppur', sire: 'singam', dam: 'amaravathi', is_stub: 0,
    ownerships: [{ owner: 'o1', role: 'BREEDER', sequence_order: 1, from_date: '2023-01', place_note: 'Kangeyam' }],
    media: [{ url: '/media/cow-grazing.jpg', life_stage: 'ADULT', caption: 'சங்கரி at two-tooth', is_primary: 1 }],
    achievements: [],
  },

  // ── Generation 4 ────────────────────────────────────────────────────────
  {
    key: 'ilavel', tag: 'KGR-2024-081', name_ta: 'இளவேல்', name_en: 'Ilavel', sex: 'BULL',
    dob: '2024-03-03', dob_precision: 'EXACT', dentition_stage: 'TWO_TOOTH',
    birth_color: 'RED_FAWN', current_color: 'KARI',
    distinctive_markings: 'கருமயிலை, வேல் போன்ற நெற்றிப் பொட்டு (great-grandsire likeness)',
    village: 'Kangeyam', district: 'Tiruppur', sire: 'kannan', dam: 'tamilselvi', is_stub: 0,
    notes: 'Named for his resemblance to his great-great-grandsire Vel.',
    ownerships: [{ owner: 'o1', role: 'BREEDER', sequence_order: 1, from_date: '2024-03', place_note: 'Kangeyam' }],
    media: [
      { url: '/media/bull-herd.jpg', life_stage: 'ADULT', caption: 'இளவேல், 2 years', is_primary: 1 },
      { url: '/media/calf.jpg', life_stage: 'CALF', caption: 'இளவேல் at 4 months — red/fawn calf coat', is_primary: 0 },
    ],
    achievements: [{ category: 'BREED_SHOW', event_name: 'Kangeyam Maadu Kaatchi 2026', location: 'Kangeyam', event_date: '2026-02-11', rank_or_metric: 'Best Young Bull (இளங்காளை)' }],
  },
  {
    key: 'bhavani', tag: 'KGR-2024-083', name_ta: 'பவானி', name_en: 'Bhavani', sex: 'COW',
    dob: '2024-07-19', dob_precision: 'MONTH_YEAR', dentition_stage: 'TWO_TOOTH',
    birth_color: 'RED_FAWN', current_color: 'MAYILAI',
    distinctive_markings: 'மயிலை நிறம், வெள்ளை நெற்றிப் பட்டை',
    village: 'Kangeyam', district: 'Tiruppur', sire: 'murugan', dam: 'sankari', is_stub: 0,
    ownerships: [{ owner: 'o1', role: 'BREEDER', sequence_order: 1, from_date: '2024-07', place_note: 'Kangeyam' }],
    media: [{ url: '/media/cow-portrait.jpg', life_stage: 'ADULT', caption: 'பவானி', is_primary: 1 }],
    achievements: [],
  },
  {
    key: 'kovai', tag: 'KGR-2024-086', name_ta: 'கோவை', name_en: 'Kovai', sex: 'BULL',
    dob: '2024-11-11', dob_precision: 'EXACT', dentition_stage: 'TWO_TOOTH',
    birth_color: 'RED_FAWN', current_color: 'SEVALAI',
    distinctive_markings: 'செவலை நிறம், வலது கொம்பு சற்று வளைந்தது',
    village: 'Kangeyam', district: 'Tiruppur', sire: 'kannan', dam: 'sankari', is_stub: 0,
    notes: 'Rekla pair-mate of Kannan — the left-hand bull of the cart.',
    ownerships: [{ owner: 'o1', role: 'BREEDER', sequence_order: 1, from_date: '2024-11', place_note: 'Kangeyam' }],
    media: [{ url: '/media/rekla.jpg', life_stage: 'EVENT', caption: 'கோவை (left) & கண்ணன் (right), Kangeyam Rekla 2026', is_primary: 1 }],
    achievements: [
      { category: 'REKLA_RACE', event_name: 'Kangeyam Rekla Race 2026', location: 'Kangeyam', event_date: '2026-01-16', rank_or_metric: '1st Place — 200m (23.9s)', partner_animal: 'kannan' },
    ],
  },

  // ── Generation 5 — youngest ─────────────────────────────────────────────
  {
    key: 'vetri', tag: 'KGR-2026-002', name_ta: 'வெற்றி', name_en: 'Vetri', sex: 'BULL',
    dob: '2026-01-28', dob_precision: 'EXACT', dentition_stage: 'CALF_MILK_TEETH',
    birth_color: 'RED_FAWN', current_color: 'KARI',
    distinctive_markings: 'பிறந்த நிறம் செம்மை; 6 மாதத்தில் கருமயிலையாக மாறத் தொடங்கியது',
    village: 'Kangeyam', district: 'Tiruppur', sire: 'ilavel', dam: 'bhavani', is_stub: 0,
    notes: 'Fifth documented generation of the Vel line — 5 generations deep in the registry.',
    ownerships: [{ owner: 'o1', role: 'BREEDER', sequence_order: 1, from_date: '2026-01', place_note: 'Kangeyam' }],
    media: [{ url: '/media/calf.jpg', life_stage: 'CALF', caption: 'வெற்றி at 6 months, red/fawn calf coat', is_primary: 1 }],
    achievements: [],
  },
  {
    key: 'meenakshi', tag: 'KGR-2025-094', name_ta: 'மீனாட்சி', name_en: 'Meenakshi', sex: 'COW',
    dob: '2025-05-16', dob_precision: 'MONTH_YEAR', dentition_stage: 'CALF_MILK_TEETH',
    birth_color: 'RED_FAWN', current_color: 'MAYILAI',
    distinctive_markings: 'மயிலை நிறம்',
    village: 'Vellakoil', district: 'Tiruppur', sire: 'kovai', dam: 'tamilselvi', is_stub: 0,
    ownerships: [{ owner: 'o2', role: 'BREEDER', sequence_order: 1, from_date: '2025-05', place_note: 'Vellakoil' }],
    media: [{ url: '/media/calf.jpg', life_stage: 'CALF', caption: 'மீனாட்சி at 6 months', is_primary: 1 }],
    achievements: [],
  },

  // ── Fresh Generation-0 registrations (no recorded parents yet) ──────────
  {
    key: 'selvam', tag: null, name_ta: 'செல்வம்', name_en: 'Selvam', sex: 'BULL',
    dob: null, dob_precision: 'ESTIMATED_BY_TEETH', dentition_stage: 'SIX_TOOTH',
    birth_color: null, current_color: 'KARAM_PASU',
    distinctive_markings: 'கரம்பை நிறம், வெள்ளை வயிறு',
    village: 'Udumalpet', district: 'Tiruppur', sire: null, dam: null, is_stub: 0,
    notes: 'Bought at the Udumalpet shandy — parentage unknown, so registered as Generation 0.',
    ownerships: [{ owner: 'o6', role: 'CURRENT_OWNER', sequence_order: 1, from_date: '2025-04', place_note: 'Udumalpet' }],
    media: [{ url: '/media/bull-herd.jpg', life_stage: 'ADULT', caption: 'செல்வம்', is_primary: 1 }],
    achievements: [],
  },
  {
    key: 'deivanai', tag: null, name_ta: 'தெய்வானை', name_en: 'Deivanai', sex: 'COW',
    dob: '2022-01-01', dob_precision: 'YEAR_ONLY', dentition_stage: 'FOUR_TOOTH',
    birth_color: 'RED_FAWN', current_color: 'MAYILAI',
    distinctive_markings: null,
    village: 'Kangeyam', district: 'Tiruppur', sire: null, dam: null, is_stub: 0,
    ownerships: [{ owner: 'o7', role: 'CURRENT_OWNER', sequence_order: 1, from_date: '2024-02', place_note: 'Avinashi' }],
    media: [{ url: '/media/cow-grazing.jpg', life_stage: 'ADULT', caption: 'தெய்வானை', is_primary: 1 }],
    achievements: [],
  },
  {
    key: 'andavar', tag: null, name_ta: 'ஆண்டவர்', name_en: 'Andavar', sex: 'BULL',
    dob: '2024-02-14', dob_precision: 'EXACT', dentition_stage: 'TWO_TOOTH',
    birth_color: 'RED_FAWN', current_color: 'SEVALAI',
    distinctive_markings: 'செவலை நிறம், சிவந்த கண் விளிம்பு',
    village: 'Palladam', district: 'Tiruppur', sire: null, dam: null, is_stub: 0,
    notes: 'Registered by a young breeder through the mobile wizard — both parents unknown.',
    ownerships: [{ owner: 'o4', role: 'CURRENT_OWNER', sequence_order: 1, from_date: '2024-02', place_note: 'Palladam' }],
    media: [{ url: '/media/jallikattu.jpg', life_stage: 'EVENT', caption: 'ஆண்டவர் at a local maattu vizha', is_primary: 1 }],
    achievements: [{ category: 'BREED_SHOW', event_name: 'Palladam Maattu Vizha 2026', location: 'Palladam', event_date: '2026-03-08', rank_or_metric: '3rd Place — Young Bull' }],
  },
];

const BREEDING_EVENTS = [
  { sire: 'kannan', dam: 'sankari', mating_date: '2024-02-10', expected_calving_date: '2025-02-05', calf: 'kovai' },
  { sire: 'ilavel', dam: 'bhavani', mating_date: '2025-04-20', expected_calving_date: '2026-01-25', calf: 'vetri' },
  { sire: 'kovai', dam: 'tamilselvi', mating_date: '2024-08-15', expected_calving_date: '2025-05-10', calf: 'meenakshi' },
  { sire: 'veeran', dam: 'amaravathi', mating_date: '2021-05-20', expected_calving_date: '2022-02-01', calf: 'kannan' },
  { sire: 'singam', dam: 'valli', mating_date: '2021-07-05', expected_calving_date: '2022-04-01', calf: 'tamilselvi' },
  { sire: 'veeran', dam: 'valli', mating_date: '2021-10-11', expected_calving_date: '2022-07-25', calf: 'murugan' },
  { sire: 'murugan', dam: 'sankari', mating_date: '2023-10-01', expected_calving_date: '2024-07-10', calf: 'bhavani' },
];

function seed(db) {
  const insOwner = db.prepare(
    `INSERT INTO owners (name_ta, name_en, farm_name, phone, village, district, is_contact_public)
     VALUES (@name_ta, @name_en, @farm_name, @phone, @village, @district, @is_contact_public)`
  );
  const insAnimal = db.prepare(
    `INSERT INTO animals (tag_or_reg_no, name_ta, name_en, sex, dob, dob_precision, dentition_stage,
        birth_color, current_color, distinctive_markings, current_village, current_district,
        is_stub, status, notes, created_at)
     VALUES (@tag, @name_ta, @name_en, @sex, @dob, @dob_precision, @dentition_stage,
        @birth_color, @current_color, @distinctive_markings, @village, @district,
        @is_stub, 'ACTIVE', @notes, @created_at)`
  );
  const setParents = db.prepare('UPDATE animals SET sire_id = ?, dam_id = ? WHERE id = ?');
  const insOwnership = db.prepare(
    `INSERT INTO animal_ownerships (animal_id, owner_id, role, sequence_order, from_date, to_date, place_note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insMedia = db.prepare(
    `INSERT INTO animal_media (animal_id, media_url, media_type, life_stage, caption, is_primary)
     VALUES (?, ?, 'PHOTO', ?, ?, ?)`
  );
  const insAch = db.prepare(
    `INSERT INTO achievements (animal_id, category, event_name, location, event_date, rank_or_metric, partner_animal_id, notes)
     VALUES (@animal_id, @category, @event_name, @location, @event_date, @rank_or_metric, @partner_animal_id, @notes)`
  );
  const insBreeding = db.prepare(
    `INSERT INTO breeding_events (sire_id, dam_id, mating_date, expected_calving_date, calf_id)
     VALUES (?, ?, ?, ?, ?)`
  );

  db.transaction(() => {
    const ownerId = {};
    for (const o of OWNERS) ownerId[o.key] = insOwner.run(o).lastInsertRowid;

    const animalId = {};
    let i = 0;
    for (const a of ANIMALS) {
      i += 1;
      const createdAt = `${2018 + (i % 7)}-0${1 + (i % 8)}-1${i % 9} 09:${10 + (i % 40)}:00`;
      animalId[a.key] = insAnimal.run({
        tag: a.tag ?? null,
        name_ta: a.name_ta,
        name_en: a.name_en,
        sex: a.sex,
        dob: a.dob ?? null,
        dob_precision: a.dob_precision,
        dentition_stage: a.dentition_stage ?? null,
        birth_color: a.birth_color ?? null,
        current_color: a.current_color,
        distinctive_markings: a.distinctive_markings ?? null,
        village: a.village ?? null,
        district: a.district ?? null,
        is_stub: a.is_stub ? 1 : 0,
        notes: a.notes ?? null,
        created_at: createdAt,
      }).lastInsertRowid;
    }

    for (const a of ANIMALS) {
      const id = animalId[a.key];
      setParents.run(
        a.sire ? animalId[a.sire] : null,
        a.dam ? animalId[a.dam] : null,
        id
      );
      for (const ow of a.ownerships ?? []) {
        insOwnership.run(
          id, ownerId[ow.owner] ?? null, ow.role, ow.sequence_order ?? 1,
          ow.from_date ?? null, ow.to_date ?? null, ow.place_note ?? null
        );
      }
      for (const m of a.media ?? []) {
        insMedia.run(id, m.url, m.life_stage ?? null, m.caption ?? null, m.is_primary ? 1 : 0);
      }
      for (const ac of a.achievements ?? []) {
        insAch.run({
          animal_id: id,
          category: ac.category,
          event_name: ac.event_name,
          location: ac.location ?? null,
          event_date: ac.event_date ?? null,
          rank_or_metric: ac.rank_or_metric,
          partner_animal_id: ac.partner_animal ? animalId[ac.partner_animal] ?? null : null,
          notes: ac.notes ?? null,
        });
      }
    }

    for (const b of BREEDING_EVENTS) {
      insBreeding.run(
        animalId[b.sire] ?? null, animalId[b.dam] ?? null,
        b.mating_date ?? null, b.expected_calving_date ?? null, animalId[b.calf] ?? null
      );
    }
  })();
}

module.exports = { seed, OWNERS, ANIMALS };
