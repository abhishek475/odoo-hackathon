import React from 'react';
import ReactDOM from 'react-dom/client';
import { lazy, Suspense } from 'react';
import './styles.css';

const mode = (import.meta as ImportMeta & { env: { VITE_APP_MODE?: string } }).env.VITE_APP_MODE;
const App = mode === 'demo' ? lazy(() => import('./App')) : lazy(() => import('./live/ConnectedApp'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<p role="status">Loading Brightloop…</p>}><App /></Suspense>
  </React.StrictMode>
);
