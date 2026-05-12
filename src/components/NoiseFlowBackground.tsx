import { useEffect, useRef } from "react";

export default function NoiseFlowBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    container.appendChild(canvas);

    let time = 0;
    let animationId: number;

    // 부드러운 Perlin-like noise
    const perlin = (x: number, y: number, t: number): number => {
      return (
        Math.sin(x * 0.05 + t * 0.3) *
          Math.cos(y * 0.05 + t * 0.2) *
          Math.sin((x + y) * 0.02 + t * 0.25) +
        Math.sin(x * 0.02 + t * 0.15) * Math.cos(y * 0.03 + t * 0.1) * 0.5
      );
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.005;

      // 여러 계층의 노이즈 흐름 그리기
      for (let layer = 0; layer < 3; layer++) {
        const pixelData = ctx.createImageData(
          canvas.width,
          canvas.height
        );
        const data = pixelData.data;

        for (let i = 0; i < data.length; i += 4) {
          const pixelIndex = i / 4;
          const x = pixelIndex % canvas.width;
          const y = Math.floor(pixelIndex / canvas.width);

          const noise =
            perlin(x, y, time + layer * 100) *
            0.5 +
            0.5;

          const alpha = Math.max(
            0,
            Math.min(
              255,
              noise * 80 - layer * 20 + (layer === 0 ? 0 : -30)
            )
          );

          // 초록색 계열로 변환
          const r = Math.floor(
            (57 * (1 - layer * 0.2) + noise * 50) % 256
          );
          const g = Math.floor(
            (166 * (1 - layer * 0.15) + noise * 60) % 256
          );
          const b = Math.floor(
            (27 * (1 - layer * 0.25) + noise * 40) % 256
          );

          data[i] = r; // R
          data[i + 1] = g; // G
          data[i + 2] = b; // B
          data[i + 3] = alpha * (0.4 - layer * 0.1); // A
        }

        ctx.putImageData(pixelData, 0, 0);
      }

      // 부드러운 그라데이션 오버레이
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      gradient.addColorStop(0.5, "rgba(191, 242, 141, 0.97)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0.95)");
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(191,242,141,0.1) 100%)",
      }}
    />
  );
}
