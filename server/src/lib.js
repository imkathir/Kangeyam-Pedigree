'use strict';

const { db } = require('./db');

/* ────────────────────────────────────────────────────────────────────────────
 * Enumerations — single source of truth for labels in both languages.
 * ──────────────────────────────────────────────────────────────────────────── */
const ENUMS = {
  colors: {
    MAYILAI: { ta: 'மயிலை', en: 'Mayilai (peacock grey)', hex: '#8d9aa5' },
    KARI_MAYILAI: { ta: 'கருமயிலை', en: 'Kari Mayilai (dark grey)', hex: '#4a5158' },
    SEVALAI: { ta: 'செவலை', en: 'Sevalai (red-brown)', hex: '#9c4a24' },
    KARAMBAI: { ta: 'கரம்பை', en: 'Karambai (pale grey)', hex: '#c2bcae' },
    VELLAI: { ta: 'வெள்ளை', en: 'Vellai (white)', hex: '#efece4' },
    OTHER: { ta: 'மற்றவை', en: 'Other / mixed', hex: '#b9a68a' },
  },
  birthColors: {
    RED_FAWN: { ta: 'சிவந்த மான் நிறம்', en: 'Red / fawn calf coat' },
    GREY: { ta: 'சாம்பல்', en: 'Grey' },
    BLACK: { ta: 'கருப்பு', en: 'Black' },
    OTHER: { ta: 'மற்றவை', en: 'Other' },
  },
  dobPrecision: {
    EXACT: { ta: 'துல்லியமான தேதி', en: 'Exact date' },
    MONTH_YEAR: { ta: 'மாதம் & ஆண்டு', en: 'Month & year' },
    YEAR_ONLY: { ta: 'ஆண்டு மட்டும்', en: 'Year only' },
    ESTIMATED_BY_TEETH: { ta: 'பல் மதிப்பீடு', en: 'Estimated by teeth' },
  },
  dentition: {
    CALF_MILK_TEETH: { ta: 'கன்றுப் பால் பல்', en: 'Calf — milk teeth' },
    TWO_TOOTH: { ta: 'இரண்டு பல்', en: 'Two-tooth' },
    FOUR_TOOTH: { ta: 'நான்கு பல்', en: 'Four-tooth' },
    SIX_TOOTH: { ta: 'ஆறு பல்', en: 'Six-tooth' },
    FULL_MOUTH: { ta: 'முழுப் பல்', en: 'Full mouth' },
  },
  lifeStage: {
    CALF: { ta: 'கன்று', en: 'Calf' },
    TWO_TOOTH: { ta: 'இரண்டு பல்', en: 'Two-tooth' },
    FOUR_TOOTH: { ta: 'நான்கு பல்', en: 'Four-tooth' },
    ADULT: { ta: 'முதிர்ந்த', en: 'Adult' },
    EVENT: { ta: 'நிகழ்வு', en: 'Event' },
  },
  categories: {
    REKLA_RACE: { ta: 'ரேக்ளா பந்தயம்', en: 'Rekla race', icon: '🏁' },
    JALLIKATTU: { ta: 'ஜல்லிக்கட்டு', en: 'Jallikattu', icon: '🐂' },
    BREED_SHOW: { ta: 'கால்நடை கண்காட்சி', en: 'Breed show', icon: '🏅' },
    PROGENY_MILESTONE: { ta: 'சந்ததி சாதனை', en: 'Progeny milestone', icon: '🌱' },
    DAIRY_LACTATION: { ta: 'பால் உற்பத்தி', en: 'Dairy lactation', icon: '🥛' },
    DRAUGHT_ENDURANCE: { ta: 'உழவு சகிப்புத்திறன்', en: 'Draught endurance', icon: '🌾' },
  },
  roles: {
    BREEDER: { ta: 'இனப்பெருக்குநர்', en: 'Breeder' },
    PREVIOUS_OWNER: { ta: 'முன்னாள் உரிமையாளர்', en: 'Previous owner' },
    CURRENT_OWNER: { ta: 'தற்போதைய உரிமையாளர்', en: 'Current owner' },
  },
  status: {
    ACTIVE: { ta: 'செயலில்', en: 'Active' },
    SOLD: { ta: 'விற்பனை', en: 'Sold' },
    DECEASED: { ta: 'இறந்தது', en: 'Deceased' },
  },
};

