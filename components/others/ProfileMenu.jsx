import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";
import React, { forwardRef, memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Edit } from "../icons/EditIcon";
import { useAppContext } from "@/context/AppContext";

const ProfileMenu = forwardRef(
  ({ user, isOpen, setIsOpen, menuPosition, setSettingsOpen }, ref) => {
    const { isDarkModeRef } = useAppContext();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    const toggleDarkMode = () => {
      document.documentElement.classList.toggle("dark-mode");
      const newMode = document.documentElement.classList.contains("dark-mode")
        ? "dark"
        : "light";
      localStorage.setItem("theme", newMode);
      isDarkModeRef.current = newMode === "dark";
      setIsOpen(false);
    };

    if (!isClient) {
      return null;
    }
    return createPortal(
      <>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0.985 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{
                scale: {
                  type: "spring",
                  stiffness: 700,
                  damping: 50,
                  mass: 1,
                },
                opacity: { duration: 0.2 },
              }}
              style={{
                position: "fixed",
                top: `${menuPosition.top + 50}px`,
                left: `${menuPosition.left - 165}px`,
                pointerEvents: !isOpen && "none",
              }}
              ref={ref}
              className="menu menu-border"
            >
              <div style={{}} className="menu-upper-section">
                <div style={{ width: "100%", display: "flex" }}>
                  <div
                    onClick={() => {
                      setSettingsOpen(true);
                      setIsOpen(false);
                    }}
                    className="profile-image-wrapper"
                    style={{
                      position: "relative",
                      width: "fit-content",
                      marginRight: "0.6rem",
                    }}
                  >
                    <img
                      className="profile-image"
                      src={user?.image}
                      alt="pfp"
                    />
                    <div className="img-edit-icon" />
                  </div>
                  <span dir="auto" className="username">
                    {user.name}
                  </span>
                </div>
              </div>
              <div className="menu-buttons">
                <div
                  onClick={() => {
                    setSettingsOpen(true);
                    setIsOpen(false);
                  }}
                  className="menu-btn"
                >
                  <div className="profile-icon" />
                  Account Settings
                </div>
                <div onClick={toggleDarkMode} className="menu-btn">
                  <div className="theme-icon" />
                  {`${!isDarkModeRef.current ? "Dark theme" : "Light theme"}`}
                </div>
                <div className="menu-btn">
                  <div className="keyboard-icon" /> Keyboard shortcuts
                </div>
                <div
                  onClick={() => signOut()}
                  className="menu-btn warning-color"
                >
                  <div className="signout-icon" />
                  Sign out
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>,
      document.getElementById("menu")
    );
  }
);

export default memo(ProfileMenu);
