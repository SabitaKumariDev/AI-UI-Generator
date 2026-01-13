import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, History } from 'lucide-react';
import { motion } from 'framer-motion';

const Header = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="border-b border-border/40 backdrop-blur-sm bg-background/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
            data-testid="header-logo"
          >
            <div className="w-10 h-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-200">
              <Terminal className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">AI UI Gen</div>
              <div className="text-xs text-muted-foreground font-mono">POWERED BY GPT-4</div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Link
              to="/"
              data-testid="nav-generator"
              className={
                `flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  isActive('/')
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`
              }
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden sm:inline">Generator</span>
            </Link>

            <Link
              to="/history"
              data-testid="nav-history"
              className={
                `flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  isActive('/history')
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`
              }
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;