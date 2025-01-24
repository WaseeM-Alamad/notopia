import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";
import React, { forwardRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Edit } from "../icons/EditIcon";

const ProfileModal = forwardRef(({ user, isOpen, menuPosition }, ref) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
                  <div className="img-edit-icon">
                    {" "}
                    <Edit width="11px" height="11px" />{" "}
                  </div>
                </div>
                <span style={{ margin: "auto 0", color: "rgb(56, 56, 56)" }}>
                  {user.name}
                </span>
              </div>
            </div>
            <div className="menu-buttons">
              <div className="menu-btn">Account Settings</div>
              <div className="menu-btn">Dark theme</div>
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

export default ProfileModal;
