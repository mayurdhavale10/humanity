'use client';

import { useEffect, useState } from 'react';

export default function HowItWorks() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="hiw-root">
      <div className="hiw-box">
        {/* Section label */}
        <div className={`tag ${ready ? 'in' : ''}`}>HOW IT WORKS</div>

        {/* Title */}
        <h2 className={`title ${ready ? 'in' : ''}`}>
          One pipeline. <span className="accent">Three platforms.</span>
        </h2>

        {/* Stage: Inputs → Funnel → Container */}
        <div className="diagram">
          {/* Inputs (logos) */}
          <div className={`inputs ${ready ? 'in' : ''}`}>
            <div className="logo-card">
              <img src="/landing/instagram (1).webp" alt="Instagram" />
              <span className="logo-caption">Instagram</span>
            </div>
            <div className="logo-card mid">
              <img src="/landing/X_icon.svg.webp" alt="X (Twitter)" />
              <span className="logo-caption">X</span>
            </div>
            <div className="logo-card">
              <img src="/landing/linkedin (1).webp" alt="LinkedIn" />
              <span className="logo-caption">LinkedIn</span>
            </div>
          </div>

          {/* Funnel (SVG, safe inside the box) */}
          <div className={`funnel-wrap ${ready ? 'in' : ''}`} aria-hidden="true">
            <svg
              className="funnel"
              viewBox="0 0 300 320"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Top mouth (wide) */}
              <path
                d="M10 20 L290 20 L210 120 L90 120 Z"
                className="funnel-top"
              />
              {/* Neck */}
              <rect x="138" y="120" width="24" height="110" rx="10" className="funnel-neck" />
              {/* Down arrow pulse */}
              <g className="pulse-arrow">
                <path d="M150 145 L150 205" className="arrow-stem" />
                <path d="M150 210 l-12 -12 M150 210 l12 -12" className="arrow-head" />
              </g>
            </svg>
          </div>

          {/* Container */}
          <div className={`container ${ready ? 'in' : ''}`}>
            <div className="container-glass">
              <div className="container-title">AUTOMISATION</div>
              <div className="container-sub">Plan once → publish everywhere</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Page theme matches HeroSection */
        .hiw-root {
          background: #8b6b7a;           /* Deep Mauve */
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px 40px;
        }
        .hiw-box {
          width: clamp(340px, 92vw, 1200px);
          background: #b5979a;           /* Dusty Rose */
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25),
            0 2px 6px rgba(0, 0, 0, 0.15);
          border-radius: 0;
          position: relative;
          overflow: hidden;
          padding: 28px 18px 28px;
        }

        .tag {
          position: absolute;
          top: 12px;
          left: 16px;
          font-size: 12px;
          letter-spacing: 0.14em;
          color: rgba(255, 255, 255, 0.85);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 600ms ease, transform 600ms ease;
        }
        .tag.in { opacity: 1; transform: translateY(0); }

        .title {
          margin: 32px 10px 18px;
          color: #fff;
          font-weight: 900;
          font-size: clamp(22px, 4.6vw, 36px);
          line-height: 1.15;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 4px rgba(0,0,0,0.6);
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 700ms ease 100ms, transform 700ms ease 100ms;
        }
        .title.in { opacity: 1; transform: translateY(0); }
        .accent { opacity: 0.95; }

        .diagram {
          position: relative;
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          align-items: center;
          justify-items: center;
          padding: 8px 6px 10px;
        }

        /* Inputs row */
        .inputs {
          display: grid;
          grid-template-columns: repeat(3, minmax(92px, 160px));
          gap: 16px;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 700ms ease 140ms, transform 700ms ease 140ms;
        }
        .inputs.in { opacity: 1; transform: translateY(0); }

        .logo-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px 10px 8px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 12px;
          box-shadow: 0 8px 22px rgba(0,0,0,0.22);
          width: 100%;
          max-width: 160px;
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .logo-card:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(0,0,0,0.26); }
        .logo-card img {
          width: clamp(36px, 8vw, 56px);
          height: auto;
          object-fit: contain;
          display: block;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));
        }
        .logo-card .logo-caption {
          margin-top: 6px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
          text-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }
        .logo-card.mid { margin-top: 4px; }

        /* Funnel */
        .funnel-wrap {
          width: clamp(240px, 42vw, 420px);
          height: clamp(180px, 36vw, 320px);
          display: grid;
          place-items: center;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 700ms ease 220ms, transform 700ms ease 220ms;
        }
        .funnel-wrap.in { opacity: 1; transform: translateY(0); }

        .funnel {
          width: 100%;
          height: 100%;
        }
        .funnel-top { fill: rgba(0,0,0,0.38); stroke: rgba(255,255,255,0.16); stroke-width: 2; }
        .funnel-neck { fill: rgba(0,0,0,0.46); }
        .arrow-stem { stroke: rgba(255,255,255,0.9); stroke-width: 3; stroke-linecap: round; }
        .arrow-head { stroke: rgba(255,255,255,0.9); stroke-width: 3; stroke-linecap: round; }

        /* Arrow pulse animation */
        .pulse-arrow { animation: pulse 1600ms ease-in-out infinite; }
        @keyframes pulse {
          0%   { transform: translateY(-6px); opacity: .5; }
          50%  { transform: translateY(6px); opacity: 1; }
          100% { transform: translateY(-6px); opacity: .5; }
        }

        /* Container */
        .container {
          width: 100%;
          display: grid;
          place-items: center;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 700ms ease 300ms, transform 700ms ease 300ms;
        }
        .container.in { opacity: 1; transform: translateY(0); }

        .container-glass {
          min-width: min(92%, 740px);
          padding: 16px 18px 18px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 14px;
          box-shadow: 0 12px 28px rgba(0,0,0,0.28);
          text-align: center;
        }
        .container-title {
          color: #ffffff;
          font-weight: 900;
          letter-spacing: 0.18em;
          font-size: clamp(14px, 2.4vw, 18px);
          text-shadow: 0 2px 6px rgba(0,0,0,0.55);
        }
        .container-sub {
          margin-top: 6px;
          color: rgba(255,255,255,0.9);
          font-weight: 600;
          font-size: clamp(12px, 2.2vw, 16px);
          letter-spacing: 0.02em;
          text-shadow: 0 2px 5px rgba(0,0,0,0.45);
        }

        /* Layout tweaks for bigger screens */
        @media (min-width: 900px) {
          .diagram {
            grid-template-columns: 1fr 1fr;
            grid-template-areas:
              "inputs funnel"
              ".       container";
            gap: 22px 24px;
          }
          .inputs { grid-area: inputs; justify-content: flex-end; }
          .funnel-wrap { grid-area: funnel; justify-self: flex-start; }
          .container { grid-area: container; }
        }

        /* Very small phones */
        @media (max-width: 360px) {
          .logo-card { padding: 8px 8px 6px; border-radius: 10px; }
          .container-glass { min-width: 96%; }
        }
      `}</style>
    </section>
  );
}
