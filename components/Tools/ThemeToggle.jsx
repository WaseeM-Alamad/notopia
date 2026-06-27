import { useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  return (
    <div
      style={{
        position: "absolute",
        right: "1.5rem",
        top: "1rem",
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <label
        style={{
          position: "relative",
          width: 56,
          height: 30,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={isDark}
          onChange={(e) => {
            setIsDark(e.target.checked);
            requestIdleCallback(() => {
              document.documentElement.classList.toggle("dark-mode");
              const newMode = document.documentElement.classList.contains(
                "dark-mode",
              )
                ? "dark"
                : "light";
              localStorage.setItem("theme", newMode);
              // isDarkModeRef.current = newMode === "dark";
            });
          }}
          style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 15,
            background: isDark ? "#2b4360" : "#83c4d8",
            transition: "background 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 3,
            left: 3,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: isDark ? "#cce6ee" : "#f8e664",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            transform: isDark ? "translateX(26px)" : "translateX(0)",
            transition:
              "transform 0.25s cubic-bezier(0.4,0,0.2,1), background 0.25s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
        ></div>
      </label>
    </div>
  );
}
