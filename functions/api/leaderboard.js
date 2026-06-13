const DEFAULT_GAME_ID = "noah-ping-pong-garden";

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

function publicScore(row) {
  return {
    id: row.id,
    nickname: row.nickname,
    score: row.score,
    game_id: row.game_id,
    created_at: row.created_at,
  };
}

export async function onRequestGet({ env, request }) {
  if (!env.DB) {
    return json({ error: "D1 binding DB is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const gameId = url.searchParams.get("game_id") || DEFAULT_GAME_ID;

  const todayQuery = env.DB.prepare(
    `SELECT id, nickname, score, game_id, created_at
       FROM scores
      WHERE game_id = ?1
        AND created_at >= datetime('now', 'start of day')
      ORDER BY score DESC, created_at ASC
      LIMIT 10`
  ).bind(gameId);

  const allTimeQuery = env.DB.prepare(
    `SELECT id, nickname, score, game_id, created_at
       FROM scores
      WHERE game_id = ?1
      ORDER BY score DESC, created_at ASC
      LIMIT 10`
  ).bind(gameId);

  const [todayResult, allTimeResult] = await Promise.all([
    todayQuery.all(),
    allTimeQuery.all(),
  ]);

  return json({
    game_id: gameId,
    today: (todayResult.results || []).map(publicScore),
    all_time: (allTimeResult.results || []).map(publicScore),
  });
}

