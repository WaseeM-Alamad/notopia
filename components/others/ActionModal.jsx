import React, { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

const ActionModal = ({
  setDialogInfo,
  func,
  cancelFunc = () => {},
  showCloseBtn = false,
  title,
  message,
  btnMsg,
  cancelBtnMsg = "Cancel",
}) => {
  const { closeToolTip, hideTooltip, showTooltip } = useAppContext();
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return;

  return createPortal(
    <motion.div
      ref={containerRef}
      className="modal-container"
      initial={{ backgroundColor: "rgba(0,0,0,0.0)", pointerEvents: "auto" }}
      animate={{ backgroundColor: "rgba(0,0,0,0.5)", pointerEvents: "auto" }}
      exit={{ backgroundColor: "rgba(0,0,0,0.0)" }}
      onAnimationComplete={(def) => {
        if (def.backgroundColor === "rgba(0,0,0,0.0)") {
          containerRef.current.style.pointerEvents = "none";
        }
      }}
      transition={{
        backgroundColor: {
          type: "tween",
          duration: 0.03,
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
        <div className="buttons-con">
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
            className="action-modal-bottom-btn action-blue"
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
