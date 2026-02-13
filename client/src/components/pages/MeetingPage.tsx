import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { Video, Users, MessageSquare } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { useWebRTC } from "../../hooks/useWebRTC";
import { toast } from "sonner";
import { MeetingControls } from "../meeting/MeetingControls";
import { MeetingChat } from "../meeting/MeetingChat";
import { ParticipantList } from "../meeting/ParticipantList";
import { VideoGrid, ScreenShareLayout } from "../meeting/VideoGrid";
import type { Study, Message, User } from "../../types";
import type { MeetingParticipantView } from "../meeting/types";

export function MeetingPage() {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);

  const {
    isMicOn,
    isVideoOn,
    isScreenSharing,
    mediaInitialized,
    remoteParticipants,
    remoteStreams,
    localStreamRef,
    startLocalMedia,
    stopAllStreams,
    toggleMic,
    toggleVideo,
    toggleScreenShare,
    cleanupAllPeerConnections,
    handleExistingParticipants,
    handleMeetingUserJoined,
    handleMeetingUserLeft,
    handleWebrtcOffer,
    handleWebrtcAnswer,
    handleWebrtcIceCandidate,
  } = useWebRTC(socket);

  // --- Data loading ---

  const loadData = useCallback(async () => {
    if (!studyId) return;
    try {
      const [studyRes, messagesRes] = await Promise.all([
        api.getStudy(studyId),
        api.getMessages(studyId),
      ]);
      setStudy(studyRes.study);
      setMessages(messagesRes.messages);
    } catch {
      toast.error("Failed to load meeting data");
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  // --- Attach local streams to video elements ---

  const attachStream = useCallback(
    (el: HTMLVideoElement | null, stream: MediaStream | null) => {
      if (!el) return;
      el.srcObject = stream;
      if (stream) el.play().catch(() => {});
    },
    [],
  );

  useEffect(() => {
    attachStream(videoRef.current, localStreamRef.current);
  }, [attachStream, isScreenSharing, isVideoOn, mediaInitialized]);

  useEffect(() => {
    attachStream(
      screenRef.current,
      isScreenSharing ? localStreamRef.current : null,
    );
  }, [attachStream, isScreenSharing]);

  // --- Lifecycle ---

  useEffect(() => {
    setLoading(true);
    if (studyId) {
      void loadData();
      void startLocalMedia();
    }
    return () => {
      cleanupAllPeerConnections();
      stopAllStreams();
    };
  }, [
    cleanupAllPeerConnections,
    loadData,
    startLocalMedia,
    stopAllStreams,
    studyId,
  ]);

  // --- Socket events ---

  useEffect(() => {
    if (!socket || !studyId || !mediaInitialized) return;

    const handleNewMessage = (msg: Message) =>
      setMessages((prev) => [...prev, msg]);

    socket.on("new-message", handleNewMessage);
    socket.on("existing-participants", handleExistingParticipants);
    socket.on("meeting-user-joined", handleMeetingUserJoined);
    socket.on("meeting-user-left", handleMeetingUserLeft);
    socket.on("webrtc-offer", handleWebrtcOffer);
    socket.on("webrtc-answer", handleWebrtcAnswer);
    socket.on("webrtc-ice-candidate", handleWebrtcIceCandidate);

    socket.emit("join-study", studyId);
    socket.emit("join-meeting", studyId);

    return () => {
      socket.emit("leave-meeting", studyId);
      socket.emit("leave-study", studyId);
      socket.off("new-message", handleNewMessage);
      socket.off("existing-participants", handleExistingParticipants);
      socket.off("meeting-user-joined", handleMeetingUserJoined);
      socket.off("meeting-user-left", handleMeetingUserLeft);
      socket.off("webrtc-offer", handleWebrtcOffer);
      socket.off("webrtc-answer", handleWebrtcAnswer);
      socket.off("webrtc-ice-candidate", handleWebrtcIceCandidate);
      cleanupAllPeerConnections();
    };
  }, [
    cleanupAllPeerConnections,
    handleExistingParticipants,
    handleMeetingUserJoined,
    handleMeetingUserLeft,
    handleWebrtcAnswer,
    handleWebrtcIceCandidate,
    handleWebrtcOffer,
    mediaInitialized,
    socket,
    studyId,
  ]);

  // --- Derived state ---

  const memberUserMap = useMemo(() => {
    const map = new Map<string, User>();
    study?.members?.forEach((m) => {
      if (m.user?.id) map.set(m.user.id, m.user);
    });
    return map;
  }, [study]);

  const remoteStreamMap = useMemo(() => {
    const map = new Map<string, MediaStream>();
    remoteStreams.forEach((e) => map.set(e.socketId, e.stream));
    return map;
  }, [remoteStreams]);

  const allParticipants: MeetingParticipantView[] = useMemo(() => {
    const list = remoteParticipants.map((p) => ({
      key: p.socketId,
      socketId: p.socketId,
      user: p.userId ? memberUserMap.get(p.userId) : undefined,
      isMicOn: true,
      isVideoOn: true,
      isMe: false,
      stream: remoteStreamMap.get(p.socketId) ?? null,
    }));

    if (user) {
      list.unshift({
        key: `local:${user.id}`,
        socketId: socket?.id ?? "",
        user,
        isMicOn,
        isVideoOn,
        isMe: true,
        stream: localStreamRef.current,
      });
    }

    return list;
  }, [
    isMicOn,
    isVideoOn,
    memberUserMap,
    remoteParticipants,
    remoteStreamMap,
    socket?.id,
    user,
  ]);

  // --- Actions ---

  const leaveMeeting = () => {
    if (socket && studyId) {
      socket.emit("leave-meeting", studyId);
      socket.emit("leave-study", studyId);
    }
    cleanupAllPeerConnections();
    stopAllStreams();
    navigate(`/app/study/${studyId}`);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !studyId) return;
    try {
      const response = await api.sendMessage(studyId, message.trim());
      setMessage("");
      setMessages((prev) => [...prev, response.message]);
      socket?.emit("send-message", { studyId, message: response.message });
    } catch {
      toast.error("Failed to send message");
    }
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!study || !user) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white/40">Study not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white">{study.name}</h1>
            <p className="text-sm text-gray-400">
              {allParticipants.length}명 참여중
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">참가자</span>
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">채팅</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-y-auto">
          {isScreenSharing ? (
            <ScreenShareLayout
              participants={allParticipants}
              videoRef={videoRef}
              screenRef={screenRef}
            />
          ) : (
            <VideoGrid participants={allParticipants} videoRef={videoRef} />
          )}
        </div>

        {showChat && (
          <MeetingChat
            messages={messages}
            message={message}
            onMessageChange={setMessage}
            onSend={handleSendMessage}
            onClose={() => setShowChat(false)}
          />
        )}

        {showParticipants && (
          <ParticipantList
            participants={allParticipants}
            onClose={() => setShowParticipants(false)}
          />
        )}
      </div>

      <MeetingControls
        isMicOn={isMicOn}
        isVideoOn={isVideoOn}
        isScreenSharing={isScreenSharing}
        onToggleMic={toggleMic}
        onToggleVideo={toggleVideo}
        onToggleScreen={toggleScreenShare}
        onLeave={leaveMeeting}
      />
    </div>
  );
}
