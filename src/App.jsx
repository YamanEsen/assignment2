import React, { useState } from 'react';

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { from: 'agent', text: 'Hi! How can I help you with flights today?' },
  ]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    // Add user message to chat
    setMessages((msgs) => [...msgs, { from: 'user', text: input }]);
    setLoading(true);

    try {
      const res = await fetch('/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();

      // Add agent reply
      setMessages((msgs) => [...msgs, { from: 'agent', text: data.reply }]);
    } catch (err) {
      setMessages((msgs) => [...msgs, { from: 'agent', text: 'Oops, something went wrong.' }]);
    } finally {
      setLoading(false);
      setInput('');
    }
  }

  // Handle Enter key
  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Flight Chatbot</h1>
      <div
        style={{
          border: '1px solid #ccc',
          padding: '1rem',
          height: '400px',
          overflowY: 'auto',
          marginBottom: '1rem',
          background: '#f9f9f9',
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.from === 'user' ? 'right' : 'left',
              margin: '0.5rem 0',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                borderRadius: 20,
                background: msg.from === 'user' ? '#007bff' : '#e5e5ea',
                color: msg.from === 'user' ? 'white' : 'black',
                maxWidth: '70%',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
        {loading && <div>Agent is typing...</div>}
      </div>
      <textarea
        rows={3}
        style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type your message here..."
      />
      <button
        onClick={sendMessage}
        disabled={loading || !input.trim()}
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        Send
      </button>
    </div>
  );
}
