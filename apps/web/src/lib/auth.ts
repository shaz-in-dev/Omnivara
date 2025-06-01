/**
 * Client-side auth utilities.
 * Cookies are the source of truth (set here, read by middleware).
 */

const COOKIE_ACCESS  = 'access_token';
const COOKIE_REFRESH = 'refresh_token';
const COOKIE_MAX_AGE_ACCESS  = 15 * 60;          // 15 minutes
const COOKIE_MAX_AGE_REFRESH = 7 * 24 * 60 * 60; // 7 days

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Strict${
    location.protocol === 'https:' ? '; Secure' : ''
  }`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function saveTokens(accessToken: string, refreshToken: string) {
  setCookie(COOKIE_ACCESS,  accessToken,  COOKIE_MAX_AGE_ACCESS);
  setCookie(COOKIE_REFRESH, refreshToken, COOKIE_MAX_AGE_REFRESH);
}

export function clearTokens() {
  deleteCookie(COOKIE_ACCESS);
  deleteCookie(COOKIE_REFRESH);
}

export function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_ACCESS}=([^;]*)`));
  return match?.[1] != null ? decodeURIComponent(match[1]) : null;
}

export function getRefreshToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_REFRESH}=([^;]*)`));
  return match?.[1] != null ? decodeURIComponent(match[1]) : null;
}
