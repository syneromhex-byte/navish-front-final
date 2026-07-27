// --- BULLETPROOF AWS PRESIGNED URL CLEANER ---
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  let url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

  if (url && url.includes('X-Amz-Algorithm')) {
    url = url
      .replace(/&x-amz-checksum-mode=[^&]*/g, '')
      .replace(/&x-id=[^&]*/g, '')
      .replace(/\?x-amz-checksum-mode=[^&]*&?/g, '?')
      .replace(/\?x-id=[^&]*&?/g, '?')
      .replace(/\?$/, ''); // Clean trailing question mark if empty

    if (typeof input === 'string') {
      input = url;
    } else if (input instanceof Request) {
      input = new Request(url, init);
    }
  }

  return originalFetch(input, init);
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
