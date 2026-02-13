import type { User } from '../../types';

export interface MeetingParticipantView {
  key: string;
  socketId: string;
  user: User | undefined;
  isMicOn: boolean;
  isVideoOn: boolean;
  isMe: boolean;
  stream: MediaStream | null;
}
