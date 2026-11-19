PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS animals (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  tag_or_reg_no        TEXT UNIQUE,
  name_ta              TEXT NOT NULL,
  name_en              TEXT NOT NULL,
  sex                  TEXT NOT NULL CHECK (sex IN ('BULL','COW')),
  dob                  TEXT,
  dob_precision        TEXT NOT NULL DEFAULT 'ESTIMATED_BY_TEETH'
                       CHECK (dob_precision IN ('EXACT','MONTH_YEAR','YEAR_ONLY','ESTIMATED_BY_TEETH')),
  dentition_stage      TEXT CHECK (dentition_stage IN ('CALF_MILK_TEETH','TWO_TOOTH','FOUR_TOOTH','SIX_TOOTH','FULL_MOUTH')),
  birth_color          TEXT CHECK (birth_color IN ('RED_FAWN','GREY','BLACK','OTHER')),
  current_color        TEXT NOT NULL DEFAULT 'MAYILAI'
                       CHECK (current_color IN ('MAYILAI','KARI_MAYILAI','SEVALAI','KARAMBAI','VELLAI','OTHER')),
  distinctive_markings TEXT,
  current_village      TEXT,
  current_district     TEXT,
  sire_id              INTEGER REFERENCES animals(id) ON DELETE SET NULL,
  dam_id               INTEGER REFERENCES animals(id) ON DELETE SET NULL,
  is_stub              INTEGER NOT NULL DEFAULT 0,
  status               TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SOLD','DECEASED')),
  notes                TEXT,
  archived_at          TEXT,
  review_status        TEXT NOT NULL DEFAULT 'APPROVED'
                       CHECK (review_status IN ('PENDING','APPROVED','REJECTED')),
  submitted_at         TEXT,
  reviewed_at          TEXT,
  review_note          TEXT,
  submitter_name       TEXT,
  submitter_phone      TEXT,
  created_at           TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_animals_sex    ON animals(sex);
CREATE INDEX IF NOT EXISTS idx_animals_color  ON animals(current_color);
CREATE INDEX IF NOT EXISTS idx_animals_sire   ON animals(sire_id);
CREATE INDEX IF NOT EXISTS idx_animals_dam    ON animals(dam_id);
CREATE INDEX IF NOT EXISTS idx_animals_village ON animals(current_village);

CREATE TABLE IF NOT EXISTS owners (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ta           TEXT,
  name_en           TEXT NOT NULL,
  farm_name         TEXT,
  phone             TEXT,
  village           TEXT,
  district          TEXT,
  is_contact_public INTEGER NOT NULL DEFAULT 0,
  notes             TEXT,
  review_status     TEXT NOT NULL DEFAULT 'APPROVED'
                    CHECK (review_status IN ('PENDING','APPROVED','REJECTED')),
  submitted_at      TEXT,
  reviewed_at       TEXT,
  review_note       TEXT,
  submitter_name    TEXT,
  submitter_phone   TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_owners_district ON owners(district);

CREATE TABLE IF NOT EXISTS animal_ownerships (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_id      INTEGER NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  owner_id       INTEGER REFERENCES owners(id) ON DELETE SET NULL,
  role           TEXT NOT NULL CHECK (role IN ('BREEDER','PREVIOUS_OWNER','CURRENT_OWNER')),
  sequence_order INTEGER NOT NULL DEFAULT 1,
  from_date      TEXT,
  to_date        TEXT,
  place_note     TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ownership_animal ON animal_ownerships(animal_id);
CREATE INDEX IF NOT EXISTS idx_ownership_owner  ON animal_ownerships(owner_id);

CREATE TABLE IF NOT EXISTS animal_media (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_id   INTEGER NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  media_url   TEXT NOT NULL,
  media_type  TEXT NOT NULL DEFAULT 'PHOTO' CHECK (media_type IN ('PHOTO','VIDEO')),
  life_stage  TEXT CHECK (life_stage IN ('CALF','TWO_TOOTH','FOUR_TOOTH','ADULT','EVENT')),
  caption     TEXT,
  is_primary  INTEGER NOT NULL DEFAULT 0,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_media_animal ON animal_media(animal_id);

CREATE TABLE IF NOT EXISTS achievements (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_id          INTEGER NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  category           TEXT NOT NULL CHECK (category IN ('REKLA_RACE','JALLIKATTU','BREED_SHOW','PROGENY_MILESTONE','DAIRY_LACTATION','DRAUGHT_ENDURANCE')),
  event_name         TEXT NOT NULL,
  location           TEXT,
  event_date         TEXT,
  rank_or_metric     TEXT NOT NULL,
  partner_animal_id  INTEGER REFERENCES animals(id) ON DELETE SET NULL,
  notes              TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ach_animal   ON achievements(animal_id);
CREATE INDEX IF NOT EXISTS idx_ach_category ON achievements(category);

CREATE TABLE IF NOT EXISTS breeding_events (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  sire_id               INTEGER REFERENCES animals(id) ON DELETE SET NULL,
  dam_id                INTEGER REFERENCES animals(id) ON DELETE SET NULL,
  mating_date           TEXT,
  expected_calving_date TEXT,
  calf_id               INTEGER REFERENCES animals(id) ON DELETE SET NULL,
  notes                 TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);
