import Service from '@ember/service';

const BASE = '/api/v1';

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

  async request(path, { method = 'GET', body } = {}) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
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
    return this.request('/animals', { method: 'POST', body: payload }).then((r) => r.data);
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
    return this.request('/owners', { method: 'POST', body: payload }).then((r) => r.data);
  }

  updateOwner(id, payload) {
    return this.request(`/owners/${id}`, { method: 'PATCH', body: payload }).then((r) => r.data);
  }
}
