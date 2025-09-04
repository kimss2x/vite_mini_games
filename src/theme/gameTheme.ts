// 통일된 게임 UI 테마 시스템

export const colors = {
  // 배경색
  appBackground: "#0f0f12",
  canvasBackground: "radial-gradient(1200px 600px at 50% 50%, #15161a 0%, #0f0f12 70%)",
  
  // 텍스트 색상
  primary: "#f3f3f6",
  secondary: "#e8e8ea", 
  muted: "#bcbcbe",
  textPrimary: "#f3f3f6",
  textSecondary: "#bcbcbe",
  
  // 액센트 색상
  accent: "#4169E1",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  
  // 게임 요소
  player: "#7DE5FF",
  opponent: "#FFB86B",
  neutral: "#A0A0A0",
  
  // 패널 및 컨테이너
  panelBackground: "rgba(21, 22, 26, 0.8)",
  canvasBorder: "rgba(255,255,255,0.06)",
  
  // 버튼 색상
  buttonPrimary: "#4169E1",
  buttonSecondary: "rgba(255,255,255,0.1)",
  buttonSecondaryHover: "rgba(255,255,255,0.15)",
  buttonBorder: "rgba(255,255,255,0.2)"
};

export const typography = {
  gameTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.primary,
    textShadow: "0 1px 0 rgba(0,0,0,.6)"
  },
  gameStatus: {
    fontSize: 16,
    fontWeight: 600,
    color: colors.secondary
  },
  instructions: {
    fontSize: 14,
    fontWeight: 400,
    color: colors.muted,
    opacity: 0.9
  },
  score: {
    fontSize: 20,
    fontWeight: 700,
    color: "#ffffff"
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24
};

// 공통 레이아웃 설정
export const layout = {
  maxWidth: 640
};

export const gameContainerStyle: React.CSSProperties = {
  display: "grid",
  gap: spacing.lg,
  placeItems: "center", 
  position: "relative",
  minHeight: "100vh",
  padding: spacing.xl,
  background: colors.appBackground,
  color: colors.secondary,
  fontFamily: '"Segoe UI", system-ui, sans-serif'
};

export const canvasStyle: React.CSSProperties = {
  background: colors.canvasBackground,
  boxShadow: "0 10px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)",
  borderRadius: 14,
  touchAction: "none",
  width: "100%",
  height: "auto",
  display: "block"
};

export const buttonStyles = {
  primary: {
    background: colors.buttonPrimary,
    color: "#ffffff",
    padding: "12px 24px",
    fontSize: 16,
    fontWeight: 600,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    minWidth: 120,
    minHeight: 44,
    transition: "all 0.2s ease"
  } as React.CSSProperties,
  
  secondary: {
    background: colors.buttonSecondary,
    color: colors.secondary,
    border: `1px solid ${colors.buttonBorder}`,
    padding: "12px 24px",
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 8,
    cursor: "pointer",
    minWidth: 120,
    minHeight: 44,
    transition: "all 0.2s ease"
  } as React.CSSProperties,
  
  large: {
    padding: "16px 32px",
    fontSize: 18,
    minWidth: 160,
    minHeight: 52
  } as React.CSSProperties
};

// 호버 효과를 위한 함수들
export const getButtonHoverStyle = (baseStyle: React.CSSProperties) => {
  if (baseStyle.background === colors.buttonPrimary) {
    return { ...baseStyle, background: "#2E5BDB" };
  }
  return { ...baseStyle, background: "rgba(255,255,255,0.15)" };
};