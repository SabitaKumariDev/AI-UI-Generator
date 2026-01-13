import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Eye, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const LivePreview = ({ code }) => {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!code) {
      setStatus('empty');
      return;
    }

    setStatus('loading');
    setError(null);

    // Clean up code - remove any remaining markdown
    let cleanCode = code
      .replace(/```(jsx?|javascript|tsx?)?\n?/g, '')
      .replace(/```\n?$/g, '')
      .trim();

    // Remove import statements but keep the component definition
    cleanCode = cleanCode
      .replace(/import\s+React\s*,?\s*\{[^}]*\}\s*from\s*['"]react['"];?\n?/g, '')
      .replace(/import\s+React\s+from\s*['"]react['"];?\n?/g, '')
      .replace(/import\s+\{[^}]*\}\s*from\s*['"]react['"];?\n?/g, '')
      .replace(/import\s+PropTypes\s+from\s*['"]prop-types['"];?\n?/g, '')
      .replace(/import\s+.*\s+from\s*['"].*['"];?\n?/g, '');

    // Remove export statements
    cleanCode = cleanCode
      .replace(/export\s+default\s+/g, '')
      .replace(/export\s+/g, '');

    // Find component name
    const constMatch = cleanCode.match(/const\s+(\w+)\s*=/);
    const funcMatch = cleanCode.match(/function\s+(\w+)\s*\(/);
    const componentName = constMatch ? constMatch[1] : (funcMatch ? funcMatch[1] : 'Component');

    // Build the iframe HTML
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      padding: 24px; 
      background: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
    }
    #root {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 200px;
    }
    .preview-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #6b7280;
    }
    .preview-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 20px;
      color: #dc2626;
      max-width: 600px;
      margin: 0 auto;
    }
    .preview-error h4 { margin: 0 0 10px 0; font-size: 16px; }
    .preview-error pre { 
      background: #fee2e2; 
      padding: 12px; 
      border-radius: 4px; 
      overflow-x: auto;
      font-size: 12px;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="preview-loading">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" opacity="0.3"/>
        <path d="M12 2a10 10 0 0 1 10 10">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
        </path>
      </svg>
      <p style="margin-top: 12px;">Rendering component...</p>
    </div>
  </div>
  <script type="text/babel" data-presets="react">
    const { useState, useEffect, useRef, useCallback, useMemo, useContext, createContext, Fragment } = React;

    try {
      // Component definition
      ${cleanCode}

      // Get component reference
      const RenderComponent = typeof ${componentName} !== 'undefined' ? ${componentName} : null;

      if (!RenderComponent) {
        throw new Error('Component "${componentName}" is not defined');
      }

      // Render to DOM
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(
        <React.StrictMode>
          <RenderComponent />
        </React.StrictMode>
      );

      // Signal success to parent
      window.parent.postMessage({ type: 'preview-success' }, '*');

    } catch (err) {
      console.error('Preview Error:', err);
      document.getElementById('root').innerHTML = \`
        <div class="preview-error">
          <h4>⚠️ Preview Error</h4>
          <p>\${err.message}</p>
          <pre>\${err.stack || ''}</pre>
        </div>
      \`;
      window.parent.postMessage({ type: 'preview-error', error: err.message }, '*');
    }
  </script>
</body>
</html>`;

    // Set up message listener
    const handleMessage = (event) => {
      if (event.data?.type === 'preview-success') {
        setStatus('success');
      } else if (event.data?.type === 'preview-error') {
        setStatus('error');
        setError(event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);

    // Set iframe content
    if (iframeRef.current) {
      const blob = new Blob([html], { type: 'text/html' });
      iframeRef.current.src = URL.createObjectURL(blob);
    }

    // Timeout fallback
    const timeout = setTimeout(() => {
      if (status === 'loading') {
        setStatus('success'); // Assume success if no message received
      }
    }, 3000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, [code]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
      data-testid="live-preview-container"
    >
      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-500">Preview Mode</p>
          <p className="text-xs text-amber-400/80 mt-1">
            This is a sandboxed preview. Some advanced features may not render correctly.
          </p>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 text-sm">
        {status === 'loading' && (
          <>
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">Rendering...</span>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-green-500">Component rendered</span>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-500">Render error: {error}</span>
          </>
        )}
      </div>

      {/* Preview Frame */}
      <div className="border border-border/40 rounded-lg overflow-hidden bg-white" data-testid="preview-frame">
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white/80 px-3 py-1 rounded text-xs text-slate-500 font-mono">
              Preview
            </div>
          </div>
        </div>
        
        <iframe
          ref={iframeRef}
          title="Component Preview"
          sandbox="allow-scripts allow-same-origin"
          className="w-full bg-slate-50"
          style={{ 
            border: 'none', 
            height: '500px',
            minHeight: '300px'
          }}
          data-testid="preview-iframe"
        />
      </div>
    </motion.div>
  );
};

export default LivePreview;
