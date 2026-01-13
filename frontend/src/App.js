import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import GeneratorPage from './pages/GeneratorPage';
import HistoryPage from './pages/HistoryPage';
import Header from './components/Header';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <div className="content-wrapper">
          <Header />
          <Routes>
            <Route path="/" element={<GeneratorPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </div>
        <Toaster theme="dark" />
      </div>
    </BrowserRouter>
  );
}

export default App;