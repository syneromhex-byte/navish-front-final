// --- BULLETPROOF AWS PRESIGNED URL CLEANER (FETCH & XHR) ---
function sanitizeAwsUrl(url: string): string {
  if (url && url.includes('X-Amz-Algorithm')) {
    return url
      .replace(/&x-amz-checksum-mode=[^&]*/g, '')
      .replace(/&x-id=[^&]*/g, '')
      .replace(/\?x-amz-checksum-mode=[^&]*&?/g, '?')
      .replace(/\?x-id=[^&]*&?/g, '?')
      .replace(/\?$/, '');
  }
  return url;
}

// 1. Intercept window.fetch
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  let url = typeof input === 'string' ? input : input instanceof Request ? input.url : '';
  if (url) {
    const cleanedUrl = sanitizeAwsUrl(url);
    if (typeof input === 'string') {
      input = cleanedUrl;
    } else if (input instanceof Request) {
      input = new Request(cleanedUrl, init);
    }
  }
  return originalFetch(input, init);
};

// 2. Intercept XMLHttpRequest (Crucial for Babylon.js)
const originalXhrOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (
  method: string,
  url: string | URL,
  async: boolean = true,
  username?: string | null,
  password?: string | null,
) {
  const urlStr = typeof url === 'string' ? url : url.toString();
  if (urlStr) {
    url = sanitizeAwsUrl(urlStr);
  }
  return (originalXhrOpen as any).call(this, method, url, async, username, password);
};

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@app/App';
import '@styles/tailwind.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element "#root" was not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
