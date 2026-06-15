import React from 'react';

/**
 * AdPlaceholder — safe placeholder for future AdSense slots.
 *
 * Usage rules:
 * - Never place inside a game canvas
 * - Never place near game control buttons
 * - Only place in clearly separated content areas
 * - Mobile: only below game-end screens, never during gameplay
 *
 * When AdSense is approved:
 * 1. Replace this component's inner content with the real <ins> AdSense tag
 * 2. Keep the outer wrapper dimensions to prevent layout shift
 * 3. Remove the "Advertisement" label (AdSense provides its own)
 */

export type AdSize = 'banner' | 'rectangle' | 'responsive';

interface AdPlaceholderProps {
  size?: AdSize;
  /** Future AdSense data-ad-slot value — store here for easy search/replace */
  adSlot?: string;
  style?: React.CSSProperties;
}

const SIZE_CONFIG: Record<AdSize, { minHeight: number; label: string }> = {
  banner:     { minHeight: 90,  label: 'Advertisement' },
  rectangle:  { minHeight: 250, label: 'Advertisement' },
  responsive: { minHeight: 90,  label: 'Advertisement' },
};

export default function AdPlaceholder({ size = 'responsive', style }: AdPlaceholderProps) {
  const { minHeight, label } = SIZE_CONFIG[size];

  return (
    <div
      aria-label="Advertisement area"
      style={{
        minHeight,
        width: '100%',
        background: 'rgba(240, 228, 208, 0.45)',
        border: '1px dashed rgba(139, 93, 51, 0.25)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#b09070',
        fontSize: 11,
        fontFamily: 'inherit',
        letterSpacing: '0.04em',
        userSelect: 'none',
        ...style,
      }}
    >
      {label}
    </div>
  );
}
