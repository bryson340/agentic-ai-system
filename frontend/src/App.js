import React, { useState, useEffect } from 'react';

function App() {
  const [task, setTask] = useState('');
  const [logs, setLogs] = useState([]); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalResult, setFinalResult] = useState(null);

  // Auto-scroll logic for logs
  useEffect(() => {
    const logWindow = document.getElementById('log-window');
    if (logWindow) logWindow.scrollTop = logWindow.scrollHeight;
  }, [logs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task) return;

    setIsProcessing(true);
    setLogs(['> 🚀 System Initialized...', '> 📡 Establishing link to Orchestrator...']);
    setFinalResult(null);

    try {
      const response = await fetch('http://localhost:8000/submit-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_description: task }),
      });

      const data = await response.json();
      const taskId = data.task_id;
      
      setLogs((prev) => [...prev, `> ✅ Task Queued! ID: ${taskId}`, '> ⏳ Waiting for Batch Processing...']);
      connectToStream(taskId);

    } catch (error) {
      console.error("Error:", error);
      setLogs((prev) => [...prev, `> ❌ Error: ${error.message}`]);
      setIsProcessing(false);
    }
  };

  const connectToStream = (taskId) => {
    const eventSource = new EventSource(`http://localhost:8000/stream/${taskId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === 'log') {
        setLogs((prev) => [...prev, `> ${data.message}`]);
      } 
      else if (data.status === 'result') {
        setFinalResult(data.result);
        setIsProcessing(false);
        setLogs((prev) => [...prev, `> 🏁 Process Complete.`]);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  };

  // === IMPROVED LINK RENDERER ===
  const renderContentWithLinks = (text) => {
    if (!text) return null;
    
    // Split text by URLs (detects http/https)
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    
    return parts.map((part, index) => {
      // Check if this specific part is a URL
      if (part.match(/^https?:\/\//)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.link} // Applies the bright neon style
          >
            {part}
          </a>
        );
      }
      // Return regular text
      return part;
    });
  };

  return (
    <div style={styles.pageBackground}>
      <style>
        {`
          @keyframes blink { 50% { opacity: 0; } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: #0d0d0d; }
          ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #555; }
        `}
      </style>

      <div style={styles.mainContainer}>
        
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.logoIcon}>🤖</div>
          <h1 style={styles.title}>Agentic AI <span style={styles.highlight}>Nexus</span></h1>
          <p style={styles.subtitle}>Autonomous Multi-Agent Orchestration System</p>
        </div>

        {/* Input Card */}
        <div style={styles.card}>
          <div style={styles.inputGroup}>
            <textarea
              style={styles.textarea}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Enter your mission directive here... (e.g., 'Analyze the feasibility of AI in agriculture')"
              rows="2"
            />
            <button 
              onClick={handleSubmit} 
              disabled={isProcessing}
              style={isProcessing ? styles.buttonDisabled : styles.button}
            >
              {isProcessing ? (
                <span>⚡ Processing...</span>
              ) : (
                <span>🚀 Deploy Agents</span>
              )}
            </button>
          </div>
        </div>

        {/* Split View: Logs & Results */}
        <div style={styles.splitView}>
          
          {/* Left: Terminal Logs */}
          <div style={styles.logCard}>
            <div style={styles.cardHeader}>
              <span style={styles.statusDot}></span>
              <h3>Live Neural Link</h3>
            </div>
            <div id="log-window" style={styles.terminalWindow}>
              {logs.map((log, index) => (
                <div key={index} style={styles.logLine}>{log}</div>
              ))}
              {isProcessing && <span style={styles.cursor}>_</span>}
            </div>
          </div>

          {/* Right: Final Output */}
          {finalResult && (
            <div style={styles.resultCard}>
              <div style={styles.cardHeaderResult}>
                <span style={{fontSize: '20px'}}>📄</span>
                <h3 style={{color: '#333', margin: 0}}>Mission Report</h3>
              </div>
              <div style={styles.resultContent}>
                {/* CALL THE LINK RENDERER HERE */}
                {renderContentWithLinks(finalResult)}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// === MODERN CYBERPUNK STYLES ===
const styles = {
  pageBackground: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    fontFamily: "'Inter', sans-serif",
    color: '#ffffff',
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  mainContainer: {
    width: '100%',
    maxWidth: '1000px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  logoIcon: {
    fontSize: '50px',
    marginBottom: '10px',
    filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.5))',
  },
  title: {
    fontSize: '3rem',
    fontWeight: '800',
    margin: '0',
    letterSpacing: '-1px',
    background: '-webkit-linear-gradient(45deg, #00d2ff, #3a7bd5)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  highlight: {
    color: '#ffffff',
  },
  subtitle: {
    color: '#a0a0a0',
    fontSize: '1.1rem',
    marginTop: '8px',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  },
  inputGroup: {
    display: 'flex',
    gap: '15px',
    flexDirection: 'column',
  },
  textarea: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(0, 0, 0, 0.2)',
    color: '#fff',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  button: {
    padding: '15px 30px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    background: 'linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 0 15px rgba(0, 210, 255, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  buttonDisabled: {
    padding: '15px 30px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitView: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  logCard: {
    background: '#0d0d0d',
    borderRadius: '16px',
    border: '1px solid #333',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  cardHeader: {
    padding: '15px 20px',
    background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cardHeaderResult: {
    padding: '15px 20px',
    background: '#f0f0f0',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    background: '#00ff00',
    borderRadius: '50%',
    boxShadow: '0 0 10px #00ff00',
  },
  terminalWindow: {
    padding: '20px',
    height: '300px',
    overflowY: 'auto',
    fontFamily: "'Courier New', monospace",
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#00ff00',
  },
  logLine: {
    marginBottom: '8px',
    wordBreak: 'break-word',
  },
  cursor: {
    display: 'inline-block',
    width: '10px',
    height: '18px',
    background: '#00ff00',
    marginLeft: '5px',
    animation: 'blink 1s step-end infinite',
  },
  resultCard: {
    background: '#ffffff',
    borderRadius: '16px',
    color: '#1a1a1a',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    animation: 'fadeIn 0.5s ease-out',
  },
  resultContent: {
    padding: '25px',
    fontSize: '16px',
    lineHeight: '1.7',
    whiteSpace: 'pre-wrap', 
  },
  // NEW STYLE FOR LINKS
  link: {
    color: '#00d2ff', // Bright Cyan (Clickable Color)
    fontWeight: 'bold',
    textDecoration: 'underline',
    cursor: 'pointer',
  }
};

export default App;