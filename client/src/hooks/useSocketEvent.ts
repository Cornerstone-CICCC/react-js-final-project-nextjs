import { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';

/**
 * Subscribe to a socket event and auto-cleanup on unmount.
 * The callback is stable-referenced; changes trigger re-subscription.
 */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void,
  enabled = true,
) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !enabled) return;

    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler, enabled]);
}
