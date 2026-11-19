import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

const BASE = '/api/v1';
const KEY_STORAGE = 'kangeyam.writeKey';

/**
 * The registry write key lives in localStorage only (never in the bundle).
 * It can also be seeded from a shareable link — `/?key=...` — which is then
 * stripped from the address bar so the key does not linger in history.
 */
function readStoredKey() {
  if (typeof window === 'undefined') return '';
  try {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get('key');
    if (fromUrl) {
      window.localStorage.setItem(KEY_STORAGE, fromUrl.trim());
      url.searchParams.delete('key');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      return fromUrl.trim();
    }
    return window.localStorage.getItem(KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export class ApiError extends Error {
  constructor(status, payload) {
    const first = payload?.errors?.[0];
    super(first?.title || `Request failed (${status})`);
    this.status = status;
    this.payload = payload;
    this.details = first?.detail;
  }

  get list() {
    const e = this.payload?.errors?.[0];
    if (!e) return [this.message];
    return Array.isArray(e.detail) ? e.detail : [e.detail || e.title];
  }
}

function qs(params = {}) {
  const parts = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export default class ApiService extends Service {
  base = BASE;
  @tracked writeKey = readStoredKey();

  get hasWriteKey() {
    return Boolean(this.writeKey);
  }

  setWriteKey(key) {
    const next = (key || '').trim();
    this.writeKey = next;
    try {
      if (next) window.localStorage.setItem(KEY_STORAGE, next);
      else window.localStorage.removeItem(KEY_STORAGE);
    } catch {
      /* storage blocked (private mode) — the key still works for this session */
    }
  }

  async request(path, { method = 'GET', body } = {}) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    // Sent on reads too: with a key the API returns pending rows for review.
    if (this.writeKey) headers['x-api-key'] = this.writeKey;

    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    let payload = null;
    const text = await res.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }
    if (!res.ok) throw new ApiError(res.status, payload);
    return payload;
  }

  /* ── registry ── */
  getStats() {
    return this.request('/stats').then((r) => r.data);
  }

  getMeta() {
    return this.request('/meta').then((r) => r.data);
  }

  listAnimals(params) {
    return this.request(`/animals${qs(params)}`);
  }

  getAnimal(id) {
    return this.request(`/animals/${id}`).then((r) => r.data);
  }

  createAnimal(payload) {
    // Returns { data, meta } — a public submission comes back 202 + PENDING.
    return this.request('/animals', { method: 'POST', body: payload });
  }

  updateAnimal(id, payload) {
    return this.request(`/animals/${id}`, { method: 'PATCH', body: payload }).then((r) => r.data);
  }

  deleteAnimal(id, force = false) {
    return this.request(`/animals/${id}${force ? '?force=true' : ''}`, { method: 'DELETE' });
  }

  /* ── pedigree ── */
  getPedigree(id, depth = 5) {
    return this.request(`/animals/${id}/pedigree?depth=${depth}`).then((r) => r.data);
  }

  checkCompatibility(sireId, damId) {
    return this.request(`/pedigree/compatibility${qs({ sire_id: sireId, dam_id: damId })}`).then((r) => r.data);
  }

  /* ── media ── */
  listMedia(id) {
    return this.request(`/animals/${id}/media`).then((r) => r.data);
  }

  addMedia(id, payload) {
    return this.request(`/animals/${id}/media`, { method: 'POST', body: payload }).then((r) => r.data);
  }

  updateMedia(id, mediaId, payload) {
    return this.request(`/animals/${id}/media/${mediaId}`, { method: 'PATCH', body: payload }).then((r) => r.data);
  }

  deleteMedia(id, mediaId) {
    return this.request(`/animals/${id}/media/${mediaId}`, { method: 'DELETE' });
  }

  /* ── ownerships ── */
  listOwnerships(id) {
    return this.request(`/animals/${id}/ownerships`).then((r) => r.data);
  }

  addOwnership(id, payload) {
    return this.request(`/animals/${id}/ownerships`, { method: 'POST', body: payload }).then((r) => r.data);
  }

  updateOwnership(id, ownershipId, payload) {
    return this.request(`/animals/${id}/ownerships/${ownershipId}`, { method: 'PATCH', body: payload }).then((r) => r.data);
  }

  deleteOwnership(id, ownershipId) {
    return this.request(`/animals/${id}/ownerships/${ownershipId}`, { method: 'DELETE' });
  }

  /* ── achievements ── */
  listAchievements(params) {
    return this.request(`/achievements${qs(params)}`);
  }

  listAnimalAchievements(id) {
    return this.request(`/animals/${id}/achievements`).then((r) => r.data);
  }

  addAchievement(id, payload) {
    return this.request(`/animals/${id}/achievements`, { method: 'POST', body: payload }).then((r) => r.data);
  }

  updateAchievement(id, achievementId, payload) {
    return this.request(`/animals/${id}/achievements/${achievementId}`, { method: 'PATCH', body: payload }).then((r) => r.data);
  }

  deleteAchievement(id, achievementId) {
    return this.request(`/animals/${id}/achievements/${achievementId}`, { method: 'DELETE' });
  }

  /* ── owners ── */
  listOwners(params) {
    return this.request(`/owners${qs(params)}`);
  }

  getOwner(id) {
    return this.request(`/owners/${id}`).then((r) => r.data);
  }

  createOwner(payload) {
    return this.request('/owners', { method: 'POST', body: payload });
  }

  /* ── admin review queue (registry key required) ── */
  getReviewQueue() {
    return this.request('/admin/queue');
  }

  reviewAnimal(id, action, note) {
    return this.request(`/admin/animals/${id}/review`, { method: 'POST', body: { action, note } });
  }

  reviewOwner(id, action, note) {
    return this.request(`/admin/owners/${id}/review`, { method: 'POST', body: { action, note } });
  }

  updateOwner(id, payload) {
    return this.request(`/owners/${id}`, { method: 'PATCH', body: payload }).then((r) => r.data);
  }
}
