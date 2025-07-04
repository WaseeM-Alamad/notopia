import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const Modal = ({
  children,
  overlay,
  isOpen,
  setIsOpen = () => {},
  className = "",
  style,
  initial,
  animate,
  exit,
  transition,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
            animate={{
              backgroundColor: overlay ? "rgba(0, 0, 0, 0.5)" : "none",
            }}
            exit={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
            transition={{ duration: 0.05 }}
            onClick={() => setIsOpen(false)}
            className="modal-wrapper modal-overlay"
          >
            <motion.div
              initial={initial}
              animate={animate}
              exit={exit}
              transition={transition}
              onClick={(e) => e.stopPropagation()}
              style={style}
              className={`modal-content ${className}`}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.getElementById("modal-portal")
  );
};

export default Modal;
