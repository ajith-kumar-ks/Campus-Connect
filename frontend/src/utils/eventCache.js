const key = (clubId) => `cc_event_cache_${clubId}`;

export function readCache(clubId) {
  try { return JSON.parse(localStorage.getItem(key(clubId)) || '[]'); } catch { return []; }
}
function writeCache(clubId, events) {
  try { localStorage.setItem(key(clubId), JSON.stringify(events)); } catch { /* storage blocked */ }
}
export function upsertCached(clubId, event) {
  writeCache(clubId, [...readCache(clubId).filter((e) => e.id !== event.id), event]);
}
export function removeCached(clubId, id) {
  writeCache(clubId, readCache(clubId).filter((e) => e.id !== id));
}
export function findCached(clubId, id) {
  return readCache(clubId).find((e) => e.id === Number(id));
}
/* API items win. Cached events are only added when the API cannot return them (not "published"). */
export function mergeEvents(apiItems, cached) {
  const map = new Map(apiItems.map((e) => [e.id, e]));
  cached.forEach((e) => { if (!map.has(e.id) && e.status !== 'published') map.set(e.id, e); });
  return [...map.values()].sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
}
