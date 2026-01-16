import React, { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

const ActionModal = ({
  setDialogInfo,
  dialogInfo,
  func,
  cancelFunc = () => {},
  showCloseBtn = false,
  title,
  message,
  btnMsg,
  cancelBtnMsg = "Cancel",
}) => {
  const {
    closeToolTip,
    hideTooltip,
    showTooltip,
    isActionModalOpenRef,
    lockScroll,
  } = useAppContext();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const isOpen = (dialogInfo ?? "".trim()) !== "";
    lockScroll(isOpen);

    return () => lockScroll(false);
  }, [dialogInfo]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        cancelFunc();
        setDialogInfo(null);
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
    <div className={showCloseBtn ? "show-close-btn" : ""}>
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
        onClick={() => {
          cancelFunc();
          setDialogInfo(null);
        }}
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
      >
        {showCloseBtn && (
          <div
            style={{ top: ".5rem", right: "0.7rem" }}
            onClick={() => {
              closeToolTip();
              cancelFunc();
              setDialogInfo(null);
            }}
            onMouseEnter={(e) => showTooltip(e, "Close")}
            onMouseLeave={hideTooltip}
            className="clear-icon btn small-btn"
          />
        )}
        <div className="action-title">{title}</div>
        <div className="action-msg">{message}</div>
        <div className="action-btns-container">
          <button
            className="action-modal-bottom-btn action-cancel"
            onClick={() => {
              cancelFunc();
              setDialogInfo(null);
            }}
          >
            {cancelBtnMsg}
          </button>
          <button
            className="action-modal-bottom-btn"
            onClick={() => {
              func();
              setDialogInfo(null);
            }}
          >
            {" "}
            {btnMsg}{" "}
          </button>
        </div>
      </motion.div>
    </div>,
    document.getElementById("modal-portal")
  );
};

export default memo(ActionModal);
