// src/components/composer/PlatformToggles.tsx
"use client";

import type { ReactNode } from "react";
import { Platform } from "./Composer";

interface PlatformTogglesProps {
  platforms: Platform[];
  onTogglePlatform: (platform: Platform) => void;
}

type Config = {
  name: string;
  color: string;
  icon: ReactNode;       // ← was JSX.Element
  description: string;
};

const platformConfig: Record<Platform, Config> = {
  INSTAGRAM: {
    name: "Instagram",
    color: "#E4405F",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.67 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.15-3.23 1.66-4.77 4.92-4.92C8.42 2.17 8.8 2.16 12 2.16zM12 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm6.41-1.68a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88zM12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
      </svg>
    ),
    description: "Post to your Instagram feed",
  },
  LINKEDIN: {
    name: "LinkedIn",
    color: "#0A66C2",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM14.5 9c-2.21 0-3.5 1.204-3.5 2.61V21h-4V9h4v1.57S11.61 9 14.2 9c2.93 0 4.8 1.86 4.8 5.36V21h-4v-5.2c0-1.27-.45-2.14-1.84-2.14-1 0-1.59.67-1.85 1.31-.1.23-.12.55-.12.87V21h-4v-8h4v1.21C12.06 12.07 13.04 11 14.5 11z" />
      </svg>
    ),
    description: "Share to your professional network",
  },
  X: {
    name: "X (Twitter)",
    color: "#111111",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18 2H6A4 4 0 0 0 2 6v12a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4V6a4 4 0 0 0-4-4zm-2.38 6.23l2.72-2.72h-2.02l-1.7 1.7-2.27-1.7H9.7l2.98 2.2-3.52 3.52-2.86 2.86h2.02l1.84-1.84 2.47 1.84h1.46l-3.36-2.5 3.89-3.86 3.77 2.86V8.93z" />
      </svg>
    ),
    description: "Post to X timeline",
  },
};

export default function PlatformToggles({
  platforms,
  onTogglePlatform,
}: PlatformTogglesProps) {
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <label
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#FFFFFF",
          textShadow: "0 1px 2px rgba(0,0,0,0.6)",
        }}
      >
        Publish To
      </label>

      <div style={{ display: "grid", gap: "12px" }}>
        {(Object.keys(platformConfig) as Platform[]).map((platform) => {
          const config = platformConfig[platform];
          const isSelected = platforms.includes(platform);

          return (
            <div
              key={platform}
              onClick={() => onTogglePlatform(platform)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "16px 20px",
                backgroundColor: isSelected
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.05)",
                border: `2px solid ${
                  isSelected ? config.color + "80" : "rgba(255,255,255,0.1)"
                }`,
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }
              }}
            >
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "4px",
                    backgroundColor: config.color,
                  }}
                />
              )}

              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "6px",
                  backgroundColor: isSelected
                    ? config.color
                    : "rgba(255,255,255,0.1)",
                  border: `2px solid ${
                    isSelected ? config.color : "rgba(255,255,255,0.3)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                {isSelected && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    aria-hidden
                  >
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                )}
              </div>

              <div
                style={{
                  color: isSelected ? config.color : "rgba(255,255,255,0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {config.icon}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.8)",
                    marginBottom: "2px",
                  }}
                >
                  {config.name}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: isSelected
                      ? "rgba(255,255,255,0.8)"
                      : "rgba(255,255,255,0.6)",
                    fontWeight: 500,
                  }}
                >
                  {config.description}
                </div>
              </div>

              <div
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  backgroundColor: isSelected
                    ? `${config.color}20`
                    : "rgba(255,255,255,0.1)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: isSelected
                    ? config.color
                    : "rgba(255,255,255,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {isSelected ? "Selected" : "Available"}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontSize: "14px",
          color: "rgba(255,255,255,0.7)",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        {platforms.length} platform{platforms.length !== 1 ? "s" : ""} selected
      </div>
    </div>
  );
}
