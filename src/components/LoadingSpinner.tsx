import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  fullScreen = false,
  message
}) => {
  const sizes = {
    small: '24px',
    medium: '48px',
    large: '72px',
  };

  const containerStyle: React.CSSProperties = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
  } : {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  };

  return (
    <div style={containerStyle}>
      {message && (
        <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>
          {message}
        </p>
      )}
      <style>
        {`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        `}
      </style>
      <div
        style={{
          width: sizes[size],
          height: sizes[size],
          border: `3px solid #f3f3f3`,
          borderTop: `3px solid #3498db`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
    </div>
  );
};

export default LoadingSpinner;
