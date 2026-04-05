const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const backendBaseUrl = (import.meta.env.VITE_BACKEND_URL || '').trim();

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

export function getBackendBaseUrl() {
  if (backendBaseUrl) return stripTrailingSlash(backendBaseUrl);
  if (/^https?:\/\//i.test(apiBaseUrl)) {
    return stripTrailingSlash(apiBaseUrl.replace(/\/api\/?$/i, ''));
  }
  return '';
}

export function resolveMediaUrl(value) {
  if (!value) return null;
  if (/^(https?:\/\/|data:|blob:)/i.test(value)) return value;

  const backendBase = getBackendBaseUrl();
  if (value.startsWith('/')) return backendBase ? `${backendBase}${value}` : value;
  return backendBase ? `${backendBase}/${value.replace(/^\/+/, '')}` : value;
}
