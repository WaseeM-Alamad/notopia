"use client";
import React, { memo, useEffect, useRef, useState } from "react";
import "@/assets/styles/navbar.css";
import { signOut } from "next-auth/react";
import RefreshIcon from "../icons/RefreshIcon";
import SettingsIcon from "../icons/SettingsIcon";
import GridIcon from "../icons/GridIcon";
import { CircularProgress, IconButton } from "@mui/material";
import { usePathname } from "next/navigation";
import { Box } from "@mui/system";
import CloudIcon from "../icons/CloudIcon";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "./logo";
import Button from "../Tools/Button";

const Navbar = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [UpToDatetrigger, setUpToDateTrigger] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const image = user?.image;
  const pathName = usePathname();
  const firstRun = useRef(true);

  useEffect(() => {
    const startLoading = () => setIsLoading(true);
    const stopLoading = () => setIsLoading(false);

    // Listen for custom events
    window.addEventListener("loadingStart", startLoading);
    window.addEventListener("loadingEnd", stopLoading);

    return () => {
      window.removeEventListener("loadingStart", startLoading);
      window.removeEventListener("loadingEnd", stopLoading);
    };
  }, []);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!isLoading) {
      setUpToDateTrigger(false);
      setTimeout(() => {
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
        const message = "Your request is still in progress. Are you sure you want to leave?";
        event.returnValue = message; // Standard for most browsers
        return message; // For some browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLoading]);

  const handleRefresh = () => {
    if (!isLoading && UpToDatetrigger)
      window.dispatchEvent(new Event("refresh"));
  };

  return (
    <>
      {pathName !== "/" && (
        <nav
          style={{
            boxShadow: isScrolled ? "0 3px 10px rgba(0, 0, 0, 0.2)" : "",
          }}
        >
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
                        sx={{ color: "#7A7A7A" }}
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
          <div>
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
