import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const CodeViewer = ({ code, isLoading }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4" data-testid="code-loading">
        <Loader className="w-12 h-12 text-primary animate-spin" />
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Generating your component...</p>
          <p className="text-sm text-muted-foreground">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (!code) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      {/* Copy Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleCopy}
          data-testid="copy-code-button"
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 transition-all duration-200 backdrop-blur-sm"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm font-mono">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="text-sm font-mono">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Display */}
      <div className="rounded-lg overflow-hidden border border-border/40" data-testid="code-display">
        <SyntaxHighlighter
          language="jsx"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: '#18181b',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            fontFamily: '"JetBrains Mono", monospace'
          }}
          showLineNumbers
          wrapLines
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </motion.div>
  );
};

export default CodeViewer;