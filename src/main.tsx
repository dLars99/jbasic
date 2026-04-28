import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import RuntimePage from "./runtime/RuntimePage";

import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {window.location.pathname.endsWith("/runtime") ? <RuntimePage /> : <App />}
  </React.StrictMode>,
);
