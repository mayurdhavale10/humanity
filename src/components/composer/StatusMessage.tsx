// src/components/composer/StatusMessage.tsx
"use client";

import { useEffect, useState } from "react";

interface StatusMessageProps {
  message: string | null;
}

export default function StatusMessage({ message }: StatusMessageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (message) {
      setShouldRender(true);
      // Small delay to trigger entrance animation
      const showTimer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(showTimer);
    } else {
      setIsVisible(false);
      // Wait for exit animation before removing from DOM
      const hideTimer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(hideTimer);
    }
  }, [message]);

  if (!shouldRender) return null;

  // Determine message type and styling
  const isSuccess = message?.startsWith('✅');
  const isError = message?.startsWith('❌');
  const isInfo = !isSuccess && !isError;

  const getMessageStyle = () => {
    if (isSuccess) {
      return {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        borderColor: '#4caf50',
        color: '#81c784',
        iconColor: '#4caf50',
      };
    }
    
    if (isError) {
      return {
        backgroundColor: 'rgba(244, 67, 54, 0.15)',
        borderColor: '#f44336',
        color: '#ef5350',
        iconColor: '#f44336',
      };
    }

    return {
      backgroundColor: 'rgba(33, 150, 243, 0.15)',
      borderColor: '#2196f3',
      color: '#64b5f6',
      iconColor: '#2196f3',
    };
  };

  const messageStyle = getMessageStyle();

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          backgroundColor: messageStyle.backgroundColor,
          border: `2px solid ${messageStyle.borderColor}40`,
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          color: messageStyle.color,
          opacity: isVisible ? 1 : 0,
          transform: `translateY(${isVisible ? '0px' : '10px'})`,
          transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: `0 4px 12px ${messageStyle.borderColor}20`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated background accent */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            backgroundColor: messageStyle.iconColor,
            opacity: isVisible ? 1 : 0,
            transform: `scaleY(${isVisible ? 1 : 0})`,
            transformOrigin: 'center',
            transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
            transitionDelay: '0.1s',
          }}
        />

        {/* Status icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            color: messageStyle.iconColor,
            opacity: isVisible ? 1 : 0,
            transform: `scale(${isVisible ? 1 : 0.8})`,
            transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            transitionDelay: '0.15s',
          }}
        >
          {isSuccess && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 12l2 2 4-4"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
          )}
          
          {isError && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          )}
          
          {isInfo && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          )}
        </div>

        {/* Message text */}
        <div
          style={{
            flex: 1,
            opacity: isVisible ? 1 : 0,
            transform: `translateX(${isVisible ? '0px' : '10px'})`,
            transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            transitionDelay: '0.2s',
          }}
        >
          {message}
        </div>

        {/* Subtle pulse animation for success messages */}
        {isSuccess && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: messageStyle.iconColor,
              opacity: 0,
              borderRadius: '8px',
              pointerEvents: 'none',
              animation: isVisible ? 'successPulse 0.6s ease-out' : 'none',
            }}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes successPulse {
          0% {
            opacity: 0;
            transform: scale(1);
          }
          50% {
            opacity: 0.1;
            transform: scale(1.02);
          }
          100% {
            opacity: 0;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}