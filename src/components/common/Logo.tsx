import React from 'react';

interface LogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'dark',
  size = 'md',
  className = '',
  onClick,
}) => {
  const isLight = variant === 'light';
  const textColor = isLight ? '#ffffff' : '#052e1d';
  const dotColor = '#10b981';

  const fontSizes = {
    sm: '1.25rem',
    md: '1.65rem',
    lg: '2.2rem',
  };

  const svgSize = {
    sm: 24,
    md: 32,
    lg: 42,
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        textDecoration: 'none',
      }}
      className={className}
    >
      {/* Stylized Architectural Asuka Icon */}
      <svg
        width={svgSize[size]}
        height={svgSize[size]}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Modern stylized 'A' with swoosh and roof geometry */}
        <path
          d="M18 78C18 78 30 90 52 90C72 90 84 76 84 56C84 32 66 14 50 14C34 14 16 30 16 54C16 66 22 75 32 80L48 26L66 76"
          stroke={textColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Accent dot */}
        <circle cx="68" cy="22" r="7" fill={dotColor} />
      </svg>

      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: fontSizes[size],
          letterSpacing: '-0.035em',
          color: textColor,
          display: 'flex',
          alignItems: 'baseline',
          lineHeight: 1,
        }}
      >
        <span>Asuka</span>
        <span>immo</span>
        <span
          style={{
            display: 'inline-block',
            width: size === 'sm' ? '6px' : size === 'lg' ? '10px' : '8px',
            height: size === 'sm' ? '6px' : size === 'lg' ? '10px' : '8px',
            backgroundColor: dotColor,
            borderRadius: '50%',
            marginLeft: '2px',
          }}
        />
      </span>
    </div>
  );
};