const ANIMAL_FIELDS = [
  'tag_or_reg_no', 'name_ta', 'name_en', 'sex', 'dob', 'dob_precision', 'dentition_stage',
  'birth_color', 'current_color', 'distinctive_markings', 'current_village', 'current_district',
  'sire_id', 'dam_id', 'is_stub', 'status', 'notes',
];

/* ────────────────────────────────────────────────────────────────────────────
 * Errors
 * ──────────────────────────────────────────────────────────────────────────── */
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Age helpers — flexible DOB precision
 * ──────────────────────────────────────────────────────────────────────────── */
function ageFrom(dob, precision, dentition) {
  if (!dob) {
    if (dentition) {
      const guess = {
        CALF_MILK_TEETH: 'Under 1 year (milk teeth)',
        TWO_TOOTH: 'About 1.5–2 years (two-tooth)',
        FOUR_TOOTH: 'About 2.5–3 years (four-tooth)',
        SIX_TOOTH: 'About 3.5–4 years (six-tooth)',
        FULL_MOUTH: '4 years or older (full mouth)',
      };
      return { years: null, months: null, label: guess[dentition] || 'Unknown age', approx: true };
    }
    return { years: null, months: null, label: 'Unknown age', approx: true };
  }
  const d = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return { years: null, months: null, label: 'Unknown age', approx: true };
  const now = new Date();
  let months = (now.getUTCFullYear() - d.getUTCFullYear()) * 12 + (now.getUTCMonth() - d.getUTCMonth());
  if (now.getUTCDate() < d.getUTCDate()) months -= 1;
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  let label;
  if (precision === 'YEAR_ONLY') label = `${years} yr${years === 1 ? '' : 's'} (year only)`;
  else if (precision === 'MONTH_YEAR') label = `${years} yr${years === 1 ? '' : 's'} ${rem} mo`;
  else if (precision === 'ESTIMATED_BY_TEETH') label = `≈ ${years} yr${years === 1 ? '' : 's'} (estimated)`;
  else label = `${years} yr${years === 1 ? '' : 's'} ${rem} mo`;
  return { years, months: rem, label, approx: precision !== 'EXACT' };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Generation + pedigree maths
 * ──────────────────────────────────────────────────────────────────────────── */
const getAnimal = db.prepare('SELECT * FROM animals WHERE id = ?');

const generationCache = new Map();
const fCache = new Map();
function clearCaches() {
  generationCache.clear();
  fCache.clear();
}

/** 0 = no recorded parents; 1 = both/one parent known but they have no parents … */
function documentedGenerations(id, seen = new Set()) {
  if (generationCache.has(id)) return generationCache.get(id);
  if (seen.has(id)) return 0;
  const a = getAnimal.get(id);
  if (!a) return 0;
  const parents = [a.sire_id, a.dam_id].filter(Boolean);
  if (!parents.length) {
    generationCache.set(id, 0);
    return 0;
  }
  seen.add(id);
  let best = 0;
  for (const p of parents) best = Math.max(best, documentedGenerations(p, seen));
  seen.delete(id);
  const result = best + 1;
  generationCache.set(id, result);
  return result;
}

/** Collect ancestor map: id -> closest distance in generations (parent = 1). */
function ancestorMap(id, maxDepth = 40) {
  const map = new Map();
  const walk = (currentId, dist) => {
    if (dist > maxDepth || !currentId) return;
    const existing = map.get(currentId);
    if (existing !== undefined && existing <= dist) return;
    map.set(currentId, dist);
    const a = getAnimal.get(currentId);
    if (!a) return;
    walk(a.sire_id, dist + 1);
    walk(a.dam_id, dist + 1);
  };
  const root = getAnimal.get(id);
  if (!root) return map;
  walk(root.sire_id, 1);
  walk(root.dam_id, 1);
  return map;
}

/** Descendants (progeny) of an animal, breadth-first with depth. */
function descendants(id, maxDepth = 6) {
  const out = [];
  const stmt = db.prepare(
    `SELECT id, sire_id, dam_id FROM animals
     WHERE (sire_id = ? OR dam_id = ?) AND archived_at IS NULL`
  );
  const queue = [{ id, depth: 0 }];
  const seen = new Set([id]);
  while (queue.length) {
    const { id: current, depth } = queue.shift();
    if (depth >= maxDepth) continue;
    for (const child of stmt.all(current, current)) {
      if (seen.has(child.id)) continue;
      seen.add(child.id);
      out.push({ id: child.id, depth: depth + 1, via: child.sire_id === current ? 'SIRE' : 'DAM' });
      queue.push({ id: child.id, depth: depth + 1 });
    }
  }
  return out;
}

/** Would setting `parentId` as a parent of `animalId` create a cycle? */
function createsCycle(animalId, parentId) {
  if (!parentId || !animalId) return false;
  if (Number(animalId) === Number(parentId)) return true;
  const anc = ancestorMap(animalId); // ancestors of the animal
  if (anc.has(Number(parentId))) return true; // parent is already an ancestor
  // parent must not be a descendant of the animal either
  const desc = descendants(animalId, 12).map((d) => d.id);
  return desc.includes(Number(parentId));
}

/**
 * Closest ("minimal") shared ancestors — those that are not themselves ancestors of
 * another shared ancestor. Wright's coefficient must only be summed over these,
 * otherwise every deeper ancestor of the shared parent inflates F.
 */
function sharedAncestors(sireId, damId) {
  const aS = ancestorMap(sireId);
  const aD = ancestorMap(damId);
  // Each parent is at distance 0 from itself, so a direct parent–offspring
  // pairing is detected and scored correctly (F = 0.25).
  aS.set(Number(sireId), 0);
  aD.set(Number(damId), 0);
  const all = [];
  for (const [id, dSire] of aS.entries()) {
    const dDam = aD.get(id);
    if (dDam === undefined) continue;
    all.push({ id, dSire, dDam });
  }
  const minimal = all.filter(
    (candidate) => !all.some((other) => other.id !== candidate.id && ancestorMap(other.id).has(candidate.id))
  );
  return { all, minimal };
}

/** Inbreeding coefficient of an existing animal, from its own recorded parents. */
function inbreedingOf(id) {
  if (fCache.has(id)) return fCache.get(id);
  fCache.set(id, 0); // cycle guard
  const a = getAnimal.get(id);
  if (!a || !a.sire_id || !a.dam_id) {
    fCache.set(id, 0);
    return 0;
  }
  const { minimal } = sharedAncestors(a.sire_id, a.dam_id);
  let F = 0;
  for (const m of minimal) {
    F += Math.pow(0.5, m.dSire + m.dDam + 1) * (1 + inbreedingOf(m.id));
  }
  fCache.set(id, F);
  return F;
}

/**
 * Wright's coefficient of inbreeding of a hypothetical calf of sire × dam,
 * summed over the closest shared ancestors across every recorded generation.
 */
function compatibility(sireId, damId) {
  const sire = getAnimal.get(sireId);
  const dam = getAnimal.get(damId);
  if (!sire) throw new ApiError(404, `Sire #${sireId} not found`);
  if (!dam) throw new ApiError(404, `Dam #${damId} not found`);

  const aS = ancestorMap(sireId);
  const aD = ancestorMap(damId);
  const { all, minimal } = sharedAncestors(sireId, damId);
  const minimalIds = new Set(minimal.map((m) => m.id));

  let F = 0;
  const shared = all.map((entry) => {
    const isMinimal = minimalIds.has(entry.id);
    const contribution = isMinimal
      ? Math.pow(0.5, entry.dSire + entry.dDam + 1) * (1 + inbreedingOf(entry.id))
      : 0;
    F += contribution;
    const via = isMinimal
      ? null
      : minimal
        .filter((m) => m.id !== entry.id && ancestorMap(m.id).has(entry.id))
        .map((m) => summary(m.id))[0] || null;
    return {
      ancestor: summary(entry.id),
      sire_generations: entry.dSire,
      dam_generations: entry.dDam,
      contribution: Number(contribution.toFixed(6)),
      is_closest: isMinimal,
      via: via ? { id: via.id, href: via.href, name_en: via.name_en, name_ta: via.name_ta } : null,
    };
  });

  // direct parent–offspring or same-animal problems
  const direct = [];
  if (Number(sireId) === Number(damId)) direct.push('Sire and dam are the same animal.');
  if (String(sire.sex) !== 'BULL') direct.push(`${sire.name_en} is recorded as a COW, not a bull.`);
  if (String(dam.sex) !== 'COW') direct.push(`${dam.name_en} is recorded as a BULL, not a cow.`);
  if (aS.has(Number(damId))) direct.push(`${dam.name_en} is an ancestor of ${sire.name_en} (parent–offspring line).`);
  if (aD.has(Number(sireId))) direct.push(`${sire.name_en} is an ancestor of ${dam.name_en} (parent–offspring line).`);

  shared.sort((x, y) => y.contribution - x.contribution || x.sire_generations - y.sire_generations);
  const pct = F * 100;
  let risk = 'NONE';
  let verdict;
  if (pct < 0.0001) {
    risk = 'NONE';
    verdict = 'No shared ancestor is recorded for these two animals in any generation.';
  } else if (pct < 3.125) {
    risk = 'LOW';
    verdict = 'A distant common ancestor exists. Usually acceptable, but worth noting in the herd book.';
  } else if (pct < 12.5) {
    risk = 'MODERATE';
    verdict = 'Noticeable line-breeding. Consider an unrelated bull to widen the gene pool.';
  } else {
    risk = 'HIGH';
    verdict = 'Close relatives. Strongly consider an unrelated sire to avoid inbreeding depression.';
  }
  if (direct.length && risk === 'NONE') risk = 'HIGH';

  return {
    sire: summary(sireId),
    dam: summary(damId),
    shared_ancestors: shared,
    shared_ancestor_count: shared.length,
    closest_ancestor_count: minimal.length,
    inbreeding_coefficient: Number(pct.toFixed(3)),
    inbreeding_percent: `${pct.toFixed(2)}%`,
    risk_level: risk,
    verdict,
    warnings: direct,
    relationship: relationshipLabel(shared.filter((s) => s.is_closest)),
  };
}

function relationshipLabel(shared) {
  if (!shared.length) return null;
  const best = shared[0];
  const { sire_generations: a, dam_generations: b } = best;
  const pair = [Math.min(a, b), Math.max(a, b)].join(':');
  switch (pair) {
    case '0:1': return 'Parent × offspring — a direct parent–child pairing';
    case '0:2': return 'Grandparent × grandchild';
    case '0:3': return 'Great-grandparent × great-grandchild';
    case '1:1': return 'Siblings — both animals share a parent';
    case '1:2': return 'Uncle / aunt × niece / nephew';
    case '1:3': return 'Great-uncle / great-aunt × grand-niece / grand-nephew';
    case '2:2': return 'First cousins';
    case '2:3': return 'First cousin once removed';
    case '2:4': return 'First cousin twice removed';
    case '3:3': return 'Second cousins';
    default: {
      const d = Math.max(a, b);
      return `Shared ancestor ${d} generation${d === 1 ? '' : 's'} back`;
    }
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Serialisation
 * ──────────────────────────────────────────────────────────────────────────── */
const qPrimaryMedia = db.prepare(
  `SELECT * FROM animal_media WHERE animal_id = ?
   ORDER BY is_primary DESC, id ASC LIMIT 1`
);
const qMedia = db.prepare('SELECT * FROM animal_media WHERE animal_id = ? ORDER BY is_primary DESC, id ASC');
const qOwnerships = db.prepare(
  `SELECT o.*, ow.name_ta AS owner_name_ta, ow.name_en AS owner_name_en, ow.farm_name,
          ow.phone, ow.village AS owner_village, ow.district AS owner_district,
          ow.is_contact_public
   FROM animal_ownerships o LEFT JOIN owners ow ON ow.id = o.owner_id
   WHERE o.animal_id = ?
   ORDER BY CASE o.role WHEN 'BREEDER' THEN 0 WHEN 'PREVIOUS_OWNER' THEN 1 ELSE 2 END,
            o.sequence_order ASC, o.id ASC`
);
const qCurrentOwner = db.prepare(
  `SELECT o.role, o.sequence_order, o.from_date, o.place_note,
          ow.id AS owner_id, ow.name_ta, ow.name_en, ow.farm_name, ow.phone,
          ow.village, ow.district, ow.is_contact_public
   FROM animal_ownerships o JOIN owners ow ON ow.id = o.owner_id
   WHERE o.animal_id = ? AND o.role = 'CURRENT_OWNER'
   ORDER BY o.sequence_order DESC LIMIT 1`
);
const qAchCount = db.prepare('SELECT COUNT(*) AS n FROM achievements WHERE animal_id = ?');
const qOffspringCount = db.prepare(
  'SELECT COUNT(*) AS n FROM animals WHERE (sire_id = ? OR dam_id = ?) AND archived_at IS NULL'
);
const qOffspring = db.prepare(
  `SELECT * FROM animals WHERE (sire_id = ? OR dam_id = ?) AND archived_at IS NULL
   ORDER BY COALESCE(dob, '9999') ASC`
);
const qAchievements = db.prepare(
  `SELECT a.*, p.name_ta AS partner_name_ta, p.name_en AS partner_name_en
   FROM achievements a LEFT JOIN animals p ON p.id = a.partner_animal_id
   WHERE a.animal_id = ?
   ORDER BY COALESCE(a.event_date, '0000') DESC, a.id DESC`
);

function bool(v) {
  return v === 1 || v === true || v === '1' || v === 'true';
}

/** Lightweight animal shape used inside trees, lists and links. */
function summary(id) {
  const a = typeof id === 'object' ? id : getAnimal.get(id);
  if (!a) return null;
  const media = qPrimaryMedia.get(a.id);
  return {
    id: a.id,
    href: `/animals/${a.id}`,
    tag_or_reg_no: a.tag_or_reg_no,
    name_ta: a.name_ta,
    name_en: a.name_en,
    sex: a.sex,
    current_color: a.current_color,
    color_label: ENUMS.colors[a.current_color],
    current_village: a.current_village,
    current_district: a.current_district,
    is_stub: bool(a.is_stub),
    status: a.status,
    review_status: a.review_status,
    submitted_at: a.submitted_at,
    dob: a.dob,
    dob_precision: a.dob_precision,
    photo_url: media ? media.media_url : null,
    documented_generations: documentedGenerations(a.id),
  };
}

/** Full profile. */
function detail(id, { withChildren = true } = {}) {
  const a = getAnimal.get(id);
  if (!a) throw new ApiError(404, `Animal #${id} not found`);
  const media = qMedia.all(a.id);
  const ownerships = qOwnerships.all(a.id).map((o) => ({
    id: o.id,
    animal_id: o.animal_id,
    owner_id: o.owner_id,
    role: o.role,
    role_label: ENUMS.roles[o.role],
    sequence_order: o.sequence_order,
    from_date: o.from_date,
    to_date: o.to_date,
    place_note: o.place_note,
    owner: o.owner_id
      ? {
        id: o.owner_id,
        href: `/owners/${o.owner_id}`,
        name_ta: o.owner_name_ta,
        name_en: o.owner_name_en,
        farm_name: o.farm_name,
        village: o.owner_village,
        district: o.owner_district,
        phone: bool(o.is_contact_public) ? o.phone : null,
        is_contact_public: bool(o.is_contact_public),
      }
      : null,
  }));
  const current = qCurrentOwner.get(a.id);
  const achievements = qAchievements.all(a.id).map(serializeAchievement);
  const offspring = withChildren ? qOffspring.all(a.id, a.id).map((o) => summary(o)) : [];

  return {
    ...a,
    is_stub: bool(a.is_stub),
    is_archived: Boolean(a.archived_at),
    age: ageFrom(a.dob, a.dob_precision, a.dentition_stage),
    labels: {
      current_color: ENUMS.colors[a.current_color],
      birth_color: a.birth_color ? ENUMS.birthColors[a.birth_color] : null,
      dob_precision: ENUMS.dobPrecision[a.dob_precision],
      dentition_stage: a.dentition_stage ? ENUMS.dentition[a.dentition_stage] : null,
      status: ENUMS.status[a.status],
    },
    photo_url: media.length ? media[0].media_url : null,
    media,
    ownerships,
    current_owner: current
      ? {
        owner_id: current.owner_id,
        href: `/owners/${current.owner_id}`,
        name_ta: current.name_ta,
        name_en: current.name_en,
        farm_name: current.farm_name,
        village: current.village,
        district: current.district,
        phone: bool(current.is_contact_public) ? current.phone : null,
        is_contact_public: bool(current.is_contact_public),
        since: current.from_date,
        place_note: current.place_note,
      }
      : null,
    sire: a.sire_id ? summary(a.sire_id) : null,
    dam: a.dam_id ? summary(a.dam_id) : null,
    documented_generations: documentedGenerations(a.id),
    offspring,
    offspring_count: offspring.length,
    achievement_count: achievements.length,
    achievements,
    breeding_events: db
      .prepare('SELECT * FROM breeding_events WHERE sire_id = ? OR dam_id = ? OR calf_id = ? ORDER BY COALESCE(mating_date, expected_calving_date, \'\') DESC')
      .all(a.id, a.id, a.id),
  };
}

function serializeAchievement(row) {
  return {
    ...row,
    category_label: ENUMS.categories[row.category],
    href: `/animals/${row.animal_id}/achievements`,
    partner: row.partner_animal_id
      ? {
        id: row.partner_animal_id,
        href: `/animals/${row.partner_animal_id}`,
        name_ta: row.partner_name_ta,
        name_en: row.partner_name_en,
      }
      : null,
  };
}

function serializeOwner(o, { includePhone = true } = {}) {
  return {
    ...o,
    is_contact_public: bool(o.is_contact_public),
    phone: includePhone && bool(o.is_contact_public) ? o.phone : null,
    has_private_phone: !bool(o.is_contact_public) && Boolean(o.phone),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Validation helpers
 * ──────────────────────────────────────────────────────────────────────────── */
const oneOf = (value, dict) => Object.prototype.hasOwnProperty.call(dict, value);

function validateAnimalPayload(body, { partial = false, current = null } = {}) {
  const errors = [];
  const data = {};

  const take = (field) => (body[field] !== undefined ? body[field] : undefined);
  const requireText = (field, label, { ta = false } = {}) => {
    const v = take(field);
    if (v === undefined) {
      if (!partial) errors.push(`${label} is required`);
      return;
    }
    if (v === null || String(v).trim() === '') {
      errors.push(`${label} is required`);
      return;
    }
    data[field] = String(v).trim();
    if (ta && !/[\u0B80-\u0BFF]/.test(data[field])) {
      // soft warning only — served through meta.warnings
    }
  };

  requireText('name_ta', 'Tamil name (name_ta)', { ta: true });
  requireText('name_en', 'English name (name_en)');

  if (body.sex !== undefined || !partial) {
    if (!['BULL', 'COW'].includes(body.sex)) errors.push('sex must be BULL or COW');
    else data.sex = body.sex;
  }
  if (body.current_color !== undefined || !partial) {
    const v = body.current_color ?? 'MAYILAI';
    if (!oneOf(v, ENUMS.colors)) errors.push(`current_color must be one of ${Object.keys(ENUMS.colors).join(', ')}`);
    else data.current_color = v;
  }
  if (body.dob_precision !== undefined) {
    if (!oneOf(body.dob_precision, ENUMS.dobPrecision)) errors.push('Invalid dob_precision');
    else data.dob_precision = body.dob_precision;
  } else if (!partial) {
    data.dob_precision = 'EXACT';
  }
  if (body.dentition_stage !== undefined) {
    if (body.dentition_stage && !oneOf(body.dentition_stage, ENUMS.dentition)) errors.push('Invalid dentition_stage');
    else data.dentition_stage = body.dentition_stage || null;
  }
  if (body.birth_color !== undefined) {
    if (body.birth_color && !oneOf(body.birth_color, ENUMS.birthColors)) errors.push('Invalid birth_color');
    else data.birth_color = body.birth_color || null;
  }
  if (body.status !== undefined) {
    if (!oneOf(body.status, ENUMS.status)) errors.push('Invalid status');
    else data.status = body.status;
  }
  if (body.dob !== undefined) {
    if (body.dob && !/^\d{4}-\d{2}(-\d{2})?$/.test(body.dob)) errors.push('dob must be YYYY-MM-DD or YYYY-MM');
    else data.dob = body.dob || null;
  }
  for (const f of ['tag_or_reg_no', 'distinctive_markings', 'current_village', 'current_district', 'notes']) {
    if (body[f] !== undefined) data[f] = body[f] === null || body[f] === '' ? null : String(body[f]).trim();
  }
  if (body.is_stub !== undefined) data.is_stub = body.is_stub ? 1 : 0;

  // parent links
  for (const [field, expectedSex] of [['sire_id', 'BULL'], ['dam_id', 'COW']]) {
    if (body[field] === undefined) continue;
    const v = body[field];
    if (v === null || v === '' || v === 0) {
      data[field] = null;
      continue;
    }
    const id = Number(v);
    if (!Number.isInteger(id) || id <= 0) {
      errors.push(`${field} must be a valid animal id`);
      continue;
    }
    const parent = getAnimal.get(id);
    if (!parent) {
      errors.push(`${field}: animal #${id} does not exist`);
      continue;
    }
    if (parent.sex !== expectedSex) {
      errors.push(`${field}: ${parent.name_en} is a ${parent.sex}, expected a ${expectedSex}`);
      continue;
    }
    if (current && createsCycle(current.id, id)) {
      errors.push(`${field}: linking ${parent.name_en} would create a pedigree loop`);
      continue;
    }
    data[field] = id;
  }

  if (errors.length) throw new ApiError(422, 'Validation failed', errors);
  return data;
}

module.exports = {
  ENUMS,
  ANIMAL_FIELDS,
  ApiError,
  ageFrom,
  documentedGenerations,
  ancestorMap,
  descendants,
  createsCycle,
  compatibility,
  summary,
  detail,
  serializeAchievement,
  serializeOwner,
  validateAnimalPayload,
  clearCaches,
  bool,
  getAnimal,
  qMedia,
  qOwnerships,
  qAchievements,
};
