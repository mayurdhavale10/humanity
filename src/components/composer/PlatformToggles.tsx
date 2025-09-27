// src/components/composer/PlatformToggles.tsx
"use client";

import { Platform } from "./Composer";

interface PlatformTogglesProps {
  platforms: Platform[];
  onTogglePlatform: (platform: Platform) => void;
}

const platformConfig = {
  INSTAGRAM: {
    name: 'Instagram',
    color: '#E4405F',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    description: 'Post to your Instagram feed'
  }
};

export default function PlatformToggles({ platforms, onTogglePlatform }: PlatformTogglesProps) {
  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <label 
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#FFFFFF',
          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
        }}
      >
        Publish To
      </label>

      <div style={{ display: 'grid', gap: '12px' }}>
        {(Object.keys(platformConfig) as Platform[]).map((platform) => {
          const config = platformConfig[platform];
          const isSelected = platforms.includes(platform);
          
          return (
            <div
              key={platform}
              onClick={() => onTogglePlatform(platform)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 20px',
                backgroundColor: isSelected 
                  ? 'rgba(255,255,255,0.15)' 
                  : 'rgba(255,255,255,0.05)',
                border: `2px solid ${isSelected 
                  ? config.color + '80' 
                  : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }
              }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: config.color,
                  }}
                />
              )}

              {/* Checkbox */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: isSelected ? config.color : 'rgba(255,255,255,0.1)',
                  border: `2px solid ${isSelected ? config.color : 'rgba(255,255,255,0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                )}
              </div>

              {/* Platform icon */}
              <div
                style={{
                  color: isSelected ? config.color : 'rgba(255,255,255,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {config.icon}
              </div>

              {/* Platform info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.8)',
                    marginBottom: '2px',
                  }}
                >
                  {config.name}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: isSelected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.6)',
                    fontWeight: 500,
                  }}
                >
                  {config.description}
                </div>
              </div>

              {/* Status badge */}
              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: isSelected 
                    ? `${config.color}20` 
                    : 'rgba(255,255,255,0.1)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isSelected ? config.color : 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {isSelected ? 'Selected' : 'Available'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection count */}
      <div 
        style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
        {platforms.length} platform{platforms.length !== 1 ? 's' : ''} selected
      </div>
    </div>
  );
}