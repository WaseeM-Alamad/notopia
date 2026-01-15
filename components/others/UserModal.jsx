import React, { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import GalleryCarousel from "./GalleryCarousel";

const UserModal = ({ setUser, user }) => {
  const { closeToolTip, hideTooltip, showTooltip, isActionModalOpenRef } =
    useAppContext();
  const [isMounted, setIsMounted] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);

  const canDelete = user?.canDelete;
  const isOwnUser = user?.isOwnUser;
  const isOwner = user?.isOwner;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setUser(null);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    isActionModalOpenRef.current = true;
    return () => (isActionModalOpenRef.current = false);
  }, []);

  if (!isMounted) return;

  return createPortal(
    <>
      <motion.div
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
        style={{ zIndex: "999" }}
        onClick={() => setUser(null)}
      />
      <motion.div
        className="action-modal"
        initial={{
          transform: "translate(-50%, -40%) scale(0.97)",
          opacity: 0,
        }}
        animate={{
          transform: "translate(-50%, -40%) scale(1)",
          opacity: 1,
        }}
        exit={{
          transform: "translate(-50%, -40%) scale(0.97)",
          opacity: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 40,
          mass: 1.05,
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: "1000",
          padding: "1.7rem 1rem",
          paddingBottom: canDelete && "1.1rem",
        }}
      >
        <div
          style={{ top: ".7rem", right: "1rem" }}
          onClick={() => {
            closeToolTip();
            setUser(null);
          }}
          onMouseEnter={(e) => showTooltip(e, "Close")}
          onMouseLeave={hideTooltip}
          className="clear-icon btn small-btn"
        />
        <div
          onClick={() => setIsImageOpen(true)}
          className="collab-dialog-img-wrapper"
        >
          <div className="acc-img-hv" />
          <img
            className="collab-dialog-img"
            src={user.image}
            draggable={false}
            loading="lazy"
          />
        </div>
        <div
          className="action-title"
          style={{
            marginBottom: "0.1rem",
            marginTop: ".7rem",
            fontSize: "1.2rem",
            userSelect: "none",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user?.displayName}
        </div>

        <div
          className="action-msg"
          style={{
            marginBottom: ".6rem",
            fontSize: "14px",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user.username}
        </div>
        <div
          className="action-msg"
          style={{
            marginBottom: "0",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <div className="date-icon" style={{ whiteSpace: "nowrap" }}>
            Member since January 2024
          </div>
        </div>

        <div
          className="label-wrapper"
          style={{
            borderColor: "var(--border) !important",
            marginTop: "0.6rem",
            padding: ".4rem 0.55rem",
            cursor: "default",
          }}
        >
          <span
            style={{
              fontSize: ".8rem",
              fontWeight: "500",
            }}
          >
            {isOwner ? "Owner" : isOwnUser ? "You" : "Collaborator"}
          </span>
        </div>

        {canDelete && (
          <div
            className="action-btns-container"
            style={{ marginTop: "1.6rem", display: "flex", gap: "0" }}
          >
            <button
              type="button"
              className="action-modal-bottom-btn action-cancel"
              style={{ padding: "0", width: "100%" }}
              onClick={() => setUser(null)}
            >
              Close
            </button>
            <button
              style={{
                backgroundColor: "var(--error)",
                padding: "0",
                width: "100%",
              }}
              className="action-modal-bottom-btn"
              onClick={() => {
                setUser(null);
                user?.handleRemoveCollab();
              }}
            >
              Remove {user.isOwnUser ? " Self" : ""}
            </button>
          </div>
        )}
      </motion.div>
      <AnimatePresence>
        {isImageOpen && (
          <GalleryCarousel
            isAvatar={true}
            images={[{ url: user.image }]}
            setIsOpen={setIsImageOpen}
          />
        )}
      </AnimatePresence>
    </>,
    document.getElementById("modal-portal")
  );
};

export default memo(UserModal);
