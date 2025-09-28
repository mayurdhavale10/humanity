// src/components/account/ConnectAccounts.tsx
"use client";
export default function ConnectAccounts() {
  const btn = {
    base: {
      display: "inline-block",
      padding: "8px 12px",
      borderRadius: 8,
      color: "#fff",
      textDecoration: "none",
      border: "1px solid rgba(255,255,255,.2)",
      marginRight: 8,
    } as React.CSSProperties,
  };
  return (
    <aside style={{ marginTop: 16, background: "rgba(0,0,0,.2)", padding: 16, borderRadius: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: "#fff" }}>Connect your accounts</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href="/api/oauth/providers/instagram/start" style={{ ...btn.base, background: "#E4405F" }}>Connect Instagram</a>
        <a href="/api/oauth/providers/linkedin/start"  style={{ ...btn.base, background: "#0A66C2" }}>Connect LinkedIn</a>
        <a href="/api/oauth/providers/x/start"         style={{ ...btn.base, background: "#111"   }}>Connect X</a>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,.8)" }}>
        After you authorize, we’ll save tokens in <code>SocialProvider</code> for your email.
      </div>
    </aside>
  );
}
