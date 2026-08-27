import React from "react";

// Dot-grid card with a sweeping spotlight highlight — evoking a diagram being
// sketched on graph paper. Pure CSS, no deps.
export default function LoadingCanvas({ label = "Creating image…" }) {
  return (
    <div className="image-loader">
      <div className="image-loader__spotlight" />
      <div className="image-loader__label">{label}</div>
    </div>
  );
}