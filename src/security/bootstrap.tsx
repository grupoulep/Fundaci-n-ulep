import React from 'react';
import { createRoot } from 'react-dom/client';
import { enforceHttps } from './security';
import '../styles/index.css';

/**
 * Shared secure entry bootstrap used by all pages.
 * Enforces HTTPS in public deployments and mounts inside React.StrictMode.
 */
export function mountPage(PageComponent: React.ComponentType): void {
  enforceHttps();
  const rootElement = document.getElementById('root');
  if (!rootElement) return;
  createRoot(rootElement).render(
    <React.StrictMode>
      <PageComponent />
    </React.StrictMode>
  );
}
