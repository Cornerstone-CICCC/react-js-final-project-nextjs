import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router';
import { Send } from 'lucide-react';
import { api } from '../../lib/api';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { getUserColor, formatTime } from '../../lib/utils';
import { toast } from 'sonner';
import { LoadingSpinner } from '../common';
import type { Message } from '../../types';

export function ChatPage() {
  const { studyId } = useParams<{ studyId: string }>();
  const { socket, connected } = useSocket();
  const { user } = useAuth();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!studyId) return;
    (async () => {
      try {
        const response = await api.getMessages(studyId);
        setMessages(response.messages);
      } catch {
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    })();
  }, [studyId]);

  useEffect(() => {
    if (!socket || !studyId) return;

    socket.emit('join-study', studyId);

    const handleNewMessage = (newMessage: Message) => {
      setMessages((prev) => [...prev, newMessage]);
      setTimeout(scrollToBottom, 100);
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.emit('leave-study', studyId);
    };
  }, [socket, studyId, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend() {
    if (!message.trim() || !studyId) return;
    try {
      const response = await api.sendMessage(studyId, message.trim());
      setMessages((prev) => [...prev, response.message]);

      if (socket && connected) {
        socket.emit('send-message', { studyId, message: response.message });
      }

      setMessage('');
      scrollToBottom();
    } catch {
      toast.error('Failed to send message');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-10rem)] bg-[#1a1a1a]">
      {!connected && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
          <p className="text-xs text-amber-400 text-center">Reconnecting to live chat...</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-white/20 font-light text-sm tracking-widest mb-4">NO MESSAGES YET</div>
              <p className="text-white/40 font-light">Start the conversation</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isCurrentUser={msg.user.id === user?.id}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      <ChatInput
        value={message}
        connected={connected}
        onChange={setMessage}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

// --- Sub-components ---

function ChatBubble({ message, isCurrentUser }: { message: Message; isCurrentUser: boolean }) {
  const colorClass = getUserColor(undefined, message.user.id);

  return (
    <div className="flex gap-4 items-start">
      <div className={`w-12 h-12 ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}>
        <span className="text-black font-medium">
          {(message.user.name || 'U')[0].toUpperCase()}
        </span>
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-white font-medium">{message.user.name || 'Unknown'}</span>
          {isCurrentUser && (
            <span className="text-xs text-white/40 font-light tracking-wide">YOU</span>
          )}
          <span className="text-xs text-white/30 font-light">{formatTime(message.createdAt)}</span>
        </div>
        <div className="text-white/80 font-light leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  );
}

function ChatInput({ value, connected, onChange, onSend, onKeyDown }: {
  value: string;
  connected: boolean;
  onChange: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            className="flex-1 h-14 px-6 py-4 bg-white/5 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-white/30 font-light resize-none"
            rows={1}
          />
          <button
            onClick={onSend}
            disabled={!value.trim()}
            className="w-14 h-14 bg-white text-black rounded-full hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {connected && (
          <p className="text-xs text-green-400/60 mt-2 text-center">● Live chat connected</p>
        )}
      </div>
    </div>
  );
}
