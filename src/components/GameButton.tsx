import React, { useState } from 'react';
import { buttonStyles, getButtonHoverStyle } from '../theme/gameTheme';

interface GameButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'normal' | 'large';
  disabled?: boolean;
  style?: React.CSSProperties;
}

const GameButton: React.FC<GameButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'normal',
  disabled = false,
  style = {}
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const baseStyle = {
    ...buttonStyles[variant],
    ...(size === 'large' ? buttonStyles.large : {}),
    ...style
  };
  
  const currentStyle = isHovered && !disabled 
    ? getButtonHoverStyle(baseStyle) 
    : baseStyle;

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      style={{
        ...currentStyle,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default GameButton;