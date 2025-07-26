import React, { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

const DeleteModal = ({ setIsOpen, handleDelete, title, message }) => {
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
        if (e.target === containerRef.current) setIsOpen(false);
      }}
    >
      <motion.div
        className="delete-modal"
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
        <div
          style={{
            // padding: "2rem",
            boxSizing: "border-box",
            fontWeight: "600",
            fontSize: "1.5rem",
            paddingBottom: ".3rem",
          }}
        >
          {title}
        </div>
        <div style={{ textAlign: "center", fontSize: ".95rem" }}>{message}</div>
        <div className="buttons-con">
          <button
            className="delete-modal-button"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </button>
          <button
            className="delete-modal-button delete-btn"
            onClick={() => {
              handleDelete();
              setIsOpen(false);
            }}
            style={{ color: "#ffffff" }}
          >
            {" "}
            Delete{" "}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.getElementById("modal-portal")
  );
};

export default memo(DeleteModal);
