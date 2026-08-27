import React from "react";
import ReactDOM from "react-dom/client";
// Excalidraw injects its own styles at runtime, so no CSS import is needed.
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
