const SLUG = 'async-trace-stitcher';
const API = 'https://api.sociobot.in/api/v1';
const TOKEN_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${TOKEN_KEY}:verdict`;

export const BUY_URL = `${API}/products/${SLUG}/checkout`;

interface Verdict { valid: boolean; checkedAt: number; reason?: string }

export function captureReturnedLicense(): void {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function storedToken(): string { return localStorage.getItem(TOKEN_KEY) ?? ''; }

export function cachedUnlock(): boolean {
  const token = storedToken();
  if (!token) return false;
  try {
    const verdict = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '') as Verdict;
    return verdict.valid;
  } catch { return false; }
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VERDICT_KEY);
}

export async function verifyLicense(force = false): Promise<Verdict | null> {
  const token = storedToken();
  if (!token) return null;
  try {
    const previous = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '') as Verdict;
    if (!force && Date.now() - previous.checkedAt < 86_400_000) return previous;
  } catch { /* first verification */ }
  try {
    const response = await fetch(`${API}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification unavailable');
    const body = await response.json() as { valid: boolean; reason?: string };
    const verdict = { valid: body.valid, reason: body.reason, checkedAt: Date.now() };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(verdict));
    return verdict;
  } catch {
    return null;
  }
}
