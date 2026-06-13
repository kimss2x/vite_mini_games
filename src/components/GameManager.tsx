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
}

/**
 * 통합 게임 매니저 컴포넌트
 * - 모든 게임에 일관된 UI 레이아웃 제공
 * - 상단: 게임 상태/점수
 * - 중앙: 게임 캔버스 (빨간 박스 영역)
 * - 하단: 조작법/기능 버튼
 * - 왼쪽 상단: 단일 뒤로가기 메뉴
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
  onBackToMenu
}) => {
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
      
      {/* 뒤로가기 메뉴 버튼 - 고정 위치 */}
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

      {/* 메인 게임 영역 - 중앙 정렬 */}
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
        
        {/* 상단 영역 - 게임 상태/점수 */}
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
          {/* 게임 타이틀 */}
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
          
          {/* 게임 상태/점수 */}
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
          }}
        >
          {children}
        </div>

        {/* 하단 영역 - 조작법/기능 버튼 */}
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
          
          {/* 조작법 */}
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
          
          {/* 커스텀 컨트롤 */}
          {controls && (
            <div style={{
              marginBottom: spacing.md
            }}>
              {controls}
            </div>
          )}
          
          {/* 액션 버튼들 */}
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
