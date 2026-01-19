import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import React, { forwardRef, memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppContext } from "@/context/AppContext";
import { useGlobalContext } from "@/context/GlobalContext";

const ProfileMenu = ({
  user,
  imageRef,
  menuPosition,
  isOpen,
  setIsOpen,
  setSettingsOpen,
  setBindsOpen,
}) => {
  const { isDarkModeRef } = useGlobalContext();
  const [isClient, setIsClient] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (
        !menuRef.current.contains(e.target) &&
        !imageRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const toggleDarkMode = () => {
    requestIdleCallback(() => {
      document.documentElement.classList.toggle("dark-mode");
      const newMode = document.documentElement.classList.contains("dark-mode")
        ? "dark"
        : "light";
      localStorage.setItem("theme", newMode);
      isDarkModeRef.current = newMode === "dark";
    });
    setIsOpen(false);
  };

  if (!isClient) {
    return null;
  }

  const topMenuItems = [
    {
      title: "Account",
      classes: "profile-menu-icon",
      func: () => {
        setSettingsOpen(true);
        setIsOpen(false);
      },
    },
    {
      title: `${!isDarkModeRef.current ? "Dark theme" : "Light theme"}`,
      classes: "theme-menu-icon",
      func: () => {
        toggleDarkMode();
      },
    },
    {
      title: "Keyboard shortcuts",
      classes: "keyboard-menu-icon",
      func: () => {
        setBindsOpen(true);
        setIsOpen(false);
      },
    },
  ];

  const bottomMenuItems = [
    {
      title: "Send feedback",
      classes: "feedback-menu-icon",
      func: () => {},
    },
    {
      title: "Sign out",
      classes: "signout-menu-icon",
      func: () => {
        signOut();
      },
    },
  ];

  return createPortal(
    <>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 1, y: -5, pointerEvents: "auto" }}
        animate={{ opacity: 1, scale: 1, y: 0, pointerEvents: "auto" }}
        exit={{ opacity: 0, scale: 1, y: -3, pointerEvents: "none" }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          mass: 0.6,
        }}
        style={{
          zIndex: "110",
          position: "fixed",
          top: `${menuPosition.top + 50}px`,
          left: `${menuPosition.left - 175}px`,
          pointerEvents: !isOpen && "none",
        }}
        className="profile-menu menu-border"
      >
        <div
          onClick={() => {
            setSettingsOpen(true);
            setIsOpen(false);
          }}
          className="menu-upper-section"
        >
          <div style={{ width: "100%", display: "flex" }}>
            <div
              className="profile-image-wrapper"
              style={{
                position: "relative",
                width: "fit-content",
                marginRight: "0.6rem",
              }}
            >
              <img className="profile-image" src={user?.image} alt="pfp" />
              <div className="img-edit-icon" />
            </div>
            <span dir="auto" className="username">
              {user.displayName}
            </span>
          </div>
        </div>
        <div className="">
          {topMenuItems.map(({ title, classes, func }) => (
            <button
              key={classes}
              className={`profile-menu-btn ${classes}`}
              onClick={func}
            >
              {title}
            </button>
          ))}
        </div>
        <div className="menu-divider" />
        {bottomMenuItems.map(({ title, classes, func }) => (
          <button
            key={classes}
            className={`profile-menu-btn ${classes}`}
            onClick={func}
          >
            {title}
          </button>
        ))}
      </motion.div>
    </>,
    document.getElementById("menu")
  );
};

export default memo(ProfileMenu);
