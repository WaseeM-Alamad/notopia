import ArchiveIcon from "@/components/icons/ArchiveIcon";
import Bell from "@/components/icons/Bell";
import ColorIcon from "@/components/icons/ColorIcon";
import MoreVert from "@/components/icons/MoreVert";
import PinIcon from "@/components/icons/PinIcon";
import XIcon from "@/components/icons/XIcon";
import Button from "@/components/Tools/Button";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef } from "react";

const TopMenuHome = ({
  selectedNotesIDs,
  setSelectedNotesIDs,
  setTooltipAnchor,
}) => {
  const topMenuRef = useRef(null);

  const handleClose = () => {
    setSelectedNotesIDs([]);
    window.dispatchEvent(new Event("topMenuClose"));
  };

  useEffect(() => {
    if (
      selectedNotesIDs.length > 0 &&
      !document
        .querySelector(".notes-container")
        .classList.contains("selected-notes")
    ) {
      document
        .querySelector(".notes-container")
        .classList.add("selected-notes");
    }

    if (selectedNotesIDs.length === 0) {
      document
        .querySelector(".notes-container")
        .classList.remove("selected-notes");
    }

    const handler = (e) => {
      if (
        selectedNotesIDs.length > 0 &&
        !e.target.closest(".note") &&
        !e.target.closest("nav") &&
        !e.target.closest(".top-menu") &&
        !e.target.closest("aside") &&
        !document
          .querySelector(".notes-container")
          .classList.contains("dragging")
      ) {
        handleClose();
      }
    };

    document.addEventListener("click", handler);

    return () => document.removeEventListener("click", handler);
  }, [selectedNotesIDs]);

  const handleMouseEnter = (e, text) => {
    const target = e.currentTarget;
    setTooltipAnchor({ anchor: target, text: text, display: true });
  };

  const handleMouseLeave = () => {
    setTooltipAnchor((prev) => ({
      ...prev,
      display: false,
    }));
  };

  const closeToolTip = () => {
    setTooltipAnchor((prev) => ({
      anchor: null,
      text: prev.text,
    }));
  };

  return (
    <AnimatePresence>
      {selectedNotesIDs.length > 0 && (
        <motion.div
          ref={topMenuRef}
          className="top-menu"
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: selectedNotesIDs.length > 0 ? 1 : 0,
            y: selectedNotesIDs.length > 0 ? 0 : -20,
          }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            opacity: { duration: 0.2, ease: "easeIn" },
            y: { duration: 0.3, stiffness: 120, damping: 20 },
          }}
        >
          <Button
            onClick={handleClose}
            onMouseEnter={(e) => handleMouseEnter(e, "Clear selection")}
            onMouseLeave={handleMouseLeave}
            style={{
              width: "52px",
              height: "52px",
              margin: "0 0.9rem 0 0.8rem",
            }}
          >
            <XIcon />
          </Button>
          <span
            style={{
              fontSize: "1.375rem",
              fontWeight: "500",
              color: "rgb(60,64,67)",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            {selectedNotesIDs.length} Selected
          </span>
          <div className="top-menu-tools">
            <Button style={{ width: "45px", height: "45px" }}>
              <PinIcon size="12.5" color={"transparent"} outline="#3f6fff" />
            </Button>
            <Button style={{ width: "45px", height: "45px" }}>
              <ColorIcon size={20} color="#3f6fff" />
            </Button>
            <Button style={{ width: "45px", height: "45px" }}>
              <ArchiveIcon size={20} color="#3f6fff" />
            </Button>
            <Button style={{ width: "45px", height: "45px" }}>
              <Bell size={20} color="#3f6fff" />
            </Button>
            <Button style={{ width: "45px", height: "45px" }}>
              <MoreVert size={20} color="#3f6fff" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TopMenuHome;
