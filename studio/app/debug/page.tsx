"use client";

import { useState } from "react";

export default function DebugPage() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 20 }}>Debug Page</h1>

      <noscript>
        <p style={{ color: "red", fontWeight: "bold", fontSize: 20 }}>
          JavaScript is DISABLED in your browser. This is why nothing is clickable.
        </p>
      </noscript>

      <p style={{ marginBottom: 10 }}>
        If the counter below works, JavaScript is running correctly.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={() => setCount((c) => c + 1)}
          style={{
            padding: "12px 24px",
            fontSize: 18,
            cursor: "pointer",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 8,
          }}
        >
          Click me
        </button>
        <span style={{ fontSize: 24, fontWeight: "bold" }}>Count: {count}</span>
      </div>

      <p style={{ marginTop: 20, color: "#666", fontSize: 14 }}>
        If clicking the button does nothing, JavaScript failed to load.
        Open browser DevTools (F12) → Console tab to see errors.
      </p>
    </div>
  );
}
