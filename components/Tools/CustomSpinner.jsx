import { useEffect, useRef } from "react";

export default function CustomThreeLineSpinner({
  size = 50,
  strokeWidth = 4,
  color = "#8991ffff",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const center = size / 2;
    const radius = (size - strokeWidth) / 2;


    const duration = 1150;
    const startTime = performance.now();

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function draw(time) {
      const elapsed = (time - startTime) % duration;
      const progress = elapsed / duration;

      ctx.clearRect(0, 0, size, size);

      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const curveValue = easeInOutCubic(progress);

      const globalRotation = curveValue * Math.PI * 2;

      for (let i = 0; i < 3; i++) {
        const baseOffset = i * ((Math.PI * 2) / 3);

        const speedFactor = Math.sin(progress * Math.PI);

        const shrinkCurve = Math.pow(speedFactor, 3.5);

        const currentLength = 0.35 + shrinkCurve * 1.2;

        const startAngle = globalRotation + baseOffset;

        ctx.beginPath();
        ctx.arc(
          center,
          center,
          radius,
          startAngle,
          startAngle + currentLength,
          false
        );
        ctx.stroke();
      }

      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);

    return () => ctx.clearRect(0, 0, size, size);
  }, [size, strokeWidth, color]);

  return <canvas ref={canvasRef} />;
}
