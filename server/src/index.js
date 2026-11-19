'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const QRCode = require('qrcode');

const { db, seedIfEmpty, DB_MODE } = require('./db');
const {
  ENUMS, ApiError, ageFrom, documentedGenerations, ancestorMap, descendants,
  compatibility, summary, detail, serializeAchievement, serializeOwner,
  validateAnimalPayload, clearCaches, bool, getAnimal, qMedia, qOwnerships, qAchievements,
} = require('./lib');

seedIfEmpty();

const app = express();
app.use(express.json({ limit: '6mb' }));

/* ── tiny request log ───────────────────────────────────────────────────── */
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) process.stdout.write(`  ${req.method} ${req.originalUrl}\n`);
  next();
});

const api = express.Router();

/* ── helpers ────────────────────────────────────────────────────────────── */
function paginate(req, rows) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(req.query.per_page || req.query.perPage) || 24));
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return {
    data: rows.slice((page - 1) * perPage, page * perPage),
    meta: { page, per_page: perPage, total, total_pages: totalPages },
  };
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const qAchievementFeed = db.prepare(`
  SELECT a.*, an.name_ta AS animal_name_ta, an.name_en AS animal_name_en, an.sex AS animal_sex,
         an.current_color, an.current_village, an.current_district,
         p.name_ta AS partner_name_ta, p.name_en AS partner_name_en
  FROM achievements a
  JOIN animals an ON an.id = a.animal_id
  LEFT JOIN animals p ON p.id = a.partner_animal_id
  WHERE an.archived_at IS NULL
`);

