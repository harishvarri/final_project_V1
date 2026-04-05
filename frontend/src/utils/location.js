const LOCATION_CACHE_PREFIX = 'civic-location-cache:';

function isValidCoordinate(latitude, longitude) {
  return Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) && !(Number(latitude) === 0 && Number(longitude) === 0);
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildFriendlyName(payload) {
  const address = payload?.address || {};
  const primary = [
    address.road,
    address.suburb,
    address.neighbourhood,
    address.village,
    address.town,
    address.city,
  ]
    .map(clean)
    .filter(Boolean);
  const secondary = [address.state_district, address.state]
    .map(clean)
    .filter(Boolean);
  const preferred = [...new Set([...primary, ...secondary])];
  return preferred.length ? preferred.slice(0, 3).join(', ') : clean(payload?.display_name);
}

export function formatCoordinates(latitude, longitude) {
  if (!isValidCoordinate(latitude, longitude)) return '';
  return `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`;
}

function getCacheKey(latitude, longitude) {
  return `${LOCATION_CACHE_PREFIX}${Number(latitude).toFixed(4)},${Number(longitude).toFixed(4)}`;
}

export function getCachedLocationName(latitude, longitude) {
  if (!isValidCoordinate(latitude, longitude)) return '';
  try {
    return localStorage.getItem(getCacheKey(latitude, longitude)) || '';
  } catch {
    return '';
  }
}

function setCachedLocationName(latitude, longitude, value) {
  if (!isValidCoordinate(latitude, longitude) || !value) return;
  try {
    localStorage.setItem(getCacheKey(latitude, longitude), value);
  } catch {
    // Ignore localStorage failures.
  }
}

export async function lookupLocationName(latitude, longitude, language = 'en') {
  if (!isValidCoordinate(latitude, longitude)) return '';

  const cached = getCachedLocationName(latitude, longitude);
  if (cached) return cached;

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));
  url.searchParams.set('zoom', '18');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', language === 'te' ? 'te,en' : 'en');

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return '';

    const payload = await response.json();
    const label = buildFriendlyName(payload);
    if (label) setCachedLocationName(latitude, longitude, label);
    return label;
  } catch {
    return '';
  }
}
