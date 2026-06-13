// 통일된 게임 UI 테마 시스템

export const colors = {
  // 배경색
  appBackground:
    "radial-gradient(circle at 14% 18%, rgba(255, 226, 145, 0.58), transparent 24%), radial-gradient(circle at 86% 12%, rgba(176, 220, 167, 0.45), transparent 22%), linear-gradient(180deg, #fff4d8 0%, #f7dfb5 58%, #f0d49a 100%)",
  canvasBackground: "rgba(255, 250, 235, 0.66)",
  
  // 텍스트 색상
  primary: "#6b4328",
  secondary: "#7b5b3d", 
  muted: "#8a6a4b",
  textPrimary: "#6b4328",
  textSecondary: "#7b5b3d",
  
  // 액센트 색상
  accent: "#d97845",
  success: "#8ab275",
  warning: "#F59E0B",
  error: "#EF4444",
  
  // 게임 요소
  player: "#c47f4d",
  opponent: "#8ab275",
  neutral: "#a98a66",
  
  // 패널 및 컨테이너
  panelBackground: "rgba(255, 250, 235, 0.78)",
  canvasBorder: "rgba(139, 93, 51, 0.18)",
  
  // 버튼 색상
  buttonPrimary: "#d97845",
  buttonSecondary: "rgba(255, 250, 235, 0.9)",
  buttonSecondaryHover: "rgba(255, 244, 216, 1)",
  buttonBorder: "rgba(139, 93, 51, 0.22)"
};

export const typography = {
  gameTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.primary,
    textShadow: "none"
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
    color: colors.primary
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
  maxWidth: 960
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
  boxShadow: "0 10px 28px rgba(112, 78, 42, 0.18), inset 0 0 0 1px rgba(139, 93, 51, 0.12)",
  borderRadius: 14,
  touchAction: "none",
  width: "100%",
  height: "auto",
  display: "block"
};

export const buttonStyles = {
  primary: {
    background: colors.buttonPrimary,
    color: "#fffaf0",
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
    color: colors.primary,
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
    return { ...baseStyle, background: "#c76835" };
  }
  return { ...baseStyle, background: "rgba(255, 244, 216, 1)" };
};
