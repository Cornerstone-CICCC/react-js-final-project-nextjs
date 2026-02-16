import { VideoOff, MicOff } from "lucide-react";
import { StreamVideo } from "./StreamVideo";
import type { MeetingParticipantView } from "./types";
import type { RefObject } from "react";

interface VideoGridProps {
  participants: MeetingParticipantView[];
  videoRef: RefObject<HTMLVideoElement | null>;
}

function getGridCols(count: number): string {
  if (count === 1) return "grid-cols-1";
  if (count <= 4) return "grid-cols-2";
  if (count <= 6) return "grid-cols-3";
  return "grid-cols-4";
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
              {p.user?.name || "Unknown"}
              {p.isMe && " (Me)"}
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
        <video
          ref={screenRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/70 text-white rounded-lg text-sm">
          Sharing my screen
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {participants.map((p) => (
          <div
            key={p.key}
            className="relative w-32 h-24 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 border-2 border-gray-700"
          >
            <ParticipantVideo
              participant={p}
              videoRef={videoRef}
              size="small"
            />

            <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
              <span className="text-xs text-white bg-black/70 px-1 rounded truncate">
                {p.user?.name || "Unknown"}
                {p.isMe && " (Me)"}
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
  size: "small" | "large";
}) {
  const avatarSize =
    size === "large" ? "w-24 h-24 text-4xl" : "w-8 h-8 text-sm";

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
    return (
      <StreamVideo
        stream={participant.stream}
        className="w-full h-full object-cover"
      />
    );
  }

  const displayName = participant.user?.name || "Unknown";
  const initial = displayName[0].toUpperCase();
  const avatarUrl = participant.user?.avatarUrl;
  const showVideoOffBadge = !participant.isVideoOn;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {avatarUrl ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-md opacity-60"
            style={{ backgroundImage: `url(${avatarUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/70" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600" />
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`${avatarSize} bg-white/20 rounded-full flex items-center justify-center text-white font-bold backdrop-blur-sm border border-white/30`}
        >
          {initial}
        </div>
      </div>

      {showVideoOffBadge && (
        <div
          className={`absolute ${size === "large" ? "top-4 right-4 px-3 py-1.5 text-xs" : "top-1 right-1 p-1"} rounded-full bg-black/60 text-white flex items-center gap-1`}
          title="Camera Off"
        >
          <VideoOff className={size === "large" ? "w-3.5 h-3.5" : "w-3 h-3"} />
          {size === "large" && <span>Camera Off</span>}
        </div>
      )}
    </div>
  );
}
