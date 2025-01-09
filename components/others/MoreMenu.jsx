import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MoreMenu = ({ isOpen, setIsOpen ,menuPosition, buttonRef }) => {
  const [isClient, setIsClient] = useState();
  const menuRef = useRef(null);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
      const handler = (e) => {
        if (
          !menuRef.current?.contains(e.target) &&
          !buttonRef?.current?.contains(e.target)
        )
        if (isOpen){
          setIsOpen(false);
        }
      };
  
      document.addEventListener("click", handler);
  
      return () => document.removeEventListener("click", handler);
    }, [isOpen]);

  if (!isClient) return;
  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 5 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{
                y: {
                  type: "spring",
                  stiffness: 900,
                  damping: 50,
                  mass: 1,
                },
                opacity: { duration: 0.2 },
              }}
            style={{
              top: `${menuPosition.top + 35}px`,
              left: `${menuPosition.left}px`,
              width: "fit-content",
              borderRadius: "0.4rem",
            }}
            ref={menuRef}
            className="menu"
          >
            <div className="menu-buttons">
              <div style={{ padding: "0.6rem 2rem 0.6rem 1rem", fontSize: "0.9rem" }} className="menu-btn">
                Delete note
              </div>
              <div style={{ padding: "0.6rem 2rem 0.6rem 1rem", fontSize: "0.9rem" }} className="menu-btn">
                Add label
              </div>
              <div style={{ padding: "0.6rem 2rem 0.6rem 1rem", fontSize: "0.9rem" }} className="menu-btn">
                Make a copy
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.getElementById("moreMenu")
  );
};

export default MoreMenu;
