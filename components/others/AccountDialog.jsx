import React, { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import PhotoSettings from "./PhotoSettings";
import AccountSettings from "./AccountSettings";
import SecuritySettings from "./SecuritySettings";
import DeleteAccSettings from "./DeleteAccSettings";
import { useAppContext } from "@/context/AppContext";
import MoreMenu from "./MoreMenu";

const AccountDialog = ({ settingsRef, setIsOpen, user, setUser }) => {
  const { showTooltip, hideTooltip, closeToolTip, isExpanded } =
    useAppContext();
  const [isMounted, setIsMounted] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const containerRef = useRef(null);

  const [selectedSection, setSelectedSection] = useState(0);
  const [selectMenuOpen, setSelectMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth > 681) {
        setIsSmallScreen(false);
      } else {
        setIsSmallScreen(true);
      }
    };

    handler();

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const sectionsBtns = [
    { icon: "settings-profile-icon", title: "Profile Photo" },
    { icon: "settings-email-icon", title: "Account Info" },
    { icon: "settings-security-icon", title: "Security" },
    { icon: "settings-warning-icon", title: "Delete Account" },
  ];

  const menuItems = [
    {
      title: "Unpin label",
      function: ()=> {},
      icon: "unpin-menu-icon",
    },
    {
      title: "Navigate",
      function: ()=> {},
      icon: "nav-menu-icon",
    },
  ];

  const sections = [
    PhotoSettings,
    AccountSettings,
    SecuritySettings,
    DeleteAccSettings,
  ];

  const rightHeader = () => {
    switch (selectedSection) {
      case 0:
        return { title: "Profile Photo", desc: "Update your profile picture." };
      case 1:
        return {
          title: "Account Information",
          desc: "Update your account details.",
        };
      case 2:
        return { title: "Security", desc: "Change your account password." };
      case 3:
        return {
          title: "Delete Account",
          desc: "Permanently delete your account and all associated data.",
        };
      default:
        return {
          title: "Delete Account",
          desc: "Permanently delete your account and all associated data.",
        };
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return;

  return createPortal(
    <>
      <motion.div
        ref={containerRef}
        className="overlay"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
          pointerEvents: "none",
          display: "none",
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 50,
          mass: 1,
        }}
        onClick={(e) => {
          if (e.target === containerRef.current) setIsOpen(false);
        }}
      />
      <motion.div
        ref={settingsRef}
        initial={{
          transform: "translate(-50%, -45%) scale(0.97)",
          opacity: 0,
        }}
        animate={{
          transform: "translate(-50%, -45%) scale(1)",
          opacity: 1,
        }}
        exit={{
          transform: "translate(-50%, -45%) scale(0.97)",
          opacity: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 40,
          mass: 1.05,
        }}
        className="acc-settings-container"
      >
        <div
          onClick={() => {
            closeToolTip();
            setIsOpen(false);
          }}
          onMouseEnter={(e) => showTooltip(e, "Close")}
          onMouseLeave={hideTooltip}
          className="clear-icon btn small-btn"
        />
        <div className="settings-left-panel">
          <div className="account-left-section-header">Settings</div>
          <div className="settings-section-container">
            {isExpanded.threshold === "before" && (
              <div
                onClick={(e) => {
                  setAnchorEl(e.currentTarget);
                  setSelectMenuOpen((prev) => !prev);
                }}
                className={`select-menu option-styling ${sectionsBtns[selectedSection].icon}`}
              >
                <span>{sectionsBtns[selectedSection].title}</span>
              </div>
            )}
            {isExpanded.threshold === "after" ? (
              <motion.div
                animate={{
                  transform: `translateY(${(isSmallScreen ? 45 : 40) * selectedSection}px)`,
                }}
                transition={{
                  type: "spring",
                  stiffness: 800,
                  damping: 40,
                  mass: 0.5,
                }}
                className="settings-section-selector"
              />
            ) : (
              <div></div>
            )}
            {isExpanded.threshold === "after" &&
              sectionsBtns.map(({ icon, title }, index) => {
                const selected = selectedSection === index;
                return (
                  <div
                    key={title}
                    onClick={() => setSelectedSection(index)}
                    style={{ color: selected ? "#6b8ffc" : "" }}
                    className="settings-section-btn"
                  >
                    <div
                      className={`settings-section-icon ${
                        icon + (selected ? "-selected" : "")
                      }`}
                    />
                    <span className="account-section-title">{title}</span>
                  </div>
                );
              })}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "100%",
          }}
        >
          <div className="settings-right-panel">
            {sections.map((Component, index) => {
              const selected = index === selectedSection;
              return (
                <Component
                  key={index}
                  selected={selected}
                  rightHeader={rightHeader}
                  user={user}
                  setUser={setUser}
                />
              );
            })}
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {isExpanded.threshold === "before" && selectMenuOpen && (
          <MoreMenu
            setIsOpen={setSelectMenuOpen}
            anchorEl={anchorEl}
            isOpen={selectMenuOpen}
            menuItems={sectionsBtns}
            transformOrigin="top"
            className='option-styling'
          />
        )}
      </AnimatePresence>
    </>,
    document.getElementById("modal-portal")
  );
};

export default memo(AccountDialog);
