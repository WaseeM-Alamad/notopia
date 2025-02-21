"use client";
import React, { memo, useEffect, useRef, useState } from "react";
import "@/assets/styles/navbar.css";
import { signOut } from "next-auth/react";
import RefreshIcon from "../icons/RefreshIcon";
import SettingsIcon from "../icons/SettingsIcon";
import GridIcon from "../icons/GridIcon";
import { CircularProgress } from "@mui/material";
import { usePathname } from "next/navigation";
import { Box, margin } from "@mui/system";
import CloudIcon from "../icons/CloudIcon";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../Tools/Button";
import Logo from "../icons/Logo";
import ProfileMenu from "./ProfileMenu";

const Navbar = ({ user }) => {
  const [isLoading, setIsLoading] = useState(0);
  const [UpToDatetrigger, setUpToDateTrigger] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDarkMode = document.documentElement.classList.contains("dark-mode");
  const [menuPosition, setMenuPosition] = useState({
    top: 100,
    left: 600,
  });
  const image = user?.image;
  const pathName = usePathname();
  const firstRun = useRef(true);
  const imageRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const startLoading = () => {
      setIsLoading((prev) => prev + 1);
      clearTimeout(timeoutRef.current);
      setUpToDateTrigger(true);
    };
    const stopLoading = () => {
      setTimeout(() => {
        setIsLoading((prev) => {
          if (prev > 0) return prev - 1;
        });
      }, 800);
    };

    // Listen for custom events
    window.addEventListener("loadingStart", startLoading);
    window.addEventListener("loadingEnd", stopLoading);

    return () => {
      window.removeEventListener("loadingStart", startLoading);
      window.removeEventListener("loadingEnd", stopLoading);
    };
  }, []);

  const timeoutRef = useRef(null);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!isLoading) {
      setUpToDateTrigger(false);
      timeoutRef.current = setTimeout(() => {
        setUpToDateTrigger(true);
      }, 1100);
    }
  }, [isLoading]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isLoading) {
        const message =
          "Your request is still in progress. Are you sure you want to leave?";
        event.returnValue = message; // Standard for most browsers
        return message; // For some browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isLoading]);

  useEffect(() => {
    const handler = (e) => {
      if (
        isMenuOpen &&
        !imageRef.current?.contains(e.target) &&
        !menuRef.current?.contains(e.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (isMenuOpen) {
        // setIsMenuOpen(false);
        const rect = imageRef.current?.getBoundingClientRect();
        setMenuPosition({
          top: rect.top,
          left: rect.left,
        });
      }
    };

    document.addEventListener("click", handler);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("click", handler);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMenuOpen]);

  const handleRefresh = () => {
    if (!isLoading && UpToDatetrigger)
      window.dispatchEvent(new Event("refresh"));
  };

  const handleProfileOpen = () => {
    const rect = imageRef.current?.getBoundingClientRect();
    setMenuPosition({
      top: rect.top,
      left: rect.left,
    });
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <>
      <ProfileMenu
        user={user}
        ref={menuRef}
        menuPosition={menuPosition}
        isOpen={isMenuOpen}
      />
      {pathName !== "/" && (
        <nav
          style={{
            boxShadow: isScrolled && "0 3px 10px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* <div className="logo"> */}
          {/* <Logo style={{margin: "auto 0"}} /> */}
          {/* <span style={{marginLeft: "0.5rem"}}>notopia</span> */}
          {/* </div> */}
          <input className="search" placeholder="Search" spellCheck="false" />
          <div className="top-icons">
            <Button style={{ width: "2.8rem", height: "2.8rem" }}>
              <GridIcon />
            </Button>
            <Button
              onClick={handleRefresh}
              style={{ width: "2.8rem", height: "2.8rem" }}
            >
              <AnimatePresence>
                {!isLoading && UpToDatetrigger && (
                  <motion.div
                    initial={{ opacity: 0 }} // Start with opacity 0 when the component first mounts
                    animate={{ opacity: 1 }} // Fade in to opacity 1 when it becomes visible
                    exit={{ opacity: 0, transition: { delay: 0.1 } }} // Fade out to opacity 0 when the component unmounts
                    transition={{ duration: 0.2 }}
                    style={{ position: "absolute", height: "18px" }}
                  >
                    <RefreshIcon />
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {isLoading && UpToDatetrigger && (
                  <motion.div
                    initial={{ opacity: 0 }} // Start with opacity 0 when the component first mounts
                    animate={{ opacity: 1 }} // Fade in to opacity 1 when it becomes visible
                    exit={{ opacity: 0, transition: { delay: 0.07 } }} // Fade out to opacity 0 when the component unmounts
                    transition={{ duration: 0.15 }}
                    style={{ position: "absolute", marginTop: "4px" }}
                  >
                    <Box>
                      <CircularProgress
                        sx={{ color: isDarkMode ? "#ADADAD" : "#7A7A7A" }}
                        size={20}
                        thickness={5}
                      />
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {!UpToDatetrigger && (
                  <motion.div
                    initial={{ opacity: 0 }} // Start with opacity 0 when the component first mounts
                    animate={{ opacity: 1, transition: { duration: 0.35 } }} // Fade in to opacity 1 when it becomes visible
                    exit={{ opacity: 0, transition: { duration: 0.1 } }} // Fade out to opacity 0 when the component unmounts
                    transition={{ duration: 0.25 }}
                    style={{ position: "absolute", height: "22px" }}
                  >
                    <CloudIcon />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
            <Button style={{ width: "2.8rem", height: "2.8rem" }}>
              <SettingsIcon />
            </Button>
          </div>
          <div
            style={{ marginRight: "2.3rem", padding: "8px" }}
            className="btn"
            onClick={handleProfileOpen}
            ref={imageRef}
          >
            <img
              style={{ display: "block", userSelect: "none" }}
              className="profile-image"
              src={image}
              alt="pfp"
            />
          </div>
          {/* <button onClick={signOut}>s</button> */}
        </nav>
      )}
    </>
  );
};

export default memo(Navbar);
