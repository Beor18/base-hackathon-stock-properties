const TIMEOUT_MS = 20_000;

/** GET a JSON document, failing loudly with the URL on any network or HTTP error. */
export async function fetchJson<T = unknown>(url: string | URL, headers: Record<string, string> = {}): Promise<T> {
  const response = await fetch(url, {
    headers: { accept: "application/json", ...headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`GET ${url} responded ${response.status}`);
  return (await response.json()) as T;
}
