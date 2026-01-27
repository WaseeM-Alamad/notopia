import { useAppContext } from "@/context/AppContext";
import React, { useEffect, useState } from "react";
import AddButton from "../icons/AddButton";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

const FloatingButton = ({ addButtonRef, handleAddNote }) => {
  const { showSideTooltip, hideSideTooltip, floatingBtnRef } = useAppContext();
  return createPortal(
    <motion.div
      ref={floatingBtnRef}
      className="floating-btn"
      initial={{ bottom: -50, opacity: 0 }}
      animate={{ bottom: 40, opacity: 1 }}
      exit={{ bottom: -50, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 800,
        damping: 40,
        mass: 0.5,
      }}
    >
      <button
        ref={addButtonRef}
        onClick={handleAddNote}
        id="add-btn"
        className="add-btn add-btn-sm"
        onMouseEnter={showSideTooltip}
        onMouseLeave={hideSideTooltip}
      >
        <AddButton />
      </button>{" "}
    </motion.div>,
    document.getElementById("menu"),
  );
};

export default FloatingButton;
