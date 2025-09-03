import React from "react";

export type GameId = "menu" | "pingpong" | "tetris" | "snake" | "omok" | "lightsout" | "simon" | "reaction" | "aim" | "breakout" | "flappy" | "memory" | "dodge" | "2048" | "slide" | "sokoban" | "connect4" | "minigolf" | "tictactoe";

type Props = {
  onSelect: (id: Exclude<GameId, "menu">) => void;
};

export default function GameMenu({ onSelect }: Props) {
  const Card: React.FC<{
    title: string;
    desc: string;
    onClick: () => void;
  }> = ({ title, desc, onClick }) => (
    <button
      onClick={onClick}
      style={{
        display: "grid",
        gap: 8,
        textAlign: "left",
        background:
          "linear-gradient(180deg, rgba(35,36,42,.9), rgba(27,28,33,.9))",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 14,
        padding: 16,
        width: 280,
        cursor: "pointer",
        boxShadow:
          "0 10px 30px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.03)",
        color: "#e8e8ea",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 18 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#bcbcbe", lineHeight: 1.35 }}>
        {desc}
      </div>
    </button>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f12",
        color: "#e8e8ea",
        display: "grid",
        placeItems: "center",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans KR", sans-serif',
        padding: 24,
      }}
    >
      <div style={{ display: "grid", gap: 18, placeItems: "center" }}>
        <div
          style={{
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: ".4px",
            textAlign: "center",
          }}
        >
          🎮 미니 게임 모음
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            alignItems: "stretch",
            width: "min(880px, 92vw)",
          }}
        >
          <Card
            title="🏓 Ping Pong"
            desc="마우스/키보드로 패들을 조작해 AI와 대결해요."
            onClick={() => onSelect("pingpong")}
          />
          <Card
            title="🧱 Tetris"
            desc="회전/드랍/홀드로 라인을 지우며 점수를 올려요."
            onClick={() => onSelect("tetris")}
          />
          <Card
            title="🐍 Snake"
            desc="먹이를 먹고 길어지세요. 벽/몸에 부딪히면 게임 오버!"
            onClick={() => onSelect("snake")}
          />
          <Card
            title="○● Omok"
            desc="번갈아 돌을 놓아 다섯 줄을 만들어요."
            onClick={() => onSelect("omok")}
          />
          <Card
            title="💡 Lights Out"
            desc="모든 불을 끄세요! 셀을 누르면 상하좌우가 토글됩니다."
            onClick={() => onSelect("lightsout")}
          />
          <Card
            title="🎨 Simon Says"
            desc="점점 길어지는 색상 패턴을 기억해서 따라하세요!"
            onClick={() => onSelect("simon")}
          />
          <Card
            title="⚡ Reaction Test"
            desc="화면이 초록색으로 바뀌는 순간 클릭! 반응속도를 테스트하세요."
            onClick={() => onSelect("reaction")}
          />
          <Card
            title="🎯 Aim Trainer"
            desc="나타나는 원 타격을 븠르게 클릭! 마우스 정확도를 향상시켜요."
            onClick={() => onSelect("aim")}
          />
          <Card
            title="🧱 Breakout"
            desc="공과 패들로 벽돌을 부수세요! 물리 충돌과 반사를 느껴보세요."
            onClick={() => onSelect("breakout")}
          />
          <Card
            title="🐦 Flappy Bird"
            desc="점프해서 파이프 사이를 통과하세요! 중력과 가속도를 마스터하세요."
            onClick={() => onSelect("flappy")}
          />
          <Card
            title="🧠 Memory Cards"
            desc="같은 그림의 카드 2장을 찾아서 매칭하세요! 기억력과 집중력을 테스트해보세요."
            onClick={() => onSelect("memory")}
          />
          <Card
            title="🚫 Dodge Game"
            desc="WASD로 이동해서 떨어지는 블록을 피하세요! 시간이 지날수록 난이도가 증가합니다."
            onClick={() => onSelect("dodge")}
          />
          <Card
            title="🔢 2048"
            desc="같은 숫자 타일을 슬라이드해서 합치고 2048을 만드세요! 전략적 사고가 필요합니다."
            onClick={() => onSelect("2048")}
          />
          <Card
            title="🧩 Slide Puzzle"
            desc="빈 칸과 인접한 타일을 슬라이드하여 1~15 순서로 정렬하세요! 클래식 15퍼즐입니다."
            onClick={() => onSelect("slide")}
          />
          <Card
            title="🚚 Sokoban"
            desc="박스를 목표 지점으로 밀어서 모든 퍼즐을 해결하세요! 되돌리기 기능과 5개 레벨 제공."
            onClick={() => onSelect("sokoban")}
          />
          <Card
            title="🔴 Connect Four"
            desc="6x7 격자에서 4개 칩을 연속으로 연결하세요! AI와 대전하며 전략적 사고력을 기르세요."
            onClick={() => onSelect("connect4")}
          />
          <Card
            title="⛳ Mini Golf"
            desc="드래그로 파워를 조절해서 골프공을 홀에 넣으세요! 물리 엔진과 벽 반사를 활용하세요."
            onClick={() => onSelect("minigolf")}
          />
          <Card
            title="⭕ Tic-Tac-Toe"
            desc="X와 O를 번갈아 두며, 가로·세로·대각선으로 3개를 먼저 연결하면 승리! 클래식 틱택토 게임입니다."
            onClick={() => onSelect("tictactoe")}
          />
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#a9a9ad",
            textAlign: "center",
          }}
        >
          Tip: 키보드 <b>1</b> = Ping Pong, <b>2</b> = Tetris, <b>3</b> = Snake, <b>4</b> = Omok, <b>5</b> = Lights Out, <b>6</b> = Simon Says, <b>7</b> = Reaction Test, <b>8</b> = Aim Trainer, <b>9</b> = Breakout, <b>0</b> = Flappy Bird, <b>T</b> = Tic-Tac-Toe
        </div>
      </div>
    </div>
  );
}
