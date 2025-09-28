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
    const t = setTimeout(() => setIsLoaded(true), 80);
    return () => {
      document.body.style.backgroundColor = prevBG;
      document.body.style.margin = prevMargin;
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="hero-root">
      <div className="hero-box">
        <TopNav isLoaded={isLoaded} />

        {/* top-left label */}
        <div className={`label ${isLoaded ? 'in' : ''}`}>SOCIAL MEDIA AUTOMATION</div>

        {/* grid content */}
        <div className={`grid ${isLoaded ? 'in' : ''}`}>
          {/* LEFT: text */}
          <div className="copy">
            <h1 className="headline">
              Connects your platforms.
              <br />
              Automates your schedule.
            </h1>

            <div className="points">
              <p className="point">
                Link Instagram, X, and LinkedIn. Schedule once, post everywhere.
              </p>
              <p className="point">One tap to cross-post and schedule across all your platforms.</p>
            </div>
          </div>

          {/* RIGHT: safe-fit image card (no overflow) */}
          <div className="visual">
            <div className="visual-inner">
              <img
                src="/landing/background_humanityfounders.webp"
                alt="Portrait"
                className="visual-img"
              />

              {/* inset image kept INSIDE the card */}
              <div className="inset">
                <img src="/landing/inset_image.webp" alt="Preview" className="inset-img" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-root {
          background: #8b6b7a;
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        /* Compact outer card */
        .hero-box {
          width: clamp(340px, 92vw, 1200px);
          min-height: auto;
          background: #b5979a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.15);
          position: relative;
          overflow: hidden; /* ensure nothing looks cropped */
          border-radius: 0;
          padding: 72px 24px 24px; /* space for TopNav + content */
        }

        /* Small top tag */
        .label {
          position: absolute;
          top: 18px;
          left: 20px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.14em;
          color: rgba(255, 255, 255, 0.85);
          opacity: 0;
          transform: translateY(10px);
          transition: all 600ms ease;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          z-index: 2;
        }
        .in {
          opacity: 1;
          transform: translateY(0);
        }

        /* Two-column grid that NEVER overflows */
        .grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 24px;
          align-items: center;
          max-height: 520px; /* compact height target */
        }

        /* LEFT */
        .copy {
          max-width: 560px;
          justify-self: start;
        }
        .headline {
          margin: 0 0 14px;
          font-size: clamp(28px, 4.8vw, 48px); /* smaller for compactness */
          line-height: 1.1;
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.5);
        }
        .points {
          background-color: rgba(0, 0, 0, 0.58);
          padding: 14px 16px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .point {
          margin: 0;
          color: #fff;
          font-weight: 600;
          font-size: clamp(14px, 2.2vw, 18px);
          line-height: 1.4;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }
        .point + .point {
          margin-top: 8px;
        }

        /* RIGHT - photo card fits within the grid cell */
        .visual {
          justify-self: stretch;
          align-self: center;
        }
        .visual-inner {
          position: relative;
          width: 100%;
          height: min(440px, 52vh); /* capped height so it never feels cropped */
          border-radius: 12px;
          overflow: hidden; /* hard stop, nothing bleeds */
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(58, 46, 50, 0.08);
        }
        .visual-img {
          width: 100%;
          height: 100%;
          object-fit: cover; /* fills but safely clipped within rounded card */
          transform: scale(${isLoaded ? 1 : 1.04});
          transition: transform 900ms ease-out;
        }

        /* Inset thumbnail stays INSIDE the card bottom-right */
        .inset {
          position: absolute;
          right: 12px;
          bottom: 12px;
          width: clamp(120px, 32%, 160px);
          aspect-ratio: 4 / 5;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(0.5px);
        }
        .inset-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* ====== TABLET ====== */
        @media (max-width: 1024px) {
          .hero-box {
            padding: 68px 20px 20px;
          }
          .grid {
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            max-height: 520px;
          }
          .visual-inner {
            height: min(400px, 48vh);
          }
        }

        /* ====== MOBILE ====== */
        @media (max-width: 768px) {
          .hero-root {
            padding: 12px;
          }
          .hero-box {
            padding: 60px 14px 16px;
          }
          .grid {
            grid-template-columns: 1fr;
            gap: 16px;
            max-height: none; /* let it flow naturally */
          }
          .copy {
            text-align: center;
            margin: 4px auto 0;
            max-width: 640px;
          }
          .points {
            text-align: left;
          }
          .visual-inner {
            height: 320px; /* compact but visible */
          }
          .inset {
            right: 10px;
            bottom: 10px;
            width: 34%;
          }
        }

        /* ====== VERY SMALL phones ====== */
        @media (max-width: 380px) {
          .visual-inner {
            height: 280px;
          }
          .inset {
            display: none; /* remove extra visual noise on tiny screens */
          }
        }
      `}</style>
    </div>
  );
}
