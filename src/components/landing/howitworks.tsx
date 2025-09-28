'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

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

        {/* The image (square, no crop) */}
        <div className={`image-wrap ${ready ? 'in' : ''}`}>
          <Image
            src="/landing/howitworks.webp"
            alt="Instagram, X and LinkedIn flow into a funnel labeled Automisation"
            fill
            sizes="(max-width: 768px) 92vw, (max-width: 1200px) 900px, 1100px"
            priority
            className="image"
          />
        </div>
      </div>

      <style jsx>{`
        /* Match HeroSection colors */
        .hiw-root {
          background: #8b6b7a; /* Deep Mauve */
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px 40px;
        }
        .hiw-box {
          width: clamp(340px, 92vw, 1200px);
          background: #b5979a; /* Dusty Rose */
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

        /* Square frame, show full image */
        .image-wrap {
          position: relative;
          width: min(92vw, 1100px);
          aspect-ratio: 1 / 1;            /* your image is square */
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 12px 28px rgba(0,0,0,0.28);
          background: rgba(58,46,50,0.08);
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 700ms ease 160ms, transform 700ms ease 160ms;
          margin: 0 auto;
        }
        .image-wrap.in { opacity: 1; transform: translateY(0); }

        :global(.image) {
          object-fit: contain;             /* no cropping */
        }

        @media (max-width: 480px) {
          .hiw-box { padding: 24px 12px 22px; }
          .image-wrap { border-radius: 10px; }
        }
      `}</style>
    </section>
  );
}
