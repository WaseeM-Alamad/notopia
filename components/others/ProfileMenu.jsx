import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";
import React, { forwardRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Edit } from "../icons/EditIcon";

const ProfileMenu = forwardRef(({ user, isOpen, menuPosition }, ref) => {
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark-mode");
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark-mode");
    const newMode = document.documentElement.classList.contains("dark-mode")
      ? "dark"
      : "light";
    localStorage.setItem("theme", newMode);
    setIsDarkMode(newMode === "dark")
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
              left: `${menuPosition.left - 145}px`,
            }}
            ref={ref}
            className="menu"
          >
            <div style={{}} className="menu-upper-section">
              <div style={{ width: "100%", display: "flex" }}>
                <div
                  className="profile-image-wrapper"
                  style={{
                    position: "relative",
                    width: "fit-content",
                    marginRight: "0.6rem",
                  }}
                >
                  <img
                    style={{ display: "block", userSelect: "none" }}
                    className="profile-image"
                    src={user?.image}
                    alt="pfp"
                  />
                  <div className="img-edit-icon"/>
                </div>
                <span className="username">
                  {user.name}
                </span>
              </div>
            </div>
            <div className="menu-buttons">
              <div className="menu-btn">Account Settings</div>
              <div onClick={toggleDarkMode} className="menu-btn">
                {`${!isDarkMode? "Dark theme": "Light theme"}`}
              </div>
              <div className="menu-btn">Profile</div>
              <div onClick={() => signOut()} className="menu-btn">
                Sign out
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.getElementById("profileMenu")
  );
});

export default ProfileMenu;
