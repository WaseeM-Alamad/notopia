"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
  const [layout, setLayout] = useState(null);
  const [breakpoint, setBreakpoint] = useState(1);
  const calculateLayoutRef = useRef(null);

  useEffect(() => {
    const width = window.innerWidth;

    if (width < 341) {
      setLayout("list");
    } else {
      const savedLayout = localStorage.getItem("layout");
      setLayout(savedLayout);
      setBreakpoint(width > 527 ? 1 : width < 400 ? 3 : 2);
    }
  }, []);

  useEffect(() => {
    const toggleLayout = () => {
      const isGrid = layout === "grid";
      if (isGrid) {
        localStorage.setItem("layout", "list");
        setLayout("list");
      } else {
        localStorage.setItem("layout", "grid");
        setLayout("grid");
      }
    };

    window.addEventListener("toggleLayout", toggleLayout);
    return () => window.removeEventListener("toggleLayout", toggleLayout);
  }, [layout]);

  useEffect(() => {
    const handler = () => {
      const width = window.innerWidth;

      if (width < 341) {
        setLayout("list");
      } else {
        const savedLayout = localStorage.getItem("layout");
        setLayout(savedLayout);
        setBreakpoint(width > 527 ? 1 : width < 400 ? 3 : 2);
      }
    };

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [setBreakpoint]);

  return (
    <LayoutContext.Provider
      value={{
        layout,
        setLayout,
        breakpoint,
        setBreakpoint,
        calculateLayoutRef,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => useContext(LayoutContext);
