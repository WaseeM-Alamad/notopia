"use client";
import React, { useEffect, useState } from "react";
import "@/assets/styles/globals.css";
import { useAppContext } from "@/context/AppContext";

const MainLayout = ({ children }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return;
  return (
    <div className="auth-background">
      {/* <button
        onClick={toggleDarkMode}
        style={{
          position: "fixed",
          right: "1rem",
          top: "1rem",
          backgroundColor: "lightgreen",
        }}
      >
        toggle theme
      </button> */}
      {children}
    </div>
  );
};

export default MainLayout;
