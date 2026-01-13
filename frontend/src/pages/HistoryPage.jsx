import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Clock, Code, CheckCircle, XCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/history`);
      setHistory(response.data.history);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      case 'running':
        return <Loader className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <h1 className="text-4xl font-bold mb-2 tracking-tight">Generation History</h1>
          <p className="text-muted-foreground">View your past UI generations</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16">
            <Code className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No generations yet</h3>
            <p className="text-muted-foreground">Start creating UI components to see them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                data-testid={`history-item-${item.id}`}
                onClick={() => setSelectedItem(item)}
                className="group border border-border/40 rounded-xl p-6 hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer bg-card"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="text-sm font-medium capitalize text-mono">
                      {item.status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDate(item.created_at)}
                  </span>
                </div>

                {/* Prompt */}
                <p className="text-sm text-foreground line-clamp-3 mb-4">
                  {item.prompt}
                </p>

                {/* Code Preview */}
                {item.generated_code && (
                  <div className="bg-background/50 rounded-md p-3 border border-border/40">
                    <code className="text-xs text-muted-foreground font-mono line-clamp-2">
                      {item.generated_code.substring(0, 100)}...
                    </code>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for selected item */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border/40">
              <h2 className="text-2xl font-bold mb-2">Generated Component</h2>
              <p className="text-sm text-muted-foreground">{selectedItem.prompt}</p>
            </div>
            
            <div className="p-6">
              {selectedItem.generated_code ? (
                <pre className="bg-background/50 rounded-md p-4 overflow-x-auto border border-border/40">
                  <code className="text-sm font-mono">{selectedItem.generated_code}</code>
                </pre>
              ) : (
                <p className="text-muted-foreground">No code generated</p>
              )}
            </div>

            <div className="p-6 border-t border-border/40 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;