const STORAGE_KEY = "noah_studio_anonymous_user_id";

function createAnonymousUserId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `anon_${Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function getAnonymousUserId() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const nextId = createAnonymousUserId();
  localStorage.setItem(STORAGE_KEY, nextId);
  return nextId;
}

