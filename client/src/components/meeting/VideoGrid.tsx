import { VideoOff, MicOff } from 'lucide-react';
import { StreamVideo } from './StreamVideo';
import type { MeetingParticipantView } from './types';
import type { RefObject } from 'react';

interface VideoGridProps {
  participants: MeetingParticipantView[];
  videoRef: RefObject<HTMLVideoElement | null>;
}

function getGridCols(count: number): string {
  if (count === 1) return 'grid-cols-1';
  if (count <= 4) return 'grid-cols-2';
  if (count <= 6) return 'grid-cols-3';
  return 'grid-cols-4';
}

export function VideoGrid({ participants, videoRef }: VideoGridProps) {
  return (
    <div className={`grid gap-4 h-full ${getGridCols(participants.length)}`}>
      {participants.map((p) => (
        <div
          key={p.key}
          className="relative bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 hover:border-blue-500 transition-colors"
        >
          <ParticipantVideo participant={p} videoRef={videoRef} size="large" />

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <span className="text-white font-semibold bg-black/70 px-3 py-1 rounded-lg truncate">
              {p.user?.name || 'Unknown'}
              {p.isMe && ' (나)'}
            </span>
            {!p.isMicOn && (
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <MicOff className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ScreenShareLayoutProps {
  participants: MeetingParticipantView[];
  videoRef: RefObject<HTMLVideoElement | null>;
  screenRef: RefObject<HTMLVideoElement | null>;
}

export function ScreenShareLayout({
  participants,
  videoRef,
  screenRef,
}: ScreenShareLayoutProps) {
  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex-1 bg-black rounded-xl overflow-hidden relative">
        <video ref={screenRef} autoPlay playsInline className="w-full h-full object-contain" />
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/70 text-white rounded-lg text-sm">
          내 화면 공유중
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {participants.map((p) => (
          <div
            key={p.key}
            className="relative w-32 h-24 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 border-2 border-gray-700"
          >
            <ParticipantVideo participant={p} videoRef={videoRef} size="small" />

            <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
              <span className="text-xs text-white bg-black/70 px-1 rounded truncate">
                {p.user?.name || 'Unknown'}
                {p.isMe && ' (나)'}
              </span>
              {!p.isMicOn && (
                <div className="w-4 h-4 bg-red-600 rounded flex items-center justify-center">
                  <MicOff className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParticipantVideo({
  participant,
  videoRef,
  size,
}: {
  participant: MeetingParticipantView;
  videoRef: RefObject<HTMLVideoElement | null>;
  size: 'small' | 'large';
}) {
  const avatarSize = size === 'large' ? 'w-24 h-24 text-4xl' : 'w-8 h-8 text-sm';
  const iconSize = size === 'large' ? 'w-16 h-16' : 'w-6 h-6';

  if (participant.isMe && participant.isVideoOn) {
    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover scale-x-[-1]"
      />
    );
  }

  if (participant.stream) {
    return <StreamVideo stream={participant.stream} className="w-full h-full object-cover" />;
  }

  if (participant.isVideoOn) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
        <div className={`${avatarSize} bg-white/20 rounded-full flex items-center justify-center text-white font-bold`}>
          {(participant.user?.name || 'U')[0].toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-700 flex flex-col items-center justify-center">
      <VideoOff className={`${iconSize} text-gray-500`} />
      {size === 'large' && <p className="text-gray-400 mt-2">카메라 꺼짐</p>}
    </div>
  );
}
