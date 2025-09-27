'use client';

import { useEffect, useState } from 'react';
import TopNav from '../common/TopNav';

export default function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  // Keep deep-navy page background + remove default body margin
  useEffect(() => {
    const prevBG = document.body.style.backgroundColor;
    const prevMargin = document.body.style.margin;
    document.body.style.backgroundColor = '#8B6B7A'; // Deep Mauve
    document.body.style.margin = '0';
    
    // Trigger animations after component mounts
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => {
      document.body.style.backgroundColor = prevBG;
      document.body.style.margin = prevMargin;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8B6B7A', // Deep Mauve
      }}
    >
      {/* Outer box */}
      <div
        style={{
          width: 'clamp(340px, 92vw, 1200px)',
          minHeight: '600px',
          backgroundColor: '#B5979A', // Dusty Rose
          borderRadius: 0,
          boxSizing: 'border-box',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Navigation */}
        <TopNav isLoaded={isLoaded} />

        {/* Typography Section - Animated Text with Selective Background */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '40px', // moved further left from 80px
            zIndex: 30,
            opacity: isLoaded ? 1 : 0,
            transform: `translateY(-50%) translateX(${isLoaded ? '0px' : '-100px'})`,
            transition: 'all 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
            transitionDelay: '0.3s',
            maxWidth: 'calc(100% - 350px)', // adjusted for new positioning
          }}
        >
          {/* Main Headline - No Background */}
          <div
            style={{
              fontSize: 'clamp(32px, 6vw, 64px)',
              fontWeight: 900,
              lineHeight: 1.1,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.5)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              marginBottom: '24px',
              opacity: isLoaded ? 1 : 0,
              transform: `translateX(${isLoaded ? '0px' : '-50px'})`,
              transition: 'all 0.8s ease-out',
              transitionDelay: '0.5s',
            }}
          >
            Connects your platforms. <br />
            Automates your schedule.
          </div>

          {/* Feature Points with Background */}
          <div 
            style={{
              // Clean background without blur effect
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              padding: '20px 24px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(16px, 2.5vw, 20px)',
                fontWeight: 600,
                color: '#FFFFFF',
                lineHeight: 1.4,
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                opacity: isLoaded ? 1 : 0,
                transform: `translateX(${isLoaded ? '0px' : '-30px'})`,
                transition: 'all 0.8s ease-out',
                transitionDelay: '0.7s',
                marginBottom: '12px',
              }}
            >
              Link Instagram, X, and LinkedIn. Schedule once, post everywhere.
            </div>

            <div
              style={{
                fontSize: 'clamp(16px, 2.5vw, 20px)',
                fontWeight: 600,
                color: '#FFFFFF',
                lineHeight: 1.4,
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                opacity: isLoaded ? 1 : 0,
                transform: `translateX(${isLoaded ? '0px' : '-30px'})`,
                transition: 'all 0.8s ease-out',
                transitionDelay: '0.9s',
              }}
            >
              One tap to cross-post and schedule across all your platforms.
            </div>
          </div>
        </div>

        {/* Brand/Studio Text - Diagonal Animation from Bottom-Right to Top-Left */}
        <div
          style={{
            position: 'absolute',
            top: '30px',
            left: '40px',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.8)',
            textShadow: '0 2px 4px rgba(0,0,0,0.6)',
            opacity: isLoaded ? 1 : 0,
            // Diagonal animation: starts from bottom-right, moves to top-left
            transform: `translate(${isLoaded ? '0px' : '200px'}, ${isLoaded ? '0px' : '150px'})`,
            transition: 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            transitionDelay: '1.3s',
            zIndex: 25,
          }}
        >
          SOCIAL MEDIA AUTOMATION
        </div>

        {/* Image pinned to the RIGHT, increased height, 50px right padding */}
        <div
          style={{
            position: 'absolute',
            top: -10,        // extend above container by 10px
            bottom: -10,     // extend below container by 10px
            right: 80,       // increased to 80px right padding
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            opacity: isLoaded ? 1 : 0,
            transform: `translateX(${isLoaded ? '0px' : '100px'})`,
            transition: 'all 1.5s cubic-bezier(0.22, 1, 0.36, 1)',
            transitionDelay: '0.2s',
          }}
        >
          <div style={{ position: 'relative', height: 'calc(100% + 20px)' }}>
            <img
              src="/landing/background_humanityfounders.webp"
              alt="Portrait"
              style={{
                height: '100%',
                width: 'auto',
                display: 'block',
                objectFit: 'cover',
                transform: `scale(${isLoaded ? '1' : '1.1'})`,
                transition: 'transform 2s ease-out',
                transitionDelay: '0.8s',
              }}
            />
            {/* Lighter grey overlay to make background more visible */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(58, 46, 50, 0.05)', // Much lighter overlay
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Inset Image - Overlapping the main image - FIXED POSITIONING AND EDGES */}
        <div
          style={{
            position: 'absolute',
            top: '120px',    // moved down from 80px
            right: '20px',   
            width: '240px',  // increased from 200px
            height: '300px', // increased from 240px
            zIndex: 20,
            overflow: 'visible', // ensure image isn't clipped
          }}
        >
          <img
            src="/landing/inset_image.webp"
            alt="Inset"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '0px', // completely sharp edges
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            }}
          />
        </div>
      </div>
    </div>
  );
}