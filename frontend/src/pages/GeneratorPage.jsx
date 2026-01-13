import React, { useState } from 'react';
import PromptForm from '../components/PromptForm';
import CodeViewer from '../components/CodeViewer';
import LivePreview from '../components/LivePreview';
import { Sparkles, Code, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const GeneratorPage = () => {
  const [generatedCode, setGeneratedCode] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('code'); // 'code' or 'preview'

  const handleGenerationComplete = (code, exp) => {
    setGeneratedCode(code);
    setExplanation(exp);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#09090b]"></div>
        
        {/* Radial gradient accent */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15), transparent 70%)'
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-mono">AI-POWERED UI GENERATION</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              AI UI GENERATOR
              <br />
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                BUILD FASTER
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
              Transform natural language into production-ready React components.
              <br className="hidden md:block" />
              Built with fault-tolerant architecture and rate limiting.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Prompt Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <PromptForm 
            onGenerationComplete={handleGenerationComplete}
            onLoadingChange={setIsLoading}
          />
        </motion.div>

        {/* Results Section */}
        {(generatedCode || isLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="border border-border/40 rounded-xl overflow-hidden bg-card"
          >
            {/* Tab Navigation */}
            <div className="border-b border-border/40 bg-background/50 backdrop-blur-sm">
              <div className="flex items-center gap-4 px-6 py-3">
                <button
                  data-testid="code-tab-button"
                  onClick={() => setActiveTab('code')}
                  className={
                    `flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                      activeTab === 'code'
                        ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`
                  }
                >
                  <Code className="w-4 h-4" />
                  <span>Code</span>
                </button>
                
                <button
                  data-testid="preview-tab-button"
                  onClick={() => setActiveTab('preview')}
                  className={
                    `flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                      activeTab === 'preview'
                        ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`
                  }
                  disabled={!generatedCode}
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>

                {explanation && (
                  <div className="ml-auto text-sm text-muted-foreground font-mono">
                    {explanation}
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTab === 'code' && (
                <CodeViewer 
                  code={generatedCode} 
                  isLoading={isLoading}
                />
              )}
              
              {activeTab === 'preview' && generatedCode && (
                <LivePreview code={generatedCode} />
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GeneratorPage;