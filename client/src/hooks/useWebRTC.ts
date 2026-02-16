import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";

interface RemoteStreamEntry {
  socketId: string;
  userId?: string;
  stream: MediaStream;
}

interface MeetingParticipant {
  socketId: string;
  userId?: string;
}

interface ExistingParticipant {
  socketId: string;
  userId?: string;
}

export function useWebRTC(socket: Socket | null) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaInitialized, setMediaInitialized] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState<
    MeetingParticipant[]
  >([]);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreamEntry[]>([]);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // --- Participant management ---

  const upsertRemoteParticipant = useCallback(
    (socketId: string, userId?: string) => {
      setRemoteParticipants((prev) => {
        const index = prev.findIndex((p) => p.socketId === socketId);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { socketId, userId: userId ?? next[index].userId };
          return next;
        }
        return [...prev, { socketId, userId }];
      });
    },
    [],
  );

  const removeRemoteParticipant = useCallback((socketId: string) => {
    setRemoteParticipants((prev) =>
      prev.filter((p) => p.socketId !== socketId),
    );
  }, []);

  const upsertRemoteStream = useCallback(
    (socketId: string, stream: MediaStream, userId?: string) => {
      setRemoteStreams((prev) => {
        const index = prev.findIndex((e) => e.socketId === socketId);
        if (index >= 0) {
          const next = [...prev];
          next[index] = {
            socketId,
            stream,
            userId: userId ?? next[index].userId,
          };
          return next;
        }
        return [...prev, { socketId, stream, userId }];
      });
    },
    [],
  );

  const removeRemoteStream = useCallback((socketId: string) => {
    setRemoteStreams((prev) => prev.filter((e) => e.socketId !== socketId));
  }, []);

  // --- Peer connection management ---

  const attachCurrentTracksToPeer = useCallback((pc: RTCPeerConnection) => {
    const localStream = localStreamRef.current;
    const screenStream = screenStreamRef.current;

    const audioTrack = localStream?.getAudioTracks()[0] ?? null;
    const videoTrack =
      screenStream?.getVideoTracks()[0] ??
      localStream?.getVideoTracks()[0] ??
      null;

    const audioSender = pc.getSenders().find((s) => s.track?.kind === "audio");
    if (audioTrack && localStream) {
      if (audioSender) void audioSender.replaceTrack(audioTrack);
      else pc.addTrack(audioTrack, localStream);
    }

    const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
    const videoSourceStream = screenStream ?? localStream;
    if (videoTrack && videoSourceStream) {
      if (videoSender) void videoSender.replaceTrack(videoTrack);
      else pc.addTrack(videoTrack, videoSourceStream);
    } else if (!videoTrack && videoSender) {
      void videoSender.replaceTrack(null);
    }
  }, []);

  const syncTracksToAllPeers = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => attachCurrentTracksToPeer(pc));
  }, [attachCurrentTracksToPeer]);

  const cleanupPeerConnection = useCallback(
    (remoteSocketId: string) => {
      const pc = peerConnectionsRef.current.get(remoteSocketId);
      if (pc) {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.close();
        peerConnectionsRef.current.delete(remoteSocketId);
      }
      removeRemoteParticipant(remoteSocketId);
      removeRemoteStream(remoteSocketId);
    },
    [removeRemoteParticipant, removeRemoteStream],
  );

  const cleanupAllPeerConnections = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
    });
    peerConnectionsRef.current.clear();
    setRemoteParticipants([]);
    setRemoteStreams([]);
  }, []);

  const ensurePeerConnection = useCallback(
    (remoteSocketId: string, remoteUserId?: string) => {
      if (!socket) return null;

      const existing = peerConnectionsRef.current.get(remoteSocketId);
      if (existing) return existing;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peerConnectionsRef.current.set(remoteSocketId, pc);
      attachCurrentTracksToPeer(pc);

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        socket.emit("webrtc-ice-candidate", {
          to: remoteSocketId,
          candidate: event.candidate.toJSON(),
        });
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) upsertRemoteStream(remoteSocketId, stream, remoteUserId);
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "failed" || state === "closed") {
          cleanupPeerConnection(remoteSocketId);
        }
        if (state === "disconnected") {
          setTimeout(() => {
            const current = peerConnectionsRef.current.get(remoteSocketId);
            if (current?.connectionState === "disconnected") {
              cleanupPeerConnection(remoteSocketId);
            }
          }, 5000);
        }
      };

      return pc;
    },
    [
      attachCurrentTracksToPeer,
      cleanupPeerConnection,
      socket,
      upsertRemoteStream,
    ],
  );

  const createOfferToPeer = useCallback(
    async (remoteSocketId: string, remoteUserId?: string) => {
      if (!socket) return;
      try {
        const pc = ensurePeerConnection(remoteSocketId, remoteUserId);
        if (!pc) return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { to: remoteSocketId, offer });
      } catch (error) {
        console.error(`Failed to create offer for ${remoteSocketId}:`, error);
      }
    },
    [ensurePeerConnection, socket],
  );

  // --- Media controls ---

  const startLocalMedia = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          toast.info("Camera not available. Audio only.");
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
            toast.info("Microphone not available. Video only.");
          } catch (finalError) {
            throw finalError;
          }
        }
      }

      localStreamRef.current = stream;
      setIsMicOn(Boolean(stream.getAudioTracks()[0]?.enabled));
      setIsVideoOn(Boolean(stream.getVideoTracks()[0]?.enabled));
      syncTracksToAllPeers();
    } catch (error) {
      const err = error as DOMException;
      if (err.name === "NotAllowedError") {
        toast.error(
          "camera/microphone access denied. Please allow permissions in your browser settings (click the lock icon next to the URL).",
        );
      } else if (err.name === "NotFoundError") {
        toast.error("Camera or microphone not found.");
      } else if (err.name === "NotReadableError") {
        toast.error("Camera/microphone is in use by another app.");
      } else {
        toast.error(`Failed to access media: ${err.message || err.name}`);
      }
      console.error("getUserMedia error:", err.name, err.message);
      setIsMicOn(false);
      setIsVideoOn(false);
    } finally {
      setMediaInitialized(true);
    }
  }, [syncTracksToAllPeers]);

  const stopAllStreams = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
  }, []);

  const stopScreenShare = useCallback(() => {
    if (!screenStreamRef.current) {
      setIsScreenSharing(false);
      return;
    }
    screenStreamRef.current.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);
    syncTracksToAllPeers();
  }, [syncTracksToAllPeers]);

  const toggleMic = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setIsMicOn(audioTrack.enabled);
  }, []);

  const toggleVideo = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setIsVideoOn(videoTrack.enabled);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const screenTrack = stream.getVideoTracks()[0];
      if (!screenTrack) throw new Error("No screen video track available");

      screenStreamRef.current = stream;
      screenTrack.onended = () => stopScreenShare();
      setIsScreenSharing(true);
      syncTracksToAllPeers();
    } catch {
      toast.error("Screen sharing failed.");
    }
  }, [isScreenSharing, stopScreenShare, syncTracksToAllPeers]);

  // --- Socket event handlers ---

  const handleExistingParticipants = useCallback(
    async (existing: Array<string | ExistingParticipant>) => {
      for (const payload of existing) {
        const participant =
          typeof payload === "string" ? { socketId: payload } : payload;
        if (!participant.socketId || participant.socketId === socket?.id)
          continue;
        upsertRemoteParticipant(participant.socketId, participant.userId);
        await createOfferToPeer(participant.socketId, participant.userId);
      }
    },
    [createOfferToPeer, socket?.id, upsertRemoteParticipant],
  );

  const handleMeetingUserJoined = useCallback(
    (participant: ExistingParticipant) => {
      if (!participant?.socketId || participant.socketId === socket?.id) return;
      upsertRemoteParticipant(participant.socketId, participant.userId);
    },
    [socket?.id, upsertRemoteParticipant],
  );

  const handleMeetingUserLeft = useCallback(
    (participant: { socketId: string }) => {
      if (!participant?.socketId) return;
      cleanupPeerConnection(participant.socketId);
    },
    [cleanupPeerConnection],
  );

  const handleWebrtcOffer = useCallback(
    async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      if (!data?.from || !data.offer || !socket) return;
      try {
        upsertRemoteParticipant(data.from);
        const pc = ensurePeerConnection(data.from);
        if (!pc) return;
        await pc.setRemoteDescription(data.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { to: data.from, answer });
      } catch (error) {
        console.error("Failed to handle WebRTC offer:", error);
      }
    },
    [ensurePeerConnection, socket, upsertRemoteParticipant],
  );

  const handleWebrtcAnswer = useCallback(
    async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      if (!data?.from || !data.answer) return;
      try {
        const pc = peerConnectionsRef.current.get(data.from);
        if (pc) await pc.setRemoteDescription(data.answer);
      } catch (error) {
        console.error("Failed to handle WebRTC answer:", error);
      }
    },
    [],
  );

  const handleWebrtcIceCandidate = useCallback(
    async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      if (!data?.from || !data.candidate) return;
      try {
        const pc = peerConnectionsRef.current.get(data.from);
        if (pc) await pc.addIceCandidate(data.candidate);
      } catch (error) {
        console.error("Failed to handle ICE candidate:", error);
      }
    },
    [],
  );

  return {
    // State
    isMicOn,
    isVideoOn,
    isScreenSharing,
    mediaInitialized,
    remoteParticipants,
    remoteStreams,
    localStreamRef,
    screenStreamRef,

    // Media controls
    startLocalMedia,
    stopAllStreams,
    toggleMic,
    toggleVideo,
    toggleScreenShare,

    // Peer management
    cleanupAllPeerConnections,

    // Socket handlers
    handleExistingParticipants,
    handleMeetingUserJoined,
    handleMeetingUserLeft,
    handleWebrtcOffer,
    handleWebrtcAnswer,
    handleWebrtcIceCandidate,
  };
}
