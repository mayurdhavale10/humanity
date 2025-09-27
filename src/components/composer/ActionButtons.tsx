// src/components/composer/ActionButtons.tsx
"use client";

interface ActionButtonsProps {
  onSubmit: (e: React.FormEvent) => void;
  onLaunchQuick: () => void;
  saving: boolean;
  uploading: boolean;
}

export default function ActionButtons({ 
  onSubmit, 
  onLaunchQuick, 
  saving, 
  uploading 
}: ActionButtonsProps) {
  const isDisabled = saving || uploading;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* Primary Schedule Button */}
        <button
          type="submit"
          disabled={isDisabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 24px',
            backgroundColor: isDisabled ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
            color: isDisabled ? 'rgba(255,255,255,0.5)' : '#8B6B7A',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isDisabled 
              ? 'none' 
              : '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
            opacity: isDisabled ? 0.6 : 1,
            minWidth: '140px',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.95)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)';
            }
          }}
        >
          {saving ? (
            <>
              <div 
                className="spinner"
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(139, 107, 122, 0.3)',
                  borderTop: '2px solid #8B6B7A',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              Working...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              Schedule Post
            </>
          )}
        </button>

        {/* Secondary Quick Launch Button */}
        <button
          type="button"
          onClick={onLaunchQuick}
          disabled={isDisabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 20px',
            backgroundColor: isDisabled 
              ? 'rgba(255,255,255,0.05)' 
              : 'rgba(255,255,255,0.1)',
            color: isDisabled ? 'rgba(255,255,255,0.4)' : '#FFFFFF',
            border: `2px solid ${isDisabled 
              ? 'rgba(255,255,255,0.1)' 
              : 'rgba(255,255,255,0.2)'}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: isDisabled ? 0.6 : 1,
            minWidth: '160px',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }
          }}
          title="Create a post and publish immediately (demo mode)"
        >
          {saving ? (
            <>
              <div 
                className="spinner"
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid #FFFFFF',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              Working...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5,3 19,12 5,21 5,3"/>
              </svg>
              Launch Quick (Demo)
            </>
          )}
        </button>

        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '32px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            margin: '0 8px',
          }}
        />

        {/* Status indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 500,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isDisabled 
                ? '#ffa726' 
                : '#4caf50',
              boxShadow: `0 0 8px ${isDisabled ? '#ffa726' : '#4caf50'}40`,
            }}
          />
          {isDisabled ? 'Processing...' : 'Ready'}
        </div>
      </div>

      {/* CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}