"use client";
import Navbar from "@/components/others/navbar/Navbar";
import Sidebar from "@/components/others/Sidebar";
import { useAppContext } from "@/context/AppContext";
import React from "react";

const Layout = ({ children }) => {
  const { initialLoading, session } = useAppContext();

  return (
    <>
      {session && (
        <>
          <div
            style={{
              pointerEvents: initialLoading && "none",
              opacity: initialLoading ? "0" : "1",
              transition: "opacity 0.2s ease",
            }}
          >
            <Navbar />
            <Sidebar />
          </div>
          {children}
        </>
      )}
    </>
  );
};

export default Layout;
