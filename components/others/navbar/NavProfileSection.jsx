import { useAppContext } from "@/context/AppContext";
import React, { useEffect, useRef, useState } from "react";
import ProfileMenu from "../ProfileMenu";
import { AnimatePresence } from "framer-motion";
import KeybindsTable from "../KeybindsTable";
import AccountDialog from "../AccountDialog";

const NavProfileSection = () => {
  const { user, showTooltip, hideTooltip, closeToolTip, setBindsOpenRef } =
    useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bindsOpen, setBindsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: 100,
    left: 600,
  });

  const imageRef = useRef(null);

  const image = user.image;

  useEffect(() => {
    setBindsOpenRef.current = setBindsOpen;
  }, []);

  const handleProfileOpen = () => {
    closeToolTip();
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

  return (
    <>
      <div className="nav-img-wrapper">
        <div
          style={{ padding: "8px", opacity: "1" }}
          className="btn"
          onClick={handleProfileOpen}
          onMouseEnter={(e) =>
            showTooltip(
              e,
              <>
                <span style={{ fontSize: "0.85rem" }}>Notopia account</span>
                <div style={{ opacity: "0.7", paddingTop: "0.2rem" }}>
                  {user?.username}
                  <br />
                  {user?.email}
                </div>
              </>
            )
          }
          onMouseLeave={hideTooltip}
          ref={imageRef}
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
    </>
  );
};

export default NavProfileSection;
