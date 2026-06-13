const DEFAULT_GAME_ID = "noah-ping-pong-garden";
const MAX_SCORE = 999999;
const MAX_SUBMISSIONS_PER_10_MINUTES = 5;

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function normalizeNickname(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 20);
}

function normalizeAnonymousId(value) {
  const id = String(value || "").trim();
  return /^[a-zA-Z0-9_-]{12,80}$/.test(id) ? id : "";
}

function getClientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0"
  );
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function validateTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET_KEY) {
    return { ok: false, error: "Turnstile secret is not configured." };
  }

  const formData = new FormData();
  formData.append("secret", env.TURNSTILE_SECRET_KEY);
  formData.append("response", token || "");
  formData.append("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });
  const result = await response.json();

  return result.success
    ? { ok: true }
    : { ok: false, error: "Turnstile validation failed.", details: result["error-codes"] || [] };
}

async function isRateLimited(db, anonymousUserId, ipHash) {
  const windowStart = "datetime('now', '-10 minutes')";

  const anonResult = await db
    .prepare(
      `SELECT COUNT(*) AS count
         FROM scores
        WHERE anonymous_user_id = ?1
          AND created_at >= ${windowStart}`
    )
    .bind(anonymousUserId)
    .first();

  const ipResult = await db
    .prepare(
      `SELECT COUNT(*) AS count
         FROM scores
        WHERE ip_hash = ?1
          AND created_at >= ${windowStart}`
    )
    .bind(ipHash)
    .first();

  return (
    Number(anonResult?.count || 0) >= MAX_SUBMISSIONS_PER_10_MINUTES ||
    Number(ipResult?.count || 0) >= MAX_SUBMISSIONS_PER_10_MINUTES
  );
}

export async function onRequestPost({ env, request }) {
  if (!env.DB) {
    return json({ error: "D1 binding DB is not configured." }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const nickname = normalizeNickname(body.nickname);
  const score = Number(body.score);
  const gameId = String(body.game_id || DEFAULT_GAME_ID).trim().slice(0, 64);
  const anonymousUserId = normalizeAnonymousId(body.anonymous_user_id);
  const turnstileToken = String(body.turnstile_token || "");

  if (!nickname) {
    return json({ error: "Nickname is required." }, { status: 400 });
  }
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return json({ error: "Score must be a valid non-negative integer." }, { status: 400 });
  }
  if (!anonymousUserId) {
    return json({ error: "anonymous_user_id is required." }, { status: 400 });
  }
  if (!turnstileToken) {
    return json({ error: "Turnstile token is required." }, { status: 400 });
  }

  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "unknown";
  const hashSecret = env.IP_HASH_SECRET || env.TURNSTILE_SECRET_KEY || "local-dev-secret";
  const [ipHash, userAgentHash] = await Promise.all([
    sha256Hex(`${hashSecret}:ip:${ip}`),
    sha256Hex(`${hashSecret}:ua:${userAgent}`),
  ]);

  const turnstile = await validateTurnstile(env, turnstileToken, ip);
  if (!turnstile.ok) {
    return json({ error: turnstile.error, details: turnstile.details }, { status: 403 });
  }

  if (await isRateLimited(env.DB, anonymousUserId, ipHash)) {
    return json({ error: "Too many score submissions. Please try again later." }, { status: 429 });
  }

  const insert = await env.DB.prepare(
    `INSERT INTO scores (
       nickname,
       score,
       game_id,
       anonymous_user_id,
       ip_hash,
       user_agent_hash,
       created_at
     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))`
  )
    .bind(nickname, score, gameId, anonymousUserId, ipHash, userAgentHash)
    .run();

  return json(
    {
      ok: true,
      id: insert.meta?.last_row_id,
      nickname,
      score,
      game_id: gameId,
    },
    { status: 201 }
  );
}

