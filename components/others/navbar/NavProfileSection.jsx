import { useAppContext } from "@/context/AppContext";
import React, { useEffect, useRef, useState } from "react";
import ProfileMenu from "../ProfileMenu";
import { AnimatePresence } from "framer-motion";
import KeybindsTable from "../KeybindsTable";
import AccountDialog from "../AccountDialog";
import ProfileTooltip from "../profileTooltip";

const NavProfileSection = () => {
  const { user, setBindsOpenRef } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bindsOpen, setBindsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: 100,
    left: 600,
  });
  const [tooltipTop, setTooltipTop] = useState(null);

  const imageRef = useRef(null);

  const image = user?.image;

  useEffect(() => {
    setBindsOpenRef.current = setBindsOpen;
  }, []);

  const handleProfileOpen = () => {
    const rect = imageRef.current?.getBoundingClientRect();
    setMenuPosition({
      top: rect.top,
      left: rect.left,
    });
    setIsMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handler = () => {
      if (isMenuOpen) {
        const rect = imageRef.current?.getBoundingClientRect();
        setMenuPosition({
          top: rect.top,
          left: rect.left,
        });
      }
    };

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [isMenuOpen]);

  const tooltipTimeoutRef = useRef(null);
  const tooltipCloseTimeoutRef = useRef(null);

  return (
    <>
      <div className="nav-img-wrapper">
        <div
          tabIndex={0}
          style={{ padding: "8px", opacity: "1" }}
          className="btn"
          onClick={handleProfileOpen}
          ref={imageRef}
          onMouseEnter={(e) => {
            clearTimeout(tooltipCloseTimeoutRef.current);
            const rect = e.currentTarget.getBoundingClientRect();
            tooltipTimeoutRef.current = setTimeout(() => {
              setTooltipTop(rect.bottom);
            }, 400);
          }}
          onMouseDown={() => {
            clearTimeout(tooltipTimeoutRef.current);
            setTooltipTop(null);
          }}
          onMouseLeave={() => {
            clearTimeout(tooltipTimeoutRef.current);
            tooltipCloseTimeoutRef.current = setTimeout(() => {
              setTooltipTop(null);
            }, 150);
          }}
        >
          <img
            className="profile-image"
            draggable="false"
            src={image}
            alt="pfp"
          />
        </div>
      </div>
      <AnimatePresence>
        {isMenuOpen && (
          <ProfileMenu
            user={user}
            imageRef={imageRef}
            menuPosition={menuPosition}
            isOpen={isMenuOpen}
            setIsOpen={setIsMenuOpen}
            setSettingsOpen={setSettingsOpen}
            setBindsOpen={setBindsOpen}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {settingsOpen && (
          <AccountDialog isOpen={settingsOpen} setIsOpen={setSettingsOpen} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bindsOpen && (
          <KeybindsTable isOpen={bindsOpen} setIsOpen={setBindsOpen} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {tooltipTop && !isMenuOpen && (
          <ProfileTooltip tooltipTop={tooltipTop} />
        )}
      </AnimatePresence>
    </>
  );
};

export default NavProfileSection;
