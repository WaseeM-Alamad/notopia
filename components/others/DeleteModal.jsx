import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "@/assets/styles/note.css";
import "@/assets/styles/modal.css";
import { motion } from "framer-motion";

const DeleteModal = ({ isOpen, setIsOpen, handleDeleteNote }) => {
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
        initial={{ top: "45.9%", opacity: 0 }}
        animate={{ top: "45%", opacity: 1 }}
        exit={{ top: "45.9%", opacity: 0 }}
        transition={{
          top: { type: "spring", stiffness: 1000, damping: 50, mass: 1 },
          opacity: { duration: 0.1 },
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: "45%",
          left: "50%",
          transform: "translate(-50%, -45%)",
          backgroundColor: "white",
          borderRadius: "0.7rem",
          padding: "1.4rem 1rem 0.7rem 1.2rem",
          width: "400px",
        }}
      >
        <span
          style={{
            paddingBottom: "2rem",
            color: "rgb(60,64,67)",
            userSelect: "none",
          }}
        >
          Delete note forever?
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
              handleDeleteNote();
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
