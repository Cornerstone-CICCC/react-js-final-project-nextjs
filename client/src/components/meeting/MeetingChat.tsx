import { X } from 'lucide-react';
import type { Message } from '../../types';

interface MeetingChatProps {
  messages: Message[];
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
}

export function MeetingChat({
  messages,
  message,
  onMessageChange,
  onSend,
  onClose,
}: MeetingChatProps) {
  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="h-14 border-b border-gray-700 flex items-center justify-between px-4">
        <h3 className="font-bold text-white">채팅</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            <div className="font-semibold text-blue-400 mb-1">
              {msg.user?.name || 'Unknown'}
            </div>
            <div className="text-gray-300">{msg.content}</div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder="메시지 입력..."
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
          <button
            onClick={onSend}
            disabled={!message.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
