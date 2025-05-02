import { Popper } from "@mui/material";
import { motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { v4 as generateUUID } from "uuid";
import ManageLabelsMenu from "./ManageLabelsMenu";

const ModalMenu = ({
  isOpen,
  setIsOpen,
  setModalOpen,
  setLabelsOpen,
  anchorEl,
  trashRef,
  note,
  noteActions,
}) => {
  const [isClient, setIsClient] = useState();

  const menuRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target) && !anchorEl.contains(e.target))
        if (isOpen) {
          setIsOpen(false);
        }
    };

    const handleResize = () => {
      setIsOpen(false);
    };

    document.addEventListener("click", handler);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("click", handler);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  const handleDelete = async (e) => {
    trashRef.current = true;
    setIsOpen(false);
    setModalOpen(false);
  };

  const handleMakeCopy = (e) => {
    noteActions({
      type: "COPY_NOTE",
      setMoreMenuOpen: setIsOpen,
      note: note,
    });
  };

  const containerClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  if (!isClient) return;
  return (
    <>
      <Popper
        open={isOpen}
        anchorEl={anchorEl}
        style={{ zIndex: "999" }}
        placement="bottom-start"
        modifiers={[
          {
            name: "preventOverflow",
            options: {
              boundariesElement: "window",
            },
          },
        ]}
      >
        {isOpen && (
          <motion.div
            onClick={containerClick}
            initial={{ opacity: 0, transform: "scale(0.97)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            exit={{ opacity: 0, transform: "scale(0.97)" }}
            transition={{
              transform: {
                type: "spring",
                stiffness: 1100,
                damping: 50,
                mass: 1,
              },
              opacity: { duration: 0.15 },
            }}
            style={{
              transformOrigin: "top left",
              width: "fit-content",
              borderRadius: "0.4rem",
              maxWidth: "14.0625rem",
              maxHeight: "26.96125rem",
            }}
            ref={menuRef}
            className="menu not-draggable"
          >
            <div className="menu-buttons not-draggable">
              <div
                onClick={handleDelete}
                style={{
                  padding: "0.6rem 2rem 0.6rem 1rem",
                  fontSize: "0.9rem",
                  color: "#3c4043",
                }}
                className="menu-btn n-menu-btn not-draggable"
              >
                Delete note
              </div>
              <div
                style={{
                  padding: "0.6rem 2rem 0.6rem 1rem",
                  fontSize: "0.9rem",
                  color: "#3c4043",
                }}
                className="menu-btn n-menu-btn not-draggable"
                onClick={() => {
                  menuRef.current.style.pointerEvents = "none";
                  setLabelsOpen(true);
                  setIsOpen(false);
                }}
              >
                {note.labels.length === 0 ? "Add label" : "Change labels"}
              </div>
              <div
                style={{
                  padding: "0.6rem 2rem 0.6rem 1rem",
                  fontSize: "0.9rem",
                  color: "#3c4043",
                }}
                className="menu-btn n-menu-btn not-draggable"
                onClick={handleMakeCopy}
              >
                Make a copy
              </div>
            </div>
          </motion.div>
        )}
      </Popper>
    </>
  );
};

export default ModalMenu;
