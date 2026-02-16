import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
} from "lucide-react";

interface MeetingControlsProps {
  isMicOn: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreen: () => void;
  onLeave: () => void;
}

export function MeetingControls({
  isMicOn,
  isVideoOn,
  isScreenSharing,
  onToggleMic,
  onToggleVideo,
  onToggleScreen,
  onLeave,
}: MeetingControlsProps) {
  return (
    <div className="h-20 bg-gray-800 border-t border-gray-700 flex items-center justify-center gap-3 px-6">
      <ControlButton
        active={isMicOn}
        activeIcon={<Mic className="w-6 h-6" />}
        inactiveIcon={<MicOff className="w-6 h-6" />}
        title={isMicOn ? "Mute microphone" : "Unmute microphone"}
        onClick={onToggleMic}
      />
      <ControlButton
        active={isVideoOn}
        activeIcon={<Video className="w-6 h-6" />}
        inactiveIcon={<VideoOff className="w-6 h-6" />}
        title={isVideoOn ? "Turn off video" : "Turn on video"}
        onClick={onToggleVideo}
      />
      <ControlButton
        active={!isScreenSharing}
        activeIcon={<Monitor className="w-6 h-6" />}
        inactiveIcon={<MonitorOff className="w-6 h-6" />}
        activeColor="bg-gray-700 hover:bg-gray-600"
        inactiveColor="bg-blue-600 hover:bg-blue-700"
        title={isScreenSharing ? "Stop screen sharing" : "Start screen sharing"}
        onClick={onToggleScreen}
      />

      <div className="flex-1" />

      <button
        onClick={onLeave}
        className="px-6 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center gap-2 font-semibold transition-all"
      >
        <PhoneOff className="w-5 h-5" />
        <span>Leave Meeting</span>
      </button>
    </div>
  );
}

function ControlButton({
  active,
  activeIcon,
  inactiveIcon,
  title,
  onClick,
  activeColor = "bg-gray-700 hover:bg-gray-600",
  inactiveColor = "bg-red-600 hover:bg-red-700",
}: {
  active: boolean;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  title: string;
  onClick: () => void;
  activeColor?: string;
  inactiveColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all text-white ${
        active ? activeColor : inactiveColor
      }`}
      title={title}
    >
      {active ? activeIcon : inactiveIcon}
    </button>
  );
}
