import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

// Plain object types for WebRTC signaling (browser-only types not available in Node.js)
interface RTCSessionDescription {
  type: string;
  sdp?: string;
}

interface RTCIceCandidate {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}

interface SocketMessage {
  id: string;
  studyId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
}

interface SocketAttendance {
  id: string;
  scheduleId: string;
  userId: string;
  status: string;
  user: { id: string; name: string; avatarUrl: string | null };
}

/**
 * Parse cookies from a cookie header string
 */
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((acc: Record<string, string>, cookie: string) => {
    const [key, val] = cookie.trim().split("=");
    if (key && val) acc[key] = val;
    return acc;
  }, {});
}

/**
 * Initialize Socket.IO with authentication and event handlers
 */
export function initSocketIO(io: Server) {
  // Authentication middleware - supports both auth token and httpOnly cookies
  io.use((socket: AuthenticatedSocket, next) => {
    let token = socket.handshake.auth.token;

    // If no valid auth token, try to get from cookies
    if (!token || token === "from-cookie") {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      token = cookies["accessToken"];
    }

    if (!token) {
      return next(new Error("Authentication error: Token required"));
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return next(new Error("Authentication error: Invalid token"));
    }

    // Attach user info to socket
    socket.userId = payload.userId;
    socket.email = payload.email;
    next();
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    /**
     * Join a study room
     */
    socket.on("join-study", (studyId: string) => {
      socket.join(`study:${studyId}`);

      // Notify others that user joined
      socket.to(`study:${studyId}`).emit("user-joined", {
        userId: socket.userId,
        email: socket.email,
      });
    });

    /**
     * Leave a study room
     */
    socket.on("leave-study", (studyId: string) => {
      socket.leave(`study:${studyId}`);

      socket.to(`study:${studyId}`).emit("user-left", {
        userId: socket.userId,
      });
    });

    /**
     * Real-time chat message
     */
    socket.on("send-message", (data: { studyId: string; message: SocketMessage }) => {
      const { studyId, message } = data;
      socket.to(`study:${studyId}`).emit("new-message", message);
    });

    /**
     * Real-time todo updates
     */
    socket.on("todo-update", (data: { studyId: string }) => {
      const { studyId } = data;
      socket.to(`study:${studyId}`).emit("todo-updated", {});
    });

    /**
     * Real-time schedule updates
     */
    socket.on("schedule-update", (data: { studyId: string }) => {
      const { studyId } = data;
      socket.to(`study:${studyId}`).emit("schedule-updated", {});
    });

    /**
     * Real-time attendance updates
     */
    socket.on(
      "attendance-update",
      (data: { studyId: string; scheduleId: string; attendance: SocketAttendance }) => {
        const { studyId, scheduleId, attendance } = data;

        socket.to(`study:${studyId}`).emit("attendance-updated", {
          scheduleId,
          attendance,
        });
      },
    );

    /**
     * Join meeting room (for WebRTC signaling)
     */
    socket.on("join-meeting", (studyId: string) => {
      socket.join(`meeting:${studyId}`);

      // Notify others in the meeting
      socket.to(`meeting:${studyId}`).emit("meeting-user-joined", {
        userId: socket.userId,
        socketId: socket.id,
      });

      // Send list of existing participants to the new joiner
      const room = io.sockets.adapter.rooms.get(`meeting:${studyId}`);
      if (room) {
        const participants = Array.from(room)
          .filter((id) => id !== socket.id)
          .map((id) => {
            const participantSocket = io.sockets.sockets.get(id) as
              | AuthenticatedSocket
              | undefined;

            return {
              socketId: id,
              userId: participantSocket?.userId,
            };
          });
        socket.emit("existing-participants", participants);
      }
    });

    /**
     * Leave meeting room
     */
    socket.on("leave-meeting", (studyId: string) => {
      socket.leave(`meeting:${studyId}`);

      socket.to(`meeting:${studyId}`).emit("meeting-user-left", {
        userId: socket.userId,
        socketId: socket.id,
      });
    });

    /**
     * WebRTC signaling: offer
     */
    socket.on(
      "webrtc-offer",
      (data: { to: string; offer: RTCSessionDescription }) => {
        const { to, offer } = data;
        io.to(to).emit("webrtc-offer", {
          from: socket.id,
          offer,
        });
      },
    );

    /**
     * WebRTC signaling: answer
     */
    socket.on(
      "webrtc-answer",
      (data: { to: string; answer: RTCSessionDescription }) => {
        const { to, answer } = data;
        io.to(to).emit("webrtc-answer", {
          from: socket.id,
          answer,
        });
      },
    );

    /**
     * WebRTC signaling: ICE candidate
     */
    socket.on(
      "webrtc-ice-candidate",
      (data: { to: string; candidate: RTCIceCandidate }) => {
        const { to, candidate } = data;
        io.to(to).emit("webrtc-ice-candidate", {
          from: socket.id,
          candidate,
        });
      },
    );

    /**
     * Typing indicator
     */
    socket.on("typing-start", (studyId: string) => {
      socket.to(`study:${studyId}`).emit("user-typing", {
        userId: socket.userId,
      });
    });

    socket.on("typing-stop", (studyId: string) => {
      socket.to(`study:${studyId}`).emit("user-stopped-typing", {
        userId: socket.userId,
      });
    });

    /**
     * Disconnect
     */
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
}
