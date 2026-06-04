import { useEffect, useRef, useState } from "react";
import "@/assets/styles/timePicker.css";
import { motion } from "framer-motion";
import { useGlobalContext } from "@/context/GlobalContext";
import { to24hr } from "@/utils/parseTime";

function parseTime(raw) {
  const s = raw.trim().toLowerCase();
  if (!s) return null;

  const match = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am?|pm?)?$/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const min = match[2] ? parseInt(match[2], 10) : 0;
  const suffix = match[3] || null;

  if (min < 0 || min > 59) return null;

  if (suffix === "am" || suffix === "a") {
    if (hour > 12) return null;
    if (hour === 12) hour = 0;
  } else if (suffix === "pm" || suffix === "p") {
    if (hour > 12) return null;
    if (hour !== 12) hour += 12;
  } else {
    if (hour < 0 || hour > 23) return null;
  }

  return { hour, min };
}

const SIZE = 256;
const R = 128;
const FACE_R = 108;
const NUM_R = 88;

export default function ClockTimePicker({
  isOpen,
  setIsOpen,
  setSelectedTime,
}) {
  const { isDarkModeRef } = useGlobalContext();

  const isDarkMode = isDarkModeRef.current;
  const canvasRef = useRef(null);
  const draggingRef = useRef(false);

  const [mode, setMode] = useState("hour");
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState("AM");

  const angleRef = useRef(-Math.PI / 2);

  const pad = (n) => String(n).padStart(2, "0");

  const angleToHour = (a) => {
    let h = ((a + Math.PI / 2) / (2 * Math.PI)) * 12;
    h = ((h % 12) + 12) % 12;
    return h;
  };

  const angleToMinute = (a) => {
    let m = ((a + Math.PI / 2) / (2 * Math.PI)) * 60;
    m = ((m % 60) + 60) % 60;
    return m;
  };

  const hourToAngle = (h) => ((h % 12) / 12) * 2 * Math.PI - Math.PI / 2;

  const minuteToAngle = (m) => (m / 60) * 2 * Math.PI - Math.PI / 2;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, SIZE, SIZE);

    ctx.beginPath();
    ctx.arc(R, R, FACE_R, 0, 2 * Math.PI);
    ctx.fillStyle = isDarkMode ? "#1f2a35" : "#f5f5f5";
    ctx.fill();

    const angle = angleRef.current;

    const hx = R + NUM_R * Math.cos(angle);
    const hy = R + NUM_R * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(R, R);
    ctx.lineTo(hx, hy);
    ctx.strokeStyle = "#1a73e8";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(R, R, 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a73e8";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(hx, hy, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a73e8";
    ctx.fill();

    if (mode === "hour") {
      const labels = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

      labels.forEach((n, i) => {
        const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
        const x = R + NUM_R * Math.cos(a);
        const y = R + NUM_R * Math.sin(a);

        const isActive = Math.hypot(x - hx, y - hy) < 21;

        ctx.font = "500 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isActive ? "#fff" : isDarkMode ? "#9c9c9c" : "#3c4043";
        ctx.fillText(String(n), x, y);
      });
    } else {
      [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].forEach((n) => {
        const a = (n / 60) * 2 * Math.PI - Math.PI / 2;
        const x = R + NUM_R * Math.cos(a);
        const y = R + NUM_R * Math.sin(a);

        const isActive = Math.hypot(x - hx, y - hy) < 21;

        ctx.font = "500 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isActive ? "#fff" : isDarkMode ? "#9c9c9c" : "#3c4043";
        ctx.fillText(pad(n), x, y);
      });
    }
  };

  const getAngleFromEvent = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;

    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return Math.atan2(clientY - rect.top - R, clientX - rect.left - R);
  };

  const applyAngle = (a) => {
    angleRef.current = a;

    if (mode === "hour") {
      setHour(Math.round(angleToHour(a)) || 12);
    } else {
      setMinute(Math.round(angleToMinute(a)) % 60);
    }

    draw();
  };

  const startDrag = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    applyAngle(getAngleFromEvent(e));
  };

  useEffect(() => {
    const move = (e) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      applyAngle(getAngleFromEvent(e));
    };

    const up = () => {
      if (!draggingRef.current) return;

      draggingRef.current = false;

      if (mode === "hour") {
        setMode("min");
        angleRef.current = minuteToAngle(minute);
      }
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    document.addEventListener("touchmove", move, {
      passive: false,
    });
    document.addEventListener("touchend", up);

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", up);
    };
  }, [mode, minute]);

  useEffect(() => {
    const canvas = canvasRef.current;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;

    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    draw();
  }, []);

  useEffect(() => {
    draw();
  }, [hour, minute, mode]);

  const selectSegment = (segment) => {
    setMode(segment);

    angleRef.current =
      segment === "hour" ? hourToAngle(hour) : minuteToAngle(minute);

    draw();
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleOk = () => {
    const parsed = parseTime(`${pad(hour)}:${pad(minute)} ${period}`);
    setSelectedTime(to24hr(parsed));
    setIsOpen(false);
  };

  return (
    <>
      <motion.div
        className="overlay"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
          pointerEvents: "none",
          display: "none",
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 50,
          mass: 1,
        }}
        style={{ zIndex: "210" }}
        onClick={() => {
          setIsOpen(false);
        }}
      />
      <motion.div
        initial={{
          transform: "translate(-50%, -40%) scale(0.97)",
          opacity: 0,
        }}
        animate={{
          transform: "translate(-50%, -40%) scale(1)",
          opacity: 1,
        }}
        exit={{
          transform: "translate(-50%, -40%) scale(0.97)",
          opacity: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 40,
          mass: 1.05,
        }}
        className="tp-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tp-dialog-title">Enter time</div>

        <div className="tp-time-display">
          <div
            className={`tp-time-segment ${mode === "hour" ? "active" : ""}`}
            onClick={() => selectSegment("hour")}
          >
            {pad(hour)}
          </div>

          <div className="tp-time-separator">:</div>

          <div
            className={`tp-time-segment ${mode === "min" ? "active" : ""}`}
            onClick={() => selectSegment("min")}
          >
            {pad(minute)}
          </div>

          <div className="tp-period-toggle">
            <button
              className={`tp-period-btn ${period === "AM" ? "active" : ""}`}
              onClick={() => setPeriod("AM")}
            >
              AM
            </button>

            <button
              className={`tp-period-btn ${period === "PM" ? "active" : ""}`}
              onClick={() => setPeriod("PM")}
            >
              PM
            </button>
          </div>
        </div>

        <div className="tp-clock-wrap">
          <canvas
            ref={canvasRef}
            className="tp-clock"
            onMouseDown={startDrag}
            onTouchStart={startDrag}
          />
        </div>

        <div className="tp-actions">
          <button
            className="action-modal-bottom-btn action-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>

          <button className="action-modal-bottom-btn" onClick={handleOk}>
            OK
          </button>
        </div>
      </motion.div>
    </>
  );
}
