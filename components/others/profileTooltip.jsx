import { useAppContext } from "@/context/AppContext";
import { useLabelsContext } from "@/context/LabelsContext";
import { Popper } from "@mui/material";
import { motion } from "framer-motion";
import React from "react";
import { createPortal } from "react-dom";

const ProfileTooltip = ({ tooltipTop }) => {
  const { user, notesStateRef } = useAppContext();
  const { labelsRef } = useLabelsContext();

  return createPortal(
    <motion.div
      initial={{
        transform: `translateX(-7px) translateY(5px) scale(0.97)`,
        opacity: 0,
      }}
      animate={{
        transform: `translateX(-7px) translateY(8px) scale(1)`,
        opacity: 1,
      }}
      exit={{
        transform: `translateX(-7px) translateY(5px) scale(0.97)`,
        opacity: 0,
      }}
      transition={{
        type: "spring",
        stiffness: 600,
        damping: 40,
        mass: 1.05,
      }}
      style={{ top: `${tooltipTop}px` }}
      className="profile-tooltip"
    >
      <div
        dir="auto"
        style={{
          minWidth: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        <span style={{ fontSize: "0.85rem" }}>Notopia account</span>
        <div
          style={{
            opacity: "0.7",
            paddingTop: "0.2rem",
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {user?.username}
          <br />
          {notesStateRef.current.notes.size} Notes
          <br />
          {labelsRef.current.size} Labels
        </div>
      </div>
    </motion.div>,
    document.getElementById("tooltipPortal"),
  );
};

export default ProfileTooltip;
