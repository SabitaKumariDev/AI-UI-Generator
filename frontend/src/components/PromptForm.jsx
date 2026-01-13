import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PromptForm = ({ onGenerationComplete, onLoadingChange }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const pollJobStatus = async (jobId) => {
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes timeout
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`${API}/jobs/${jobId}`);
        const { status, generated_code, explanation, error_message } = response.data;

        if (status === 'success') {
          onGenerationComplete(generated_code, explanation);
          toast.success('UI component generated successfully!');
          return true;
        } else if (status === 'failed') {
          setError(error_message || 'Generation failed');
          toast.error(error_message || 'Generation failed');
          return false;
        }

        // Still pending or running, wait and try again
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } catch (err) {
        console.error('Error polling job status:', err);
        attempts++;
      }
    }

    // Timeout
    setError('Generation timed out. Please try again.');
    toast.error('Generation timed out');
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    onLoadingChange(true);
    setError(null);

    try {
      // Submit generation request
      const response = await axios.post(`${API}/generate`, { prompt });
      const { job_id } = response.data;

      toast.info('Generation started...');

      // Poll for job completion
      await pollJobStatus(job_id);
    } catch (err) {
      console.error('Generation error:', err);
      
      if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please wait a moment and try again.');
        toast.error('Rate limit exceeded');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
        toast.error(err.response.data.message);
      } else {
        setError('Failed to generate UI. Please try again.');
        toast.error('Generation failed');
      }
    } finally {
      setIsGenerating(false);
      onLoadingChange(false);
    }
  };

  const examplePrompts = [
    'Create a modern pricing card with 3 tiers',
    'Build a contact form with name, email, and message fields',
    'Design a feature showcase section with icons',
    'Make a hero section for an AI startup'
  ];

  return (
    <div className="glass-panel rounded-xl p-6 md:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Prompt Input */}
        <div>
          <label 
            htmlFor="prompt" 
            className="block text-sm font-medium mb-3 uppercase tracking-widest text-muted-foreground"
          >
            DESCRIBE YOUR UI
          </label>
          <textarea
            id="prompt"
            data-testid="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Create a responsive landing page hero section for an AI healthcare startup with a call-to-action button..."
            rows={4}
            disabled={isGenerating}
            className="w-full bg-background/50 backdrop-blur-xl border border-white/10 focus:border-primary/50 rounded-xl p-4 text-lg shadow-2xl transition-all duration-200 resize-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Example Prompts */}
        <div>
          <p className="text-xs font-medium mb-2 uppercase tracking-widest text-muted-foreground">
            QUICK START
          </p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPrompt(example)}
                disabled={isGenerating}
                className="text-xs px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 hover:border-border transition-all duration-200 font-mono"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
            data-testid="error-message"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-500">Generation Error</p>
              <p className="text-sm text-red-400 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          data-testid="generate-button"
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 py-3 rounded-md font-medium transition-all duration-200 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>GENERATING...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>GENERATE UI</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default PromptForm;