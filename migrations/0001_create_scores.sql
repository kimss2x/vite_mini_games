CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL,
  game_id TEXT NOT NULL,
  anonymous_user_id TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scores_game_created_score
  ON scores (game_id, created_at, score DESC);

CREATE INDEX IF NOT EXISTS idx_scores_game_score_created
  ON scores (game_id, score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scores_anon_created
  ON scores (anonymous_user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_scores_ip_created
  ON scores (ip_hash, created_at);

