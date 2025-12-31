import React, { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";
import XIcon from "../icons/XIcon";
import { useAppContext } from "@/context/AppContext";

const Snackbar = ({
  snackbarState,
  setSnackbarState,
  undo,
  unloadWarn,
  noActionUndone,
  setNoActionUndone,
  setUnloadWarn,
  onClose,
}) => {
  const { showTooltip, hideTooltip, closeToolTip } = useAppContext();
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
          // if (snackbarState.showUndo) {
          onClose.current();
          // }
        },
        snackbarState.showUndo ? 6000 : 4000
      );
    } else {
      setUnloadWarn(false);
      clearTimeout(timeoutRef.current);
      onClose.current = () => {};
    }
  }, [snackbarState.snackOpen]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
                if (noActionUndone) return;
                openActionUndone();
              }}
            >
              {noActionUndone ? "Restore" : "Undo"}
            </button>
          )}
          <Button
            onMouseEnter={(e) => showTooltip(e, "Dismiss")}
            onMouseLeave={hideTooltip}
            onClick={() => {
              closeToolTip();
              setSnackbarState((prev) => ({
                ...prev,
                snackOpen: false,
              }));

              onClose.current();
            }}
            className="snack-clear-icon"
          />
        </div>
      </motion.div>
    </>,
    document.getElementById("snackbarPortal")
  );
};

export default memo(Snackbar);
