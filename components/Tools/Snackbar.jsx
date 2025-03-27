import React, { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";
import XIcon from "../icons/XIcon";

const Snackbar = ({
  snackbarState,
  setSnackbarState,
  undo,
  unloadWarn,
  setUnloadWarn,
  setTooltipAnchor,
  onClose,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const timeoutRef = useRef(null);
  useEffect(() => {
    if (snackbarState.snackOpen) {
      timeoutRef.current = setTimeout(
        () => {
          setSnackbarState((prev) => ({
            ...prev,
            snackOpen: false,
          }));
          if (snackbarState.showUndo) {
            onClose.current();
          }
        },
        snackbarState.showUndo ? 6000 : 4000
      );
    } else {
      if (unloadWarn) {
        setUnloadWarn(false);
      }
      clearTimeout(timeoutRef.current);
      undo.current = () => {};
      onClose.current = () => {};
    }
  }, [snackbarState.snackOpen]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const openActionUndone = () => {
    setSnackbarState((prev) => ({
      ...prev,
      snackOpen: false,
    }));

    setTimeout(() => {
      setSnackbarState({
        message: "Action undone",
        showUndo: false,
        snackOpen: true,
      });
    }, 80);
  };

  if (!isMounted) return;

  return createPortal(
    <>
      <motion.div
        initial={{ display: "none", y: 10, opacity: 0 }}
        animate={{
          opacity: snackbarState.snackOpen ? 1 : 0,
          y: snackbarState.snackOpen ? 0 : 10,
          display: snackbarState.snackOpen ? "flex" : "none",
        }}
        exit={{ display: "none", y: 10, opacity: 0 }}
        transition={{
          display: { duration: 0.1 },
          y: { type: "spring", stiffness: 1000, damping: 50, mass: 1 },
          opacity: { type: "spring", stiffness: 1000, damping: 50, mass: 1 },
        }}
        className="snackbar"
      >
        <div style={{ cursor: "default" }}>{snackbarState.message}</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
          {snackbarState.showUndo && (
            <button
              className="undo-btn"
              onClick={() => {
                undo.current();
                openActionUndone();
              }}
            >
              Undo
            </button>
          )}
          <Button
            onMouseEnter={(e) => handleMouseEnter(e, "Dismiss")}
            onMouseLeave={handleMouseLeave}
            onClick={() => {
              setSnackbarState((prev) => ({
                ...prev,
                snackOpen: false,
              }));
              setTooltipAnchor((prev) => ({
                anchor: null,
                text: prev?.text,
              }));
              if (snackbarState.showUndo) {
                onClose.current();
              }
            }}
          >
            <XIcon color="white" />
          </Button>
        </div>
      </motion.div>
    </>,
    document.getElementById("snackbarPortal")
  );
};

export default memo(Snackbar);
