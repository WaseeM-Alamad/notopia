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
    floatingBtnRef,
    isActionModalOpenRef,
  } = useAppContext();
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const nav = document.querySelector("nav");
    const floatingBtn = floatingBtnRef?.current;
    const info = dialogInfo ?? "".trim();
    if (info) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      if (nav) nav.style.paddingRight = `${scrollbarWidth}px`;
      if (floatingBtn) floatingBtn.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.removeAttribute("style");
      if (floatingBtn) floatingBtn.style.removeProperty("padding-right");
      if (nav) nav.style.removeProperty("padding-right");
    }
    return () => {
      document.body.removeAttribute("style");
      if (floatingBtn) floatingBtn.style.removeProperty("padding-right");
      if (nav) nav.style.removeProperty("padding-right");
    };
  }, [dialogInfo]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
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
        if (e.target === containerRef.current) setDialogInfo(null);
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
    </motion.div>,
    document.getElementById("modal-portal")
  );
};

export default memo(ActionModal);
