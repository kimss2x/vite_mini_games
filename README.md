# Noah Studio Mini Games

작은 이야기와 귀여운 게임이 자라는 공간을 목표로 만든 Vite + React + TypeScript 미니 게임 사이트입니다.

첫 번째 게임은 **Noah Ping Pong Garden**입니다. 기존 Ping Pong 게임 로직은 유지하면서 브랜드 랜딩 페이지, 모바일 대응, 결과 화면, Cloudflare D1 기반 리더보드 MVP를 추가했습니다.

## 주요 기능

- 브랜드 메인 화면: `Noah Studio Mini Games`
- 첫 번째 게임: `Noah Ping Pong Garden`
- 터치 드래그, 마우스 이동, 키보드 조작 지원
- 결과 화면: 점수, `Play Again`, `Copy Result`
- 리더보드: Today TOP 10, All-time TOP 10
- 점수 제출: 닉네임 + 익명 사용자 ID + Cloudflare Turnstile
- 개인정보 보호: raw IP 저장 없음, IP/user-agent는 서버에서 해시 후 D1 저장

## 실행

```bash
npm install
npm run dev
```

기본 개발 서버는 `http://localhost:5173`입니다.

## 빌드

```bash
npm run build
npm run preview
```

빌드 결과는 `dist/` 폴더에 생성됩니다.

## Cloudflare Pages 배포

Cloudflare Pages 설정:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Node.js version: 20 권장

`wrangler.toml`에는 Pages 출력 폴더와 D1 binding 예시가 들어 있습니다. 실제 배포 전 `database_id`를 Cloudflare에서 생성한 D1 database ID로 바꾸세요.

## D1 설정

1. D1 database 생성:

```bash
npx wrangler d1 create noah_studio_mini_games
```

2. 출력된 `database_id`를 `wrangler.toml`에 입력:

```toml
[[d1_databases]]
binding = "DB"
database_name = "noah_studio_mini_games"
database_id = "your-database-id"
```

3. 스키마 적용:

```bash
npm run d1:migrate:remote
```

로컬 D1에 적용하려면:

```bash
npm run d1:migrate:local
```

스키마 파일은 `migrations/0001_create_scores.sql`입니다.

## Turnstile 설정

Cloudflare Turnstile에서 site key와 secret key를 생성합니다.

Pages 환경 변수:

- `VITE_TURNSTILE_SITE_KEY`: 브라우저에서 사용하는 Turnstile site key
- `TURNSTILE_SECRET_KEY`: Pages Function에서 Siteverify에 사용하는 secret key
- `IP_HASH_SECRET`: IP/user-agent 해시에 사용할 임의의 긴 secret

로컬 개발에서는 예시 파일을 복사해 값을 채웁니다.

```bash
copy .env.example .env
copy .dev.vars.example .dev.vars
```

Cloudflare 문서 기준으로 Turnstile은 클라이언트 위젯만으로는 보호가 끝나지 않으므로, `POST /api/scores`에서 서버 측 Siteverify 검증을 수행합니다.

## Pages Functions API

### `GET /api/leaderboard`

Query:

- `game_id`: 기본값 `noah-ping-pong-garden`

Response:

```json
{
  "game_id": "noah-ping-pong-garden",
  "today": [],
  "all_time": []
}
```

### `POST /api/scores`

Body:

```json
{
  "nickname": "Noah",
  "score": 5,
  "game_id": "noah-ping-pong-garden",
  "anonymous_user_id": "anon_xxx",
  "turnstile_token": "token_from_turnstile"
}
```

Server behavior:

- raw IP address is never stored
- `ip_hash` and `user_agent_hash` are created server-side
- rate limit checks use `anonymous_user_id` and `ip_hash`
- Turnstile must pass before a score is accepted

## Local Cloudflare Runtime

Vite dev server does not run Pages Functions. To test D1/API locally, build and run Cloudflare Pages dev:

```bash
npm run cf:dev
```

Then open the local URL printed by Wrangler.

## 조작 방법

- 터치/마우스: 왼쪽 패들을 위아래로 드래그 또는 이동
- 키보드: `W` / `S` 또는 `↑` / `↓`
- `Space`: 일시정지 / 재개
- `R`: 재시작

## 프로젝트 구조

```text
functions/
  api/
    leaderboard.js
    scores.js
migrations/
  0001_create_scores.sql
src/
  components/
    GameMenu.tsx
    GameManager.tsx
    LeaderboardPanel.tsx
    PureGameCanvas.tsx
  utils/
    anonymousUser.ts
  App.tsx
  games.tsx
  PingPongCanvas.tsx
wrangler.toml
```

이번 MVP에는 로그인, 유료 백엔드, 복잡한 관리자 페이지, 글로벌 멀티플레이를 포함하지 않습니다.
