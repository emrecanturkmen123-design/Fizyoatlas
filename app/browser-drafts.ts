type Parser<T> = (value: unknown) => T | null;

function read<T>(storage: Storage, key: string, parse: Parser<T>): T | null {
  try {
    return parse(JSON.parse(storage.getItem(key) ?? "null"));
  } catch {
    return null;
  }
}

// Old, tab-only copies are removed only after a durable write succeeds.
export function readBrowserDraft<T>(key: string, parse: Parser<T>, merge?: (saved: T, legacy: T) => T, encode?: (value: T) => unknown): T | null {
  let saved: T | null = null, legacy: T | null = null;
  try { saved = read(localStorage, key, parse); } catch {}
  try { legacy = read(sessionStorage, key, parse); } catch {}
  if (!legacy) return saved;
  const value = saved ? (merge ? merge(saved, legacy) : saved) : legacy;
  try { writeBrowserDraft(key, encode ? encode(value) : value); } catch {}
  return value;
}

export function writeBrowserDraft(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  try { sessionStorage.removeItem(key); } catch {}
}

// An import must not erase a draft changed by another tab while the account saves.
export function removeBrowserDraft<T>(key: string, expected: T, parse: Parser<T>) {
  for (const kind of ["localStorage", "sessionStorage"] as const) {
    try {
      const storage = globalThis[kind];
      if (JSON.stringify(read(storage, key, parse)) === JSON.stringify(expected)) storage.removeItem(key);
    } catch {}
  }
}
