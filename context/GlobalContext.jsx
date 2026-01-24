"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLayout } from "./LayoutContext";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const { calculateLayoutRef } = useLayout();
  const [isExpanded, setIsExpanded] = useState({ open: null, threshold: null });
  const isDarkModeRef = useRef(false);

  useEffect(() => {
    if (!calculateLayoutRef.current) return;
    setTimeout(() => {
      calculateLayoutRef.current();
    }, 10);
  }, [isExpanded.open]);

  useEffect(() => {
    const width = window.innerWidth;
    if (width < 605) return;
    localStorage.setItem(
      "sidebar-expanded",
      isExpanded.open ? "true" : "false",
    );
  }, [isExpanded.open]);

  useEffect(() => {
    if (isExpanded.threshold !== "before") {
      document.body.removeAttribute("data-scroll-locked-sidebar");
      return;
    }
    getScrollbarWidth();
    if (isExpanded.open) {
      document.body.setAttribute("data-scroll-locked-sidebar", "1");
    } else {
      document.body.removeAttribute("data-scroll-locked-sidebar");
    }
  }, [isExpanded.open]);

  useEffect(() => {
    const width = window.innerWidth;
    const sidebarExpanded = localStorage.getItem("sidebar-expanded");
    setIsExpanded({
      open: width < 605 ? false : sidebarExpanded === "true",
      threshold: width < 605 ? "before" : "after",
    });
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark-mode");
      isDarkModeRef.current = true;
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      const width = window.innerWidth;

      if (width < 605) {
        if (isExpanded.threshold !== "before") {
          setIsExpanded({ open: false, threshold: "before" });
        }
      } else if (isExpanded.threshold !== "after") {
        setIsExpanded({ open: false, threshold: "after" });
      }
    };

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [isExpanded]);

  useEffect(() => {
    document.body.classList.toggle("sidebar-open", isExpanded.open);
    document.body.classList.toggle("sidebar-closed", !isExpanded.open);
  }, [isExpanded.open]);

  useEffect(() => {
    const handler = (e) => {
      if (
        e.key === "Escape" &&
        isExpanded.threshold === "before" &&
        isExpanded.open
      ) {
        setIsExpanded((prev) => ({ ...prev, open: false }));
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isExpanded]);

  useEffect(() => {
    const handler = () => {
      setIsExpanded((prev) => ({ ...prev, open: false }));
    };

    window.addEventListener("close-sidebar", handler);
    return () => window.removeEventListener("close-sidebar", handler);
  }, []);

  const getScrollbarWidth = useCallback(() => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty(
      "--removed-body-scroll-bar-size",
      `${scrollbarWidth}px`,
    );
  }, []);

  const lockScroll = useCallback((isOpen) => {
    getScrollbarWidth();
    requestAnimationFrame(() => {
      if (isOpen) {
        // ignoreKeysRef.current = true;
        document.body.setAttribute("data-scroll-locked", "1");
      } else {
        // ignoreKeysRef.current = false;
        document.body.removeAttribute("data-scroll-locked");
      }
    });
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        isExpanded,
        setIsExpanded,
        isDarkModeRef,
        lockScroll,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
