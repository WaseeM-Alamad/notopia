"use client";
import React from "react";
import "@/assets/styles/globals.css";
import { useAppContext } from "@/context/AppContext";

const MainLayout = ({ children }) => {
  const { isDarkModeRef } = useAppContext();

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark-mode");
    const newMode = document.documentElement.classList.contains("dark-mode")
      ? "dark"
      : "light";
    localStorage.setItem("theme", newMode);
    isDarkModeRef.current = newMode === "dark";
  };

  return (
    <div className="auth-background">
      <button
        onClick={toggleDarkMode}
        style={{
          position: "fixed",
          right: "1rem",
          top: "1rem",
          backgroundColor: "lightgreen",
        }}
      >
        toggle theme
      </button>
      {children}
    </div>
  );
};

export default MainLayout;
