import { X, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import type { MeetingParticipantView } from './types';

interface ParticipantListProps {
  participants: MeetingParticipantView[];
  onClose: () => void;
}

export function ParticipantList({ participants, onClose }: ParticipantListProps) {
  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="h-14 border-b border-gray-700 flex items-center justify-between px-4">
        <h3 className="font-bold text-white">참가자 ({participants.length})</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {participants.map((p) => (
          <div key={p.key} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              {(p.user?.name || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">
                {p.user?.name || 'Unknown'}
                {p.isMe && ' (나)'}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {p.isMicOn ? (
                  <Mic className="w-3 h-3 text-green-500" />
                ) : (
                  <MicOff className="w-3 h-3 text-red-500" />
                )}
                {p.isVideoOn ? (
                  <Video className="w-3 h-3 text-green-500" />
                ) : (
                  <VideoOff className="w-3 h-3 text-red-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
