/** Reserved for the confirmed backend adapter; the current demo adapter does not use this URL. */
export interface ApiConfig {
  readonly baseUrl: string | null;
}

export function createApiConfig(baseUrl?: string): ApiConfig {
  const value = baseUrl?.trim();
  if (!value) return { baseUrl: null };
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('API base URL must use HTTP(S), without credentials, query or fragment');
  }
  return { baseUrl: value.replace(/\/+$/, '') };
}

// Vite exposes this public configuration to the browser. Never put credentials here.
const env = (import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env;
export const apiConfig = createApiConfig(env?.VITE_API_BASE_URL);
