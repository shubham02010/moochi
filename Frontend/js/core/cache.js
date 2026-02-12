const CACHE_PREFIX = "streaming_app_";

export function setCache(key, data) {
  const payload = {
    time: Date.now(),
    data
  };
  sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(payload));
}

export function getCache(key, maxAge = 5 * 60 * 1000) {
  const raw = sessionStorage.getItem(CACHE_PREFIX + key);
  if (!raw) return null;

  try {
    const { time, data } = JSON.parse(raw);
    if (Date.now() - time > maxAge) {
      sessionStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
