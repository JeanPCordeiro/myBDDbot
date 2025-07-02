import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/sonner';
import { ConfigProvider } from './contexts/ConfigContext';
import { SessionProvider } from './contexts/SessionContext';

// Import des pages
import HomePage from './pages/HomePage';
import ConfigPage from './pages/ConfigPage';
import SessionPage from './pages/SessionPage';
import SessionListPage from './pages/SessionListPage';

// Import des composants
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';

import './App.css';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="bdd-bot-theme">
      <ConfigProvider>
        <SessionProvider>
          <Router>
            <ErrorBoundary>
              <div className="min-h-screen bg-background">
                <Navigation />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/config" element={<ConfigPage />} />
                    <Route path="/sessions" element={<SessionListPage />} />
                    <Route path="/session/:id" element={<SessionPage />} />
                  </Routes>
                </main>
                <Toaster />
              </div>
            </ErrorBoundary>
          </Router>
        </SessionProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default App;