function feedRow(r) {
  return {
    ...serializeAchievement(r),
    animal: {
      id: r.animal_id,
      href: `/animals/${r.animal_id}`,
      name_ta: r.animal_name_ta,
      name_en: r.animal_name_en,
      sex: r.animal_sex,
      current_color: r.current_color,
      color_label: ENUMS.colors[r.current_color],
      current_village: r.current_village,
      current_district: r.current_district,
    },
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * META / STATS
 * ────────────────────────────────────────────────────────────────────────── */
api.get('/health', (_req, res) => {
  const animals = db.prepare('SELECT COUNT(*) AS n FROM animals').get().n;
  res.json({ data: { status: 'ok', animals, database: DB_MODE, serverless: Boolean(process.env.VERCEL) } });
});

api.get('/meta', (_req, res) => {
  res.json({
    data: {
      enums: ENUMS,
      region: { name_ta: 'கொங்கு நாடு', name_en: 'Kongu Nadu', districts: ['Tiruppur', 'Erode', 'Coimbatore', 'Karur', 'Namakkal', 'Dindigul', 'Salem'] },
    },
  });
});

api.get('/stats', (_req, res) => {
  const one = (sql) => db.prepare(sql).get();
  const bulls = one("SELECT COUNT(*) AS n FROM animals WHERE sex = 'BULL' AND archived_at IS NULL").n;
  const cows = one("SELECT COUNT(*) AS n FROM animals WHERE sex = 'COW' AND archived_at IS NULL").n;
  const stubs = one('SELECT COUNT(*) AS n FROM animals WHERE is_stub = 1 AND archived_at IS NULL').n;
  const owners = one('SELECT COUNT(*) AS n FROM owners').n;
  const achievements = one('SELECT COUNT(*) AS n FROM achievements').n;
  const villages = one('SELECT COUNT(*) AS n FROM (SELECT DISTINCT current_village FROM animals WHERE current_village IS NOT NULL)').n;
  const all = db.prepare('SELECT id FROM animals WHERE archived_at IS NULL').all();
  const generations = all.map((a) => documentedGenerations(a.id));
  const deepest = generations.length ? Math.max(...generations) : 0;
  const byColor = db.prepare(
    `SELECT current_color, COUNT(*) AS count FROM animals WHERE archived_at IS NULL GROUP BY current_color ORDER BY count DESC`
  ).all().map((r) => ({ color: r.current_color, label: ENUMS.colors[r.current_color], count: r.count }));
  const byCategory = db.prepare(
    'SELECT category, COUNT(*) AS count FROM achievements GROUP BY category ORDER BY count DESC'
  ).all().map((r) => ({ category: r.category, label: ENUMS.categories[r.category], count: r.count }));
  const recent = db.prepare(
    'SELECT * FROM animals WHERE archived_at IS NULL ORDER BY created_at DESC, id DESC LIMIT 6'
  ).all().map((a) => summary(a));

  res.json({
    data: {
      animals: bulls + cows, bulls, cows, stubs, owners, achievements, villages,
      deepest_generations: deepest,
      gen_zero: generations.filter((g) => g === 0).length,
      fully_documented: generations.filter((g) => g >= 3).length,
      by_color: byColor,
      by_category: byCategory,
      recent_animals: recent,
    },
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * ANIMALS
 * ────────────────────────────────────────────────────────────────────────── */
api.get('/animals', (req, res) => {
  const q = req.query;
  const where = [];
  const params = [];
  if (!bool(q.include_archived)) where.push('archived_at IS NULL');
  if (q.sex) { where.push('sex = ?'); params.push(String(q.sex).toUpperCase()); }
  if (q.color) { where.push('current_color = ?'); params.push(String(q.color).toUpperCase()); }
  if (q.village) { where.push('LOWER(current_village) LIKE ?'); params.push(`%${String(q.village).toLowerCase()}%`); }
  if (q.district) { where.push('LOWER(current_district) LIKE ?'); params.push(`%${String(q.district).toLowerCase()}%`); }
  if (q.status) { where.push('status = ?'); params.push(String(q.status).toUpperCase()); }
  if (q.is_stub !== undefined) { where.push('is_stub = ?'); params.push(bool(q.is_stub) ? 1 : 0); }
  if (q.sire_id) { where.push('sire_id = ?'); params.push(Number(q.sire_id)); }
  if (q.dam_id) { where.push('dam_id = ?'); params.push(Number(q.dam_id)); }
  if (q.id) { where.push('id = ?'); params.push(Number(q.id)); }
  if (q.q) {
    const term = `%${String(q.q).trim().toLowerCase()}%`;
    where.push(`(
      LOWER(name_ta) LIKE ? OR LOWER(name_en) LIKE ? OR LOWER(COALESCE(tag_or_reg_no,'')) LIKE ?
      OR LOWER(COALESCE(current_village,'')) LIKE ? OR LOWER(COALESCE(distinctive_markings,'')) LIKE ?
      OR LOWER(COALESCE(notes,'')) LIKE ? OR LOWER(COALESCE(current_district,'')) LIKE ?
      OR id IN (SELECT animal_id FROM animal_ownerships WHERE owner_id IN (
          SELECT id FROM owners WHERE LOWER(COALESCE(name_ta,'')) LIKE ? OR LOWER(name_en) LIKE ?
             OR LOWER(COALESCE(farm_name,'')) LIKE ?))
      OR id IN (SELECT animal_id FROM animal_ownerships WHERE owner_id IN (
          SELECT id FROM owners WHERE LOWER(COALESCE(village,'')) LIKE ?))
    )`);
    params.push(term, term, term, term, term, term, term, term, term, term, term);
  }

  const sql = `SELECT * FROM animals ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`;
  let rows = db.prepare(sql).all(...params).map((a) => {
    const s = summary(a);
    s.age = ageFrom(a.dob, a.dob_precision, a.dentition_stage);
    s.achievement_count = qAchievements.all(a.id).length;
    s.offspring_count = db.prepare(
      'SELECT COUNT(*) AS n FROM animals WHERE (sire_id = ? OR dam_id = ?) AND archived_at IS NULL'
    ).get(a.id, a.id).n;
    s.media_count = qMedia.all(a.id).length;
    s.label_current_color = ENUMS.colors[a.current_color];
    return s;
  });

  // computed filters
  if (q.min_generations !== undefined && q.min_generations !== '') {
    const min = Number(q.min_generations);
    rows = rows.filter((r) => r.documented_generations >= min);
  }
  if (q.max_generations !== undefined && q.max_generations !== '') {
    const max = Number(q.max_generations);
    rows = rows.filter((r) => r.documented_generations <= max);
  }
  if (bool(q.has_achievements)) rows = rows.filter((r) => r.achievement_count > 0);
  if (bool(q.has_media)) rows = rows.filter((r) => r.media_count > 0);

  const sort = q.sort || 'recent';
  const sorters = {
    recent: (a, b) => b.id - a.id,
    name: (a, b) => a.name_en.localeCompare(b.name_en),
    name_ta: (a, b) => a.name_ta.localeCompare(b.name_ta),
    generations: (a, b) => b.documented_generations - a.documented_generations || a.name_en.localeCompare(b.name_en),
    achievements: (a, b) => b.achievement_count - a.achievement_count || a.name_en.localeCompare(b.name_en),
    offspring: (a, b) => b.offspring_count - a.offspring_count,
    oldest: (a, b) => String(a.dob || '9999').localeCompare(String(b.dob || '9999')),
  };
  rows.sort(sorters[sort] || sorters.recent);

  const { data, meta } = paginate(req, rows);
  res.json({
    data,
    meta: {
      ...meta,
      filters: {
        sex: q.sex || null, color: q.color || null, village: q.village || null,
        min_generations: q.min_generations ?? null, has_achievements: bool(q.has_achievements),
        q: q.q || null, sort,
      },
    },
  });
});

api.post('/animals', (req, res) => {
  const body = req.body || {};
  const data = validateAnimalPayload(body, { partial: false });

  if (data.tag_or_reg_no) {
    const dupe = db.prepare('SELECT id FROM animals WHERE tag_or_reg_no = ?').get(data.tag_or_reg_no);
    if (dupe) throw new ApiError(409, `Tag ${data.tag_or_reg_no} is already used by animal #${dupe.id}`);
  }

  const cols = Object.keys(data);
  const sql = `INSERT INTO animals (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
  const info = db.prepare(sql).run(...cols.map((c) => data[c]));
  const id = Number(info.lastInsertRowid);

  // optional inline ownership + media in the same call (fast rural entry)
  const created = { owners: [], media: [] };
  if (req.body.owner_id || (req.body.owner && req.body.owner.name_en)) {
    const ownerId = req.body.owner_id || createOwnerInline(req.body.owner);
    db.prepare(
      `INSERT INTO animal_ownerships (animal_id, owner_id, role, sequence_order, from_date, place_note)
       VALUES (?, ?, ?, 1, ?, ?)`
    ).run(id, ownerId, req.body.owner_role || 'CURRENT_OWNER', req.body.owner_from_date || null, data.current_village || null);
    created.owners.push(ownerId);
  }
  if (Array.isArray(req.body.media)) {
    for (const m of req.body.media) {
      if (!m || !m.media_url) continue;
      db.prepare(
        `INSERT INTO animal_media (animal_id, media_url, media_type, life_stage, caption, is_primary)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(id, m.media_url, m.media_type || 'PHOTO', m.life_stage || null, m.caption || null, m.is_primary ? 1 : 0);
      created.media.push(m.media_url);
    }
  }
  clearCaches();
  res.status(201).json({ data: detail(id) });
});

api.get('/animals/:id', (req, res) => {
  res.json({ data: detail(req.params.id) });
});

api.patch('/animals/:id', (req, res) => {
  const current = getAnimal.get(req.params.id);
  if (!current) throw new ApiError(404, `Animal #${req.params.id} not found`);
  const data = validateAnimalPayload(req.body || {}, { partial: true, current });

  if (data.tag_or_reg_no) {
    const dupe = db.prepare('SELECT id FROM animals WHERE tag_or_reg_no = ? AND id <> ?').get(data.tag_or_reg_no, current.id);
    if (dupe) throw new ApiError(409, `Tag ${data.tag_or_reg_no} is already used by animal #${dupe.id}`);
  }
  const cols = Object.keys(data);
  if (cols.length) {
    db.prepare(`UPDATE animals SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`)
      .run(...cols.map((c) => data[c]), current.id);
  }
  clearCaches();
  res.json({ data: detail(current.id) });
});

api.delete('/animals/:id', (req, res) => {
  const animal = getAnimal.get(req.params.id);
  if (!animal) throw new ApiError(404, `Animal #${req.params.id} not found`);
  const dependents = db.prepare(
    'SELECT COUNT(*) AS n FROM animals WHERE sire_id = ? OR dam_id = ?'
  ).get(animal.id, animal.id).n;
  const force = bool(req.query.force) || bool((req.body || {}).force);

  if (dependents > 0 && !force) {
    db.prepare("UPDATE animals SET archived_at = datetime('now'), status = 'DECEASED' WHERE id = ?").run(animal.id);
    clearCaches();
    return res.status(200).json({
      data: { id: animal.id, archived: true, deleted: false },
      meta: { message: `Animal has ${dependents} pedigree link(s); record archived instead of deleted. Pass ?force=true to delete anyway.` },
    });
  }
  db.prepare('DELETE FROM animals WHERE id = ?').run(animal.id);
  clearCaches();
  res.status(200).json({ data: { id: animal.id, archived: false, deleted: true } });
});

/* ── pedigree ───────────────────────────────────────────────────────────── */
function treeNode(id, depthLeft, seen = new Set()) {
  if (!id || seen.has(id)) return null;
  const a = getAnimal.get(id);
  if (!a) return null;
  seen.add(id);
  const node = {
    ...summary(a),
    generation_of_ancestor: null,
    sire: depthLeft > 1 ? treeNode(a.sire_id, depthLeft - 1, seen) : null,
    dam: depthLeft > 1 ? treeNode(a.dam_id, depthLeft - 1, seen) : null,
    has_hidden_ancestors: depthLeft <= 1 && Boolean(a.sire_id || a.dam_id),
  };
  seen.delete(id);
  return node;
}

api.get('/animals/:id/pedigree', (req, res) => {
  const animal = getAnimal.get(req.params.id);
  if (!animal) throw new ApiError(404, `Animal #${req.params.id} not found`);
  const depth = Math.min(12, Math.max(0, Number(req.query.depth ?? 5)));

  const buildSide = (parentId, level) => {
    if (!parentId || depth === 0) return null;
    const node = treeNode(parentId, depth);
    return node;
  };

  const ancestors = depth === 0
    ? { sire: null, dam: null }
    : { sire: buildSide(animal.sire_id), dam: buildSide(animal.dam_id) };

  const offspring = descendants(animal.id, 12).map((d) => {
    const child = summary(d.id);
    const other = d.via === 'SIRE'
      ? (getAnimal.get(d.id)?.dam_id ? summary(getAnimal.get(d.id).dam_id) : null)
      : (getAnimal.get(d.id)?.sire_id ? summary(getAnimal.get(d.id).sire_id) : null);
    return { ...child, depth: d.depth, via: d.via, other_parent: other, role: d.via === 'SIRE' ? 'offspring_of_sire' : 'offspring_of_dam' };
  });

  const anc = ancestorMap(animal.id);
  const byGeneration = [];
  for (let g = 1; g <= depth; g += 1) {
    const ids = [...anc.entries()].filter(([, d]) => d === g).map(([i]) => i);
    if (!ids.length) continue;
    byGeneration.push({ generation: g, animals: ids.map((i) => summary(i)) });
  }

  res.json({
    data: {
      animal: summary(animal),
      depth,
      documented_generations: documentedGenerations(animal.id),
      ancestor_count: anc.size,
      ancestors,
      by_generation: byGeneration,
      offspring,
      offspring_count: offspring.length,
    },
  });
});

api.get('/pedigree/compatibility', (req, res) => {
  const sireId = num(req.query.sire_id);
  const damId = num(req.query.dam_id);
  if (!sireId || !damId) throw new ApiError(400, 'sire_id and dam_id query params are required');
  res.json({ data: compatibility(sireId, damId) });
});

/* ── media ──────────────────────────────────────────────────────────────── */
api.get('/animals/:id/media', (req, res) => {
  const animal = getAnimal.get(req.params.id);
  if (!animal) throw new ApiError(404, 'Animal not found');
  res.json({ data: qMedia.all(animal.id), meta: { total: qMedia.all(animal.id).length } });
});

api.post('/animals/:id/media', (req, res) => {
  const animal = getAnimal.get(req.params.id);
  if (!animal) throw new ApiError(404, 'Animal not found');
  const b = req.body || {};
  if (!b.media_url || typeof b.media_url !== 'string') throw new ApiError(422, 'media_url is required');
  const type = b.media_type === 'VIDEO' ? 'VIDEO' : 'PHOTO';
  if (b.life_stage && !ENUMS.lifeStage[b.life_stage]) throw new ApiError(422, 'Invalid life_stage');

  const isPrimary = b.is_primary ? 1 : 0;
  if (isPrimary) db.prepare('UPDATE animal_media SET is_primary = 0 WHERE animal_id = ?').run(animal.id);
  // first photo automatically becomes primary
  const count = qMedia.all(animal.id).length;
  const info = db.prepare(
    `INSERT INTO animal_media (animal_id, media_url, media_type, life_stage, caption, is_primary)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(animal.id, b.media_url, type, b.life_stage || null, b.caption || null, count === 0 ? 1 : isPrimary);
  res.status(201).json({ data: db.prepare('SELECT * FROM animal_media WHERE id = ?').get(info.lastInsertRowid) });
});

api.patch('/animals/:id/media/:mediaId', (req, res) => {
  const animal = getAnimal.get(req.params.id);
  if (!animal) throw new ApiError(404, 'Animal not found');
  const media = db.prepare('SELECT * FROM animal_media WHERE id = ? AND animal_id = ?').get(req.params.mediaId, animal.id);
  if (!media) throw new ApiError(404, 'Media not found');
  const b = req.body || {};
  if (b.is_primary) db.prepare('UPDATE animal_media SET is_primary = 0 WHERE animal_id = ?').run(animal.id);
  db.prepare(
    `UPDATE animal_media SET
       caption = COALESCE(?, caption),
       life_stage = COALESCE(?, life_stage),
       media_type = COALESCE(?, media_type),
       is_primary = COALESCE(?, is_primary)
     WHERE id = ?`
  ).run(
    b.caption ?? null,
    b.life_stage ?? null,
    b.media_type === 'VIDEO' || b.media_type === 'PHOTO' ? b.media_type : null,
    b.is_primary === undefined ? null : b.is_primary ? 1 : 0,
    media.id
  );
  res.json({ data: db.prepare('SELECT * FROM animal_media WHERE id = ?').get(media.id) });
});

api.delete('/animals/:id/media/:mediaId', (req, res) => {
  const media = db.prepare('SELECT * FROM animal_media WHERE id = ? AND animal_id = ?').get(req.params.mediaId, req.params.id);
  if (!media) throw new ApiError(404, 'Media not found');
  db.prepare('DELETE FROM animal_media WHERE id = ?').run(media.id);
  if (media.is_primary) {
    const next = db.prepare('SELECT id FROM animal_media WHERE animal_id = ? ORDER BY id LIMIT 1').get(media.animal_id);
    if (next) db.prepare('UPDATE animal_media SET is_primary = 1 WHERE id = ?').run(next.id);
  }
  res.json({ data: { id: media.id, deleted: true } });
});

/* ── ownerships ─────────────────────────────────────────────────────────── */
function createOwnerInline(owner) {
  if (!owner || !owner.name_en || !String(owner.name_en).trim()) {
    throw new ApiError(422, 'owner.name_en is required when creating an owner inline');
  }
  const info = db.prepare(
    `INSERT INTO owners (name_ta, name_en, farm_name, phone, village, district, is_contact_public)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    owner.name_ta || null, String(owner.name_en).trim(), owner.farm_name || null,
    owner.phone || null, owner.village || null, owner.district || null,
    owner.is_contact_public ? 1 : 0
  );
  return Number(info.lastInsertRowid);
}

api.get('/animals/:id/ownerships', (req, res) => {
  const animal = getAnimal.get(req.params.id);
  if (!animal) throw new ApiError(404, 'Animal not found');
  const rows = qOwnerships.all(animal.id).map((o) => ({
    ...o,
    role_label: ENUMS.roles[o.role],
    owner: o.owner_id ? { id: o.owner_id, name_ta: o.owner_name_ta, name_en: o.owner_name_en, farm_name: o.farm_name, village: o.owner_village, district: o.owner_district, phone: bool(o.is_contact_public) ? o.phone : null, is_contact_public: bool(o.is_contact_public), href: `/owners/${o.owner_id}` } : null,
  }));
  res.json({ data: rows, meta: { total: rows.length } });
});

api.post('/animals/:id/ownerships', (req, res) => {
  const animal = getAnimal.get(req.params.id);
  if (!animal) throw new ApiError(404, 'Animal not found');
  const b = req.body || {};
  const role = b.role || 'CURRENT_OWNER';
  if (!ENUMS.roles[role]) throw new ApiError(422, 'role must be BREEDER, PREVIOUS_OWNER or CURRENT_OWNER');
  if (b.role === 'PREVIOUS_OWNER') throw new ApiError(422, 'Use role PREVIOUS_OWNER only with sequence_order');

  let ownerId = b.owner_id ? Number(b.owner_id) : null;
  if (ownerId) {
    const exists = db.prepare('SELECT id FROM owners WHERE id = ?').get(ownerId);
    if (!exists) throw new ApiError(422, `Owner #${ownerId} does not exist`);
  } else if (b.owner && b.owner.name_en) {
    ownerId = createOwnerInline(b.owner);
  } else {
    throw new ApiError(422, 'Provide owner_id or an owner object with name_en');
  }

  if (role === 'CURRENT_OWNER') {
    db.prepare("UPDATE animal_ownerships SET role = 'PREVIOUS_OWNER', to_date = COALESCE(to_date, ?) WHERE animal_id = ? AND role = 'CURRENT_OWNER'")
      .run(b.from_date || null, animal.id);
  }
  const seq = b.sequence_order != null
    ? Number(b.sequence_order)
    : (db.prepare('SELECT COALESCE(MAX(sequence_order), 0) + 1 AS n FROM animal_ownerships WHERE animal_id = ?').get(animal.id).n);
  const info = db.prepare(
    `INSERT INTO animal_ownerships (animal_id, owner_id, role, sequence_order, from_date, to_date, place_note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(animal.id, ownerId, role, seq, b.from_date || null, b.to_date || null, b.place_note || null);
  res.status(201).json({ data: db.prepare('SELECT * FROM animal_ownerships WHERE id = ?').get(info.lastInsertRowid) });
});

api.patch('/animals/:id/ownerships/:ownershipId', (req, res) => {
  const row = db.prepare('SELECT * FROM animal_ownerships WHERE id = ? AND animal_id = ?')
    .get(req.params.ownershipId, req.params.id);
  if (!row) throw new ApiError(404, 'Ownership entry not found');
  const b = req.body || {};
  if (b.role && !ENUMS.roles[b.role]) throw new ApiError(422, 'Invalid role');
  if (b.owner_id) {
    const exists = db.prepare('SELECT id FROM owners WHERE id = ?').get(Number(b.owner_id));
    if (!exists) throw new ApiError(422, 'Owner not found');
  }
  if (b.role === 'CURRENT_OWNER' && row.role !== 'CURRENT_OWNER') {
    db.prepare("UPDATE animal_ownerships SET role = 'PREVIOUS_OWNER' WHERE animal_id = ? AND role = 'CURRENT_OWNER'")
      .run(row.animal_id);
  }
  db.prepare(
    `UPDATE animal_ownerships SET
       owner_id = COALESCE(?, owner_id),
       role = COALESCE(?, role),
       sequence_order = COALESCE(?, sequence_order),
       from_date = COALESCE(?, from_date),
       to_date = COALESCE(?, to_date),
       place_note = COALESCE(?, place_note)
     WHERE id = ?`
  ).run(
    b.owner_id ? Number(b.owner_id) : null, b.role || null,
    b.sequence_order != null ? Number(b.sequence_order) : null,
    b.from_date || null, b.to_date || null, b.place_note || null, row.id
  );
  res.json({ data: db.prepare('SELECT * FROM animal_ownerships WHERE id = ?').get(row.id) });
});

api.delete('/animals/:id/ownerships/:ownershipId', (req, res) => {
  const row = db.prepare('SELECT * FROM animal_ownerships WHERE id = ? AND animal_id = ?')
    .get(req.params.ownershipId, req.params.id);
  if (!row) throw new ApiError(404, 'Ownership entry not found');
  db.prepare('DELETE FROM animal_ownerships WHERE id = ?').run(row.id);
  res.json({ data: { id: row.id, deleted: true } });
});

/* ── achievements ───────────────────────────────────────────────────────── */
function validateAchievement(b, { partial = false } = {}) {
  const errors = [];
  const out = {};
  if (b.category !== undefined || !partial) {
    if (!ENUMS.categories[b.category]) errors.push(`category must be one of ${Object.keys(ENUMS.categories).join(', ')}`);
    else out.category = b.category;
  }
  if (b.event_name !== undefined || !partial) {
    if (!b.event_name || !String(b.event_name).trim()) errors.push('event_name is required');
    else out.event_name = String(b.event_name).trim();
  }
  if (b.rank_or_metric !== undefined || !partial) {
    if (!b.rank_or_metric || !String(b.rank_or_metric).trim()) errors.push('rank_or_metric is required');
    else out.rank_or_metric = String(b.rank_or_metric).trim();
  }
  for (const f of ['location', 'event_date', 'notes']) {
    if (b[f] !== undefined) out[f] = b[f] ? String(b[f]) : null;
  }
  if (b.partner_animal_id !== undefined) {
    if (!b.partner_animal_id) out.partner_animal_id = null;
    else {
      const p = getAnimal.get(Number(b.partner_animal_id));
      if (!p) errors.push('partner_animal_id does not exist');
      else out.partner_animal_id = p.id;
    }
  }
  if (errors.length) throw new ApiError(422, 'Validation failed', errors);
  return out;
}

api.get('/achievements', (req, res) => {
  const q = req.query;
  const where = [];
  const params = [];
  if (q.category) { where.push('a.category = ?'); params.push(String(q.category).toUpperCase()); }
  if (q.animal_id) { where.push('a.animal_id = ?'); params.push(Number(q.animal_id)); }
  if (q.sex) { where.push('an.sex = ?'); params.push(String(q.sex).toUpperCase()); }
  if (q.district) { where.push('LOWER(COALESCE(an.current_district,\'\')) LIKE ?'); params.push(`%${String(q.district).toLowerCase()}%`); }
  if (q.year) { where.push("SUBSTR(COALESCE(a.event_date,''),1,4) = ?"); params.push(String(q.year)); }
  if (q.q) {
    const t = `%${String(q.q).toLowerCase()}%`;
    where.push('(LOWER(a.event_name) LIKE ? OR LOWER(a.rank_or_metric) LIKE ? OR LOWER(an.name_en) LIKE ? OR LOWER(an.name_ta) LIKE ? OR LOWER(COALESCE(a.location,\'\')) LIKE ?)');
    params.push(t, t, t, t, t);
  }
  const rows = db.prepare(
    `SELECT a.*, an.name_ta AS animal_name_ta, an.name_en AS animal_name_en, an.sex AS animal_sex,
            an.current_color, an.current_village, an.current_district,
            p.name_ta AS partner_name_ta, p.name_en AS partner_name_en
     FROM achievements a
     JOIN animals an ON an.id = a.animal_id
     LEFT JOIN animals p ON p.id = a.partner_animal_id
     WHERE an.archived_at IS NULL ${where.length ? `AND ${where.join(' AND ')}` : ''}
     ORDER BY COALESCE(a.event_date, '0000') DESC, a.id DESC`
  ).all(...params).map(feedRow);

  const leaderboard = db.prepare(
    `SELECT an.id, an.name_ta, an.name_en, an.sex, an.current_color, COUNT(*) AS wins
     FROM achievements a JOIN animals an ON an.id = a.animal_id
     ${q.category ? 'WHERE a.category = ?' : ''}
     GROUP BY an.id ORDER BY wins DESC, an.name_en ASC LIMIT 8`
  ).all(...(q.category ? [String(q.category).toUpperCase()] : [])).map((r) => ({
    ...r, href: `/animals/${r.id}`, color_label: ENUMS.colors[r.current_color],
  }));

  const { data, meta } = paginate(req, rows);
  res.json({ data, meta: { ...meta, leaderboard } });
});

api.get('/animals/:id/achievements', (req, res) => {
  const animal = getAnimal.get(req.params.id);
  if (!animal) throw new ApiError(404, 'Animal not found');
  const rows = qAchievements.all(animal.id).map((r) => ({ ...serializeAchievement(r), animal_id: animal.id }));
  res.json({ data: rows, meta: { total: rows.length } });
});

api.post('/animals/:id/achievements', (req, res) => {
  const animal = getAnimal.get(req.params.id);
  if (!animal) throw new ApiError(404, 'Animal not found');
  const v = validateAchievement(req.body || {});
  const info = db.prepare(
    `INSERT INTO achievements (animal_id, category, event_name, location, event_date, rank_or_metric, partner_animal_id, notes)
     VALUES (@animal_id, @category, @event_name, @location, @event_date, @rank_or_metric, @partner_animal_id, @notes)`
  ).run({
    animal_id: animal.id, category: v.category, event_name: v.event_name,
    location: v.location ?? null, event_date: v.event_date ?? null,
    rank_or_metric: v.rank_or_metric, partner_animal_id: v.partner_animal_id ?? null, notes: v.notes ?? null,
  });
  const row = db.prepare('SELECT * FROM achievements WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ data: serializeAchievement(row) });
});

api.patch('/animals/:id/achievements/:achievementId', (req, res) => {
  const row = db.prepare('SELECT * FROM achievements WHERE id = ? AND animal_id = ?')
    .get(req.params.achievementId, req.params.id);
  if (!row) throw new ApiError(404, 'Achievement not found');
  const v = validateAchievement(req.body || {}, { partial: true });
  const cols = Object.keys(v);
  if (cols.length) {
    db.prepare(`UPDATE achievements SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`)
      .run(...cols.map((c) => v[c]), row.id);
  }
  res.json({ data: serializeAchievement(db.prepare('SELECT * FROM achievements WHERE id = ?').get(row.id)) });
});

api.delete('/animals/:id/achievements/:achievementId', (req, res) => {
  const row = db.prepare('SELECT * FROM achievements WHERE id = ? AND animal_id = ?')
    .get(req.params.achievementId, req.params.id);
  if (!row) throw new ApiError(404, 'Achievement not found');
  db.prepare('DELETE FROM achievements WHERE id = ?').run(row.id);
  res.json({ data: { id: row.id, deleted: true } });
});

/* ── owners ─────────────────────────────────────────────────────────────── */
api.get('/owners', (req, res) => {
  const q = req.query;
  const where = [];
  const params = [];
  if (q.q) {
    const t = `%${String(q.q).toLowerCase()}%`;
    where.push('(LOWER(COALESCE(name_ta,\'\')) LIKE ? OR LOWER(name_en) LIKE ? OR LOWER(COALESCE(farm_name,\'\')) LIKE ? OR LOWER(COALESCE(village,\'\')) LIKE ? OR LOWER(COALESCE(district,\'\')) LIKE ?)');
    params.push(t, t, t, t, t);
  }
  if (q.district) { where.push("LOWER(COALESCE(district,'')) LIKE ?"); params.push(`%${String(q.district).toLowerCase()}%`); }
  if (q.village) { where.push("LOWER(COALESCE(village,'')) LIKE ?"); params.push(`%${String(q.village).toLowerCase()}%`); }

  const rows = db.prepare(`SELECT * FROM owners ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY name_en`).all(...params)
    .map((o) => {
      const current = db.prepare(
        `SELECT COUNT(*) AS n FROM animal_ownerships WHERE owner_id = ? AND role = 'CURRENT_OWNER'`
      ).get(o.id).n;
      const total = db.prepare('SELECT COUNT(*) AS n FROM animal_ownerships WHERE owner_id = ?').get(o.id).n;
      return { ...serializeOwner(o), current_animals: current, total_links: total, href: `/owners/${o.id}` };
    });

  const { data, meta } = paginate(req, rows);
  res.json({ data, meta });
});

api.post('/owners', (req, res) => {
  const b = req.body || {};
  if (!b.name_en || !String(b.name_en).trim()) throw new ApiError(422, 'Validation failed', ['name_en is required']);
  const info = db.prepare(
    `INSERT INTO owners (name_ta, name_en, farm_name, phone, village, district, is_contact_public, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    b.name_ta || null, String(b.name_en).trim(), b.farm_name || null, b.phone || null,
    b.village || null, b.district || null, b.is_contact_public ? 1 : 0, b.notes || null
  );
  const owner = db.prepare('SELECT * FROM owners WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ data: serializeOwner(owner) });
});

api.get('/owners/:id', (req, res) => {
  const owner = db.prepare('SELECT * FROM owners WHERE id = ?').get(req.params.id);
  if (!owner) throw new ApiError(404, 'Owner not found');
  const links = db.prepare(
    `SELECT o.*, a.name_ta, a.name_en, a.sex, a.current_color, a.current_village, a.is_stub,
            (SELECT media_url FROM animal_media m WHERE m.animal_id = a.id ORDER BY is_primary DESC, id LIMIT 1) AS photo_url
     FROM animal_ownerships o JOIN animals a ON a.id = o.animal_id
     WHERE o.owner_id = ? AND a.archived_at IS NULL
     ORDER BY CASE o.role WHEN 'CURRENT_OWNER' THEN 0 WHEN 'BREEDER' THEN 1 ELSE 2 END,
              o.sequence_order ASC`
  ).all(owner.id).map((r) => ({
    ownership_id: r.id,
    role: r.role,
    role_label: ENUMS.roles[r.role],
    from_date: r.from_date,
    to_date: r.to_date,
    place_note: r.place_note,
    animal: {
      id: r.animal_id, href: `/animals/${r.animal_id}`,
      name_ta: r.name_ta, name_en: r.name_en, sex: r.sex,
      current_color: r.current_color, color_label: ENUMS.colors[r.current_color],
      current_village: r.current_village, photo_url: r.photo_url, is_stub: bool(r.is_stub),
      documented_generations: documentedGenerations(r.animal_id),
    },
  }));
  const currently_owned = links.filter((l) => l.role === 'CURRENT_OWNER' || l.role === 'BREEDER');
  const previously_owned = links.filter((l) => l.role === 'PREVIOUS_OWNER');
  res.json({
    data: {
      ...serializeOwner(owner),
      currently_owned,
      previously_owned,
      counts: { current: currently_owned.length, previous: previously_owned.length },
    },
  });
});

api.patch('/owners/:id', (req, res) => {
  const owner = db.prepare('SELECT * FROM owners WHERE id = ?').get(req.params.id);
  if (!owner) throw new ApiError(404, 'Owner not found');
  const b = req.body || {};
  if (b.name_en !== undefined && !String(b.name_en).trim()) throw new ApiError(422, 'name_en cannot be empty');
  db.prepare(
    `UPDATE owners SET
       name_ta = COALESCE(?, name_ta), name_en = COALESCE(?, name_en), farm_name = COALESCE(?, farm_name),
       phone = COALESCE(?, phone), village = COALESCE(?, village), district = COALESCE(?, district),
       is_contact_public = COALESCE(?, is_contact_public), notes = COALESCE(?, notes)
     WHERE id = ?`
  ).run(
    b.name_ta ?? null, b.name_en !== undefined ? String(b.name_en).trim() : null, b.farm_name ?? null,
    b.phone ?? null, b.village ?? null, b.district ?? null,
    b.is_contact_public === undefined ? null : b.is_contact_public ? 1 : 0,
    b.notes ?? null, owner.id
  );
  res.json({ data: serializeOwner(db.prepare('SELECT * FROM owners WHERE id = ?').get(owner.id)) });
});

/* ── breeding events ────────────────────────────────────────────────────── */
api.get('/breeding-events', (req, res) => {
  const rows = db.prepare(
    `SELECT b.*, s.name_ta AS sire_name_ta, s.name_en AS sire_name_en,
            d.name_ta AS dam_name_ta, d.name_en AS dam_name_en,
            c.name_ta AS calf_name_ta, c.name_en AS calf_name_en
     FROM breeding_events b
     LEFT JOIN animals s ON s.id = b.sire_id
     LEFT JOIN animals d ON d.id = b.dam_id
     LEFT JOIN animals c ON c.id = b.calf_id
     ORDER BY COALESCE(b.mating_date, b.expected_calving_date, '') DESC`
  ).all();
  res.json({ data: rows, meta: { total: rows.length } });
});

/* ── QR badge (used on the printable pedigree certificate) ──────────────── */
api.get('/animals/:id/qr.svg', async (req, res) => {
  const animal = getAnimal.get(req.params.id);
  if (!animal) throw new ApiError(404, 'Animal not found');
  const host = req.query.target || `https://kangeyam.registry/animals/${animal.id}`;
  const svg = await QRCode.toString(host, { type: 'svg', margin: 0, width: 220, errorCorrectionLevel: 'M' });
  res.type('image/svg+xml').send(svg);
});

/* ── error handling ─────────────────────────────────────────────────────── */
api.use((req, res) => {
  res.status(404).json({ errors: [{ status: 404, title: 'Not Found', detail: `No API route for ${req.method} ${req.originalUrl}` }] });
});

app.use('/api/v1', api);

app.use((err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      errors: [{ status: err.status, title: err.message, detail: err.details || err.message }],
    });
  }
  console.error(err);
  res.status(500).json({ errors: [{ status: 500, title: 'Internal Server Error', detail: err.message }] });
});

/* ── static: Ember build + uploaded media ───────────────────────────────────
 * Local dev: this process serves the compiled SPA and the photos, so everything
 * runs on one origin (http://localhost:4000).
 * Vercel: the deployment uses two services, so the `web` service owns `/` and its
 * `/assets`, `/media`, `/fonts`; only `/api/*` is routed here and these mounts stay
 * dormant. Nothing in this file needs an internal service URL.
 * ────────────────────────────────────────────────────────────────────────── */
const WEB_DIST = path.join(__dirname, '..', '..', 'web', 'dist');
const MEDIA_DIRS = [
  path.join(__dirname, '..', '..', 'web', 'public', 'media'),
  path.join(__dirname, '..', '..', 'web', 'dist', 'media'),
  path.join(__dirname, '..', 'public', 'media'),
].filter((dir) => fs.existsSync(dir));
for (const dir of MEDIA_DIRS) app.use('/media', express.static(dir, { maxAge: '1h' }));
if (fs.existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST, { index: false }));
  app.get(/^\/(?!api|media).*/, (_req, res) => res.sendFile(path.join(WEB_DIST, 'index.html')));
} else {
  app.get('/', (_req, res) => res.type('text/plain').send('Kangeyam API is running. Build the Ember app in ../web to serve the UI.'));
}

const PORT = Number(process.env.PORT) || 4000;
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => console.log(`Kangeyam registry API on http://0.0.0.0:${PORT}`));
}

module.exports = app;
