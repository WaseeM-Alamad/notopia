import React from "react";
import "@/assets/styles/globals.css";

const MainLayout = async ({ children }) => {
  return <div className="auth-background">{children}</div>;
};

export default MainLayout;
