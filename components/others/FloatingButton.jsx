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
      initial={{ bottom: -50 }}
      animate={{ bottom: 25.6 }}
      exit={{ bottom: -50 }}
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
        className="add-btn"
        style={{ margin: 0 }}
        onMouseEnter={showSideTooltip}
        onMouseLeave={hideSideTooltip}
      >
        <AddButton />
      </button>{" "}
    </motion.div>,
    document.getElementById("menu")
  );
};

export default FloatingButton;
