import React, { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

const SetLabelModal = ({ showCloseBtn = false, setIsOpen, labelObj }) => {
  const { closeToolTip, hideTooltip, showTooltip } = useAppContext();
  const [isMounted, setIsMounted] = useState(false);
  const [label, setLabel] = useState(labelObj?.label);
  const { updateLabel, labelsRef } = useAppContext();
  const containerRef = useRef(null);
  const initialLabel = labelObj?.label;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const checkExistence = () => {
    for (const labelData of labelsRef.current.values()) {
      if (label.toLowerCase() === labelData.label.toLowerCase()) {
        return true;
      }
    }
    return false;
  };

  const updateHash = () => {
    const encodedLabel = encodeURIComponent(label.trim());
    window.location.hash = `label/${encodedLabel.toLowerCase()}`;
  };

  if (!isMounted) return;

  return createPortal(
    <motion.div
      ref={containerRef}
      className="modal-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: {
          type: "tween",
          duration: 0.15,
          ease: "linear",
        },
      }}
      onClick={(e) => {
        if (e.target === containerRef.current) {
          setIsOpen(false);
          console.log("yes");
        }
      }}
    >
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
      >
        {showCloseBtn && (
          <div
            style={{ top: ".5rem", right: "0.7rem" }}
            onClick={() => {
              closeToolTip();
            }}
            onMouseEnter={(e) => showTooltip(e, "Close")}
            onMouseLeave={hideTooltip}
            className="clear-icon btn small-btn"
          />
        )}
        <div
          className="action-title"
          style={{ marginBottom: "1.2rem", userSelect: "none" }}
        >
          Update label
        </div>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={50}
          placeholder="Enter label"
          className="form-input"
          style={{
            minHeight: "2.5rem",
            backgroundColor: "var(--btn-hover)",
            border: "var(--border)",
            color: "var(--text)",
          }}
        />
        <div
          style={{
            fontSize: ".8rem",
            color: "var(--text2)",
            textAlign: "end",
            marginRight: "0.4rem",
            marginBottom: ".5rem",
            userSelect: "none",
          }}
        >
          {50 - label.length} characters left
        </div>
        <div className="buttons-con">
          <button
            className="action-modal-bottom-btn action-cancel"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </button>
          <button
            className="action-modal-bottom-btn action-blue"
            disabled={label.length === 0}
            onClick={() => {
              const noChange = initialLabel.trim() === label.trim();
              const alreadyExists = checkExistence();

              if (!noChange && !alreadyExists) {
                updateHash();
                updateLabel(labelObj.uuid, label.trim());
              }
              setIsOpen(false);
            }}
          >
            Update
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.getElementById("modal-portal")
  );
};

export default memo(SetLabelModal);
