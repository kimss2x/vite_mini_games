import React from 'react';
import { spacing, typography, colors, layout } from '../theme/gameTheme';

interface GameManagerProps {
  // 게임 식별 정보
  title: string;
  gameIcon?: string;

  // 상단 정보 (게임 상태/점수)
  gameStats?: React.ReactNode;
  gameStatus?: string;

  // 중앙 게임 캔버스
  children: React.ReactNode;

  // 하단 정보 (조작법/기능 버튼)
  controls?: React.ReactNode;
  instructions?: React.ReactNode;
  actionButtons?: React.ReactNode;

  // 선택적 콜백
  onBackToMenu?: () => void;
  // 신기록 배지용 (선택)
  score?: number;
}

/**
 * 이미지 로드 실패 시 조용히 사라지는 안전 이미지
 * (오버레이 UI가 깨지지 않도록 graceful fallback)
 */
const SafeImg: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ style, ...props }) => {
  const [ok, setOk] = React.useState(true);
  if (!ok) return null;
  return (
    <img
      {...props}
      onError={() => setOk(false)}
      style={{ maxWidth: '100%', objectFit: 'contain', ...style }}
      draggable={false}
    />
  );
};

/**
 * 통합 게임 매니저 컴포넌트
 */
const GameManager: React.FC<GameManagerProps> = ({
  title,
  gameIcon,
  gameStats,
  gameStatus,
  children,
  controls,
  instructions,
  actionButtons,
  onBackToMenu,
  score,
}) => {
  const [isNewRecord, setIsNewRecord] = React.useState(false);

  const isGameOver = !!gameStatus && /오버|패배|실패|game[\s\-]?over/i.test(gameStatus);
  const isVictory  = !!gameStatus && /승리|클리어|완료|이겼|victory|win/i.test(gameStatus);
  const showOverlay = isGameOver || isVictory;

  React.useEffect(() => {
    if (!showOverlay || score === undefined || score <= 0) {
      setIsNewRecord(false);
      return;
    }
    const key = 'hs_' + title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const prev = Number(localStorage.getItem(key) ?? 0);
    if (score > prev) {
      localStorage.setItem(key, String(score));
      setIsNewRecord(true);
    } else {
      setIsNewRecord(false);
    }
  }, [showOverlay, score, title]);

  // 점수 카운트업 애니메이션
  const [displayScore, setDisplayScore] = React.useState(0);
  React.useEffect(() => {
    if (!showOverlay || score === undefined || score <= 0) {
      setDisplayScore(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 650;
    const to = score;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showOverlay, score]);

  const handleBackToMenu = () => {
    if (onBackToMenu) {
      onBackToMenu();
    } else {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.appBackground,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'clamp(14px, 4vw, 32px)',
      paddingTop: 'clamp(64px, 12vw, 86px)',
      position: 'relative'
    }}>

      {/* 뒤로가기 메뉴 버튼 */}
      <button
        onClick={handleBackToMenu}
        style={{
          position: 'fixed',
          top: 'clamp(12px, 3vw, 24px)',
          left: 'clamp(12px, 3vw, 24px)',
          background: colors.buttonSecondary,
          color: colors.textPrimary,
          border: 'none',
          borderRadius: 12,
          padding: `${spacing.sm}px ${spacing.md}px`,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          transition: 'all 0.2s ease',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.buttonSecondaryHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = colors.buttonSecondary;
        }}
      >
        ← 메뉴로
      </button>

      {/* 메인 게임 영역 */}
      <div
        style={{
          width: '100%',
          maxWidth: `min(${layout.maxWidth}px, 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(14px, 4vw, 32px)',
        }}
      >

        {/* 상단 영역 */}
        <div
          style={{
            background: colors.panelBackground,
            borderRadius: 12,
            padding: 'clamp(14px, 4vw, 24px)',
            width: '100%',
            boxSizing: 'border-box',
            maxWidth: `min(${layout.maxWidth}px, 100%)`,
            border: `2px solid ${colors.canvasBorder}`,
            boxShadow: '0 4px 20px rgba(112, 78, 42, 0.14)',
          }}
        >
          <div style={{
            textAlign: 'center',
            marginBottom: spacing.md
          }}>
            <h1 style={{
              ...typography.gameTitle,
              margin: 0,
              color: colors.accent
            }}>
              {gameIcon} {title}
            </h1>
          </div>

          {gameStats && (
            <div style={{
              textAlign: 'center',
              color: colors.textSecondary
            }}>
              {gameStats}
            </div>
          )}

          {gameStatus && (
            <div style={{
              textAlign: 'center',
              color: colors.textPrimary,
              fontSize: 16,
              fontWeight: 600,
              marginTop: spacing.sm
            }}>
              {gameStatus}
            </div>
          )}
        </div>

        {/* 중앙 게임 캔버스 영역 */}
        <div
          style={{
            background: colors.canvasBackground,
            borderRadius: 16,
            padding: 'clamp(8px, 2.6vw, 16px)',
            border: `2px solid ${colors.canvasBorder}`,
            boxShadow: '0 8px 32px rgba(112, 78, 42, 0.18)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            boxSizing: 'border-box',
            maxWidth: `min(${layout.maxWidth}px, 100%)`,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {children}

          {/* ── 게임 오버 / 승리 오버레이 ── */}
          {showOverlay && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                boxSizing: 'border-box',
                background: isVictory
                  ? 'radial-gradient(circle at 50% 42%, rgba(60,40,12,0.30), rgba(35,22,8,0.58))'
                  : 'radial-gradient(circle at 50% 42%, rgba(40,20,10,0.38), rgba(22,11,6,0.64))',
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                pointerEvents: 'none',
                animation: 'gmFade 0.25s ease-out both',
              }}
            >
              <style>{`
                @keyframes gmFade { from { opacity: 0 } to { opacity: 1 } }
                @keyframes gmPop {
                  0% { transform: scale(0.7); opacity: 0 }
                  60% { transform: scale(1.05); opacity: 1 }
                  100% { transform: scale(1); opacity: 1 }
                }
                @keyframes gmTitle {
                  0% { transform: scale(0.5) rotate(-6deg); opacity: 0 }
                  55% { transform: scale(1.12) rotate(2deg) }
                  100% { transform: scale(1) rotate(0deg); opacity: 1 }
                }
                @keyframes gmBounce { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
                @keyframes gmShine { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
                @keyframes gmRise { from { transform: translateY(10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
                @keyframes gmCharPop {
                  0% { transform: scale(0.6) translateY(14px); opacity: 0 }
                  60% { transform: scale(1.08) translateY(-4px); opacity: 1 }
                  100% { transform: scale(1) translateY(0); opacity: 1 }
                }
                @keyframes gmConfetti {
                  0% { transform: scale(0.85); opacity: 0 }
                  100% { transform: scale(1); opacity: 0.85 }
                }
                @keyframes gmFloat { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
              `}</style>

              {/* 배경 장식: 컨페티 (승리 시에만) */}
              <SafeImg
                src="/images/ui/confetti-victory.png"
                alt=""
                aria-hidden="true"
                style={{
                  display: isVictory ? 'block' : 'none',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 'min(135%, 760px)',
                  maxWidth: 'none',
                  transform: 'translate(-50%, -50%)',
                  opacity: 0.85,
                  zIndex: 0,
                  pointerEvents: 'none',
                  animation: 'gmConfetti 0.6s ease-out both',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'clamp(8px, 2vw, 16px)',
                  padding: 'clamp(20px, 5vw, 38px) clamp(26px, 7vw, 60px)',
                  background: 'linear-gradient(180deg, rgba(255,250,236,0.97), rgba(251,239,214,0.97))',
                  border: '3px solid rgba(217,120,69,0.42)',
                  borderRadius: 24,
                  boxShadow: '0 18px 50px rgba(80,50,20,0.45)',
                  animation: 'gmPop 0.45s cubic-bezier(0.18,0.89,0.32,1.28) both',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {/* 카드 모서리 장식 */}
                <SafeImg
                  src="/images/ui/overlay-corner.png"
                  alt=""
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: -2,
                    left: -2,
                    width: 'clamp(36px, 10vw, 60px)',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />
                <SafeImg
                  src="/images/ui/overlay-corner.png"
                  alt=""
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 'clamp(36px, 10vw, 60px)',
                    transform: 'scaleX(-1)',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />

                {/* 캐릭터 일러스트 (신기록 > 승리 > 게임오버) */}
                <SafeImg
                  src={
                    isNewRecord
                      ? '/images/ui/newrecord-baby-noah.png'
                      : isVictory
                      ? '/images/ui/victory-noah.png'
                      : '/images/ui/gameover-lena.png'
                  }
                  alt={isNewRecord ? '신기록 아기 노아' : isVictory ? '승리 노아' : '게임오버 레나'}
                  style={{
                    width: 'clamp(96px, 30vw, 168px)',
                    marginBottom: 'clamp(2px, 1vw, 6px)',
                    filter: 'drop-shadow(0 6px 14px rgba(80,50,20,0.30))',
                    animation: 'gmCharPop 0.55s cubic-bezier(0.18,0.89,0.32,1.28) 0.1s both',
                  }}
                />

                {/* 메인 문구 */}
                <div
                  style={{
                    fontSize: 'clamp(34px, 9vw, 58px)',
                    fontWeight: 900,
                    lineHeight: 1.05,
                    letterSpacing: 0.5,
                    ...(isVictory
                      ? {
                          background: 'linear-gradient(180deg, #f7b94e, #e07b35)',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          color: 'transparent',
                          WebkitTextFillColor: 'transparent',
                          filter: 'drop-shadow(0 4px 10px rgba(224,123,53,0.35))',
                        }
                      : {
                          color: '#7a4a2a',
                          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.22))',
                        }),
                    animation: 'gmTitle 0.5s cubic-bezier(0.2,0.9,0.3,1.3) both',
                  }}
                >
                  {isVictory ? 'Victory!' : 'Game Over'}
                </div>

                {/* 신기록 배지 + 메달 */}
                {isNewRecord && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      animation: 'gmRise 0.4s ease-out 0.2s both',
                    }}
                  >
                    <SafeImg
                      src="/images/ui/new-record-medal.png"
                      alt=""
                      aria-hidden="true"
                      style={{
                        width: 'clamp(26px, 7vw, 40px)',
                        animation: 'gmFloat 1.6s ease-in-out infinite',
                      }}
                    />
                    <span
                      style={{
                        padding: '5px 16px',
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, #ffd76a, #f6a93b)',
                        color: '#5a3a12',
                        fontSize: 'clamp(13px, 3.4vw, 17px)',
                        fontWeight: 800,
                        letterSpacing: 0.3,
                        boxShadow: '0 4px 14px rgba(246,169,59,0.45)',
                        animation: 'gmBounce 1.2s ease-in-out infinite',
                      }}
                    >
                      ✨ 신기록 달성!
                    </span>
                  </div>
                )}

                {/* 점수 */}
                {score !== undefined && score > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 8,
                      animation: 'gmRise 0.4s ease-out 0.15s both',
                    }}
                  >
                    <span style={{ fontSize: 'clamp(13px, 3.4vw, 17px)', fontWeight: 700, color: colors.textSecondary }}>
                      점수
                    </span>
                    <span
                      style={{
                        fontSize: 'clamp(26px, 7vw, 40px)',
                        fontWeight: 900,
                        ...(isNewRecord
                          ? {
                              backgroundImage: 'linear-gradient(90deg, #e8a23a, #f6cf6a, #e8a23a)',
                              backgroundSize: '200% 100%',
                              WebkitBackgroundClip: 'text',
                              backgroundClip: 'text',
                              color: 'transparent',
                              WebkitTextFillColor: 'transparent',
                              animation: 'gmShine 2s linear infinite',
                            }
                          : { color: colors.accent }),
                      }}
                    >
                      {displayScore.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 하단 영역 */}
        <div
          style={{
            background: colors.panelBackground,
            borderRadius: 12,
            padding: 'clamp(14px, 4vw, 24px)',
            width: '100%',
            boxSizing: 'border-box',
            maxWidth: `min(${layout.maxWidth}px, 100%)`,
            border: `2px solid ${colors.canvasBorder}`,
            boxShadow: '0 4px 20px rgba(112, 78, 42, 0.14)',
          }}
        >

          {instructions && (
            <div style={{
              textAlign: 'center',
              color: colors.textSecondary,
              marginBottom: spacing.md,
              fontSize: 14,
              lineHeight: 1.5,
              whiteSpace: 'pre-line'
            }}>
              {instructions}
            </div>
          )}

          {controls && (
            <div style={{
              marginBottom: spacing.md
            }}>
              {controls}
            </div>
          )}

          {actionButtons && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: spacing.md,
              flexWrap: 'wrap'
            }}>
              {actionButtons}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameManager;
