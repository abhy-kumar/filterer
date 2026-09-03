import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { WatchlistProvider } from './context/WatchlistContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <WatchlistProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </WatchlistProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
