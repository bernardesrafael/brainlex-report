import { useEffect, useRef } from "react";

export function MatrixRain({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);
    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF";

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = active ? "#00ff4120" : "#00ff4108";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: active ? 0.4 : 0.15 }}
    />
  );
}

export function BrainVisualizer({ isActive }: { isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <video
        ref={videoRef}
        src="/brain-pulse.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="w-[400px] md:w-[550px] lg:w-[650px] h-auto transition-all duration-300"
        style={{
          opacity: isActive ? 0.9 : 0.6,
          filter: isActive ? "brightness(1.3)" : "brightness(1)",
        }}
      />
    </div>
  );
}

// Keep backward compat exports
export const IrisBackground = () => null;
export const GridBackground = () => null;
export const ScanLine = () => null;
export const FloatingParticles = () => null;
export const GlowOrb = ({ className: _className = "" }: { className?: string }) => null;
