import React from 'react';
import { createRoot } from 'react-dom/client';

// App.tsx lives in project root (one level up from /src)
// Fix: Changed import to a named import to resolve the "no default export" error.
import { App } from '../App';

const rootEl = document.getElementById('root')!;
createRoot(rootEl).render(<App />);