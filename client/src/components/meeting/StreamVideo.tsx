import { useRef, useEffect } from 'react';

interface StreamVideoProps {
  stream: MediaStream;
  muted?: boolean;
  className?: string;
}

export function StreamVideo({ stream, muted, className }: StreamVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.srcObject = stream;
    ref.current.play().catch(() => {
      // Browser autoplay policy may block unmuted media until user interaction.
    });
  }, [stream]);

  return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
}
