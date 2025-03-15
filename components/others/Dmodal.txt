import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "@/assets/styles/note.css";
import "@/assets/styles/modal.css";
import { motion } from "framer-motion";

const DeleteModal = ({ setIsOpen, handleDelete, message }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return;

  return createPortal(
    <motion.div
      className="modal-container"
      initial={{ backgroundColor: "rgba(0,0,0,0.0)" }}
      animate={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      exit={{ backgroundColor: "rgba(0,0,0,0.0)" }}
      transition={{
        backgroundColor: {
          type: "tween",
          duration: 0.01,
          ease: "linear",
        },
      }}
      onClick={(e) => {
        if (e.target.classList.contains("modal-container")) setIsOpen(false);
      }}
    >
      <motion.div
        className="delete-modal"
        initial={{ transform: "translate(-50%, -45%) scale(1.05)", opacity: 0 }}
        animate={{ transform: "translate(-50%, -45%) scale(1)", opacity: 1 }}
        exit={{ transform: "translate(-50%, -45%) scale(1.05)", opacity: 0 }}
        transition={{
          transform: { type: "spring", stiffness: 1000, damping: 50, mass: 1 },
          opacity: { duration: 0.1 },
        }}
      >
        <span
          style={{
            paddingBottom: "2rem",
            userSelect: "none",
            fontSize: "0.9rem",
          }}
        >
          {message}
        </span>
        <div
          style={{
            width: "100%",
            marginTop: "auto",
            display: "flex",
            justifyContent: "flex-end",
            gap: "2rem",
            boxSizing: "border-box",
            padding: "0 0.3rem",
          }}
        >
          <button
            className="delete-modal-button"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </button>
          <button
            className="delete-modal-button"
            style={{ color: "rgb(255, 93, 93)" }}
            onClick={() => {
              handleDelete();
              setIsOpen(false);
            }}
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.getElementById("deleteModal")
  );
};

export default DeleteModal;
