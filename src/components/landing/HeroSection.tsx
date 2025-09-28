'use client';

import { useEffect, useState } from 'react';
import TopNav from '../common/TopNav';

export default function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const prevBG = document.body.style.backgroundColor;
    const prevMargin = document.body.style.margin;
    document.body.style.backgroundColor = '#8B6B7A';
    document.body.style.margin = '0';
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => {
      document.body.style.backgroundColor = prevBG;
      document.body.style.margin = prevMargin;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="hero-root">
      <div className="hero-box">
        <TopNav isLoaded={isLoaded} />

        {/* Tagline block */}
        <div className={`copy ${isLoaded ? 'copy-in' : ''}`}>
          <div className="headline">
            Connects your platforms. <br />
            Automates your schedule.
          </div>

          <div className="points">
            <div className="point">
              Link Instagram, X, and LinkedIn. Schedule once, post everywhere.
            </div>
            <div className="point">
              One tap to cross-post and schedule across all your platforms.
            </div>
          </div>
        </div>

        {/* Small label */}
        <div className={`label ${isLoaded ? 'label-in' : ''}`}>
          SOCIAL MEDIA AUTOMATION
        </div>

        {/* Right visual */}
        <div className={`right-visual ${isLoaded ? 'rv-in' : ''}`}>
          <div className="right-visual-inner">
            <img
              src="/landing/background_humanityfounders.webp"
              alt="Portrait"
              className={`right-visual-img ${isLoaded ? 'img-in' : ''}`}
            />
            <div className="right-visual-overlay" />
          </div>
        </div>

        {/* Inset image */}
        <div className="inset-wrap">
          <img
            src="/landing/inset_image.webp"
            alt="Inset"
            className="inset-img"
          />
        </div>
      </div>

      {/* responsive styles */}
      <style jsx>{`
        .hero-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #8b6b7a;
          padding: 16px; /* breathing room on small screens */
        }
        .hero-box {
          width: clamp(340px, 92vw, 1200px);
          min-height: 600px;
          background: #b5979a;
          border-radius: 0;
          box-sizing: border-box;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25),
            0 2px 6px rgba(0, 0, 0, 0.15);
          position: relative;
          overflow: hidden;
        }

        /* Copy block */
        .copy {
          position: absolute;
          top: 50%;
          left: 40px;
          z-index: 30;
          opacity: 0;
          transform: translateY(-50%) translateX(-100px);
          transition: all 1.2s cubic-bezier(0.22, 1, 0.36, 1);
          transition-delay: 0.3s;
          max-width: calc(100% - 350px);
        }
        .copy-in {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }
        .headline {
          font-size: clamp(28px, 6vw, 64px);
          font-weight: 900;
          line-height: 1.1;
          color: #fff;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8),
            0 4px 12px rgba(0, 0, 0, 0.5);
          font-family: system-ui, -apple-system, sans-serif;
          margin-bottom: 20px;
        }
        .points {
          background-color: rgba(0, 0, 0, 0.6);
          padding: 16px 18px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .point {
          font-size: clamp(15px, 2.5vw, 20px);
          font-weight: 600;
          color: #fff;
          line-height: 1.4;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
          opacity: 1;
        }
        .point + .point {
          margin-top: 10px;
        }

        /* Label */
        .label {
          position: absolute;
          top: 30px;
          left: 40px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.15em;
          color: rgba(255, 255, 255, 0.8);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
          opacity: 0;
          transform: translate(200px, 150px);
          transition: all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          transition-delay: 1.3s;
          z-index: 25;
        }
        .label-in {
          opacity: 1;
          transform: translate(0, 0);
        }

        /* Right visual */
        .right-visual {
          position: absolute;
          top: -10px;
          bottom: -10px;
          right: 80px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          opacity: 0;
          transform: translateX(100px);
          transition: all 1.5s cubic-bezier(0.22, 1, 0.36, 1);
          transition-delay: 0.2s;
        }
        .rv-in {
          opacity: 1;
          transform: translateX(0);
        }
        .right-visual-inner {
          position: relative;
          height: calc(100% + 20px);
        }
        .right-visual-img {
          height: 100%;
          width: auto;
          display: block;
          object-fit: cover;
          transform: scale(1.1);
          transition: transform 2s ease-out;
          transition-delay: 0.8s;
        }
        .img-in {
          transform: scale(1);
        }
        .right-visual-overlay {
          position: absolute;
          inset: 0;
          background-color: rgba(58, 46, 50, 0.05);
          pointer-events: none;
        }

        /* Inset image */
        .inset-wrap {
          position: absolute;
          top: 120px;
          right: 20px;
          width: 240px;
          height: 300px;
          z-index: 20;
          overflow: visible;
        }
        .inset-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 0;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        /* ======= MOBILE (≤ 768px) ======= */
        @media (max-width: 768px) {
          .hero-root {
            padding: 12px;
          }
          .hero-box {
            min-height: auto; /* allow content height */
            padding: 18px 16px 20px 16px; /* inner padding for small screens */
          }
          /* Make layout stacked and centered */
          .copy {
            position: relative;
            top: auto;
            left: auto;
            transform: translateY(0) translateX(0);
            opacity: 1; /* avoid weird animations on small devices */
            transition: none;
            max-width: 100%;
            text-align: center;
            margin-top: 56px; /* room below TopNav */
          }
          .headline {
            font-size: clamp(24px, 7vw, 36px);
            margin-bottom: 14px;
          }
          .points {
            text-align: left; /* keep bullets readable */
            padding: 14px 14px;
          }
          .label {
            left: 16px;
            top: 16px;
            font-size: 11px;
            letter-spacing: 0.12em;
            opacity: 1;
            transform: none;
            transition: none;
          }
          /* Hide heavy right image on phones */
          .right-visual,
          .inset-wrap {
            display: none;
          }
        }

        /* ======= TABLET (769–1024px) ======= */
        @media (min-width: 769px) and (max-width: 1024px) {
          .copy {
            left: 32px;
            max-width: calc(100% - 280px);
          }
          .inset-wrap {
            right: 16px;
            width: 200px;
            height: 260px;
            top: 110px;
          }
          .right-visual {
            right: 56px;
          }
        }
      `}</style>
    </div>
  );
}
