import { Send, Bot } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const TypingAnimation = () => (
  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#06b6d4'
        }}
      />
    ))}
  </div>
);

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Hey there! 👋 I\'m Nexus Oracle. Need help picking merch or curious about our NFT collection?',
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

      // Simulate AI response delay
    setTimeout(() => {
      const aiResponses: { [key: string]: string } = {
        'hoodie': 'The Nexus Hoodie is one of our bestsellers! Perfect for any cyberpunk aesthetic. Limited edition with only 500 pieces. Want me to show you it?',
        'discount': 'Connect your wallet to get exclusive VIP discounts on merchandise!',
        'merch': 'We have a great selection: hoodies, caps, watches, and more. Each piece is limited edition.',
        'nft': 'Our NFTs unlock exclusive perks: discounts, early access to drops, and community voting rights.',
        'help': 'I can help you with:\n• Finding merch\n• Explaining our NFT benefits\n• Answering Web3 questions\n• Checking product details'
      };

      let response = 'That\'s a great question! 🤔 I\'m here to help with any questions about our products or Web3 benefits. What would you like to know?';

      const lowerInput = input.toLowerCase();
      for (const [key, value] of Object.entries(aiResponses)) {
        if (lowerInput.includes(key)) {
          response = value;
          break;
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0a0a0a'
    }}>
      {/* Chat Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'rgba(34, 211, 238, 0.2)',
          border: '1px solid rgba(34, 211, 238, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#06b6d4'
        }}>
          <Bot size={20} />
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#06b6d4',
            margin: 0
          }}>
            Nexus Oracle
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }} />
            <span style={{
              fontSize: '12px',
              color: '#6b7280'
            }}>
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingBottom: '100px'
      }}>
        {messages.map(message => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {message.role === 'ai' ? (
              <div style={{
                backgroundColor: 'rgba(23, 23, 23, 0.8)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                color: '#d1d5db',
                borderRadius: '16px',
                borderBottomLeftRadius: '4px',
                padding: '12px 14px',
                fontSize: '13px',
                lineHeight: '1.5',
                maxWidth: '85%',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {message.content}
              </div>
            ) : (
              <div style={{
                backgroundColor: '#a855f7',
                color: '#ffffff',
                borderRadius: '16px',
                borderBottomRightRadius: '4px',
                padding: '12px 14px',
                fontSize: '13px',
                lineHeight: '1.5',
                maxWidth: '85%',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                boxShadow: '0 0 15px -5px #a855f7'
              }}>
                {message.content}
              </div>
            )}
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              justifyContent: 'flex-start'
            }}
          >
            <div style={{
              backgroundColor: 'rgba(23, 23, 23, 0.8)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              borderRadius: '16px',
              borderBottomLeftRadius: '4px',
              padding: '12px 14px'
            }}>
              <TypingAnimation />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        left: '0',
        right: '0',
        padding: '12px 16px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        zIndex: 40
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about merch or Web3..."
            style={{
              flex: 1,
              backgroundColor: 'rgba(23, 23, 23, 1)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '10px 16px',
              fontSize: '13px',
              color: '#ffffff',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              padding: '10px',
              backgroundColor: input.trim() ? '#06b6d4' : 'rgba(107, 114, 128, 0.3)',
              border: 'none',
              borderRadius: '50%',
              color: input.trim() ? '#0a0a0a' : '#6b7280',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: input.trim() ? '0 0 15px -5px #06b6d4' : 'none'
            }}
            onMouseEnter={(e) => {
              if (input.trim()) {
                e.currentTarget.style.backgroundColor = '#08d8f8';
              }
            }}
            onMouseLeave={(e) => {
              if (input.trim()) {
                e.currentTarget.style.backgroundColor = '#06b6d4';
              }
            }}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
