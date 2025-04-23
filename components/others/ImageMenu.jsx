import { copyNoteAction, undoAction } from "@/utils/actions";
import { Popper } from "@mui/material";
import { motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { v4 as generateUUID } from "uuid";
import ManageLabelsMenu from "./ManageLabelsMenu";

const ImageMenu = ({ isOpen, setIsOpen, anchorEl, menuItems }) => {
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
        placement="bottom"
        modifiers={[
          {
            name: "offset",
            options: {
              offset: [0, 5], // [horizontal, vertical] offset
            },
          },
          {
            name: "preventOverflow",
            options: {
              boundariesElement: "window",
            },
          },
        ]}
      >
        {isOpen && (
          <div className="img-menu">
            <motion.div
              onClick={containerClick}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{
                y: {
                  type: "spring",
                  stiffness: 700,
                  damping: 50,
                  mass: 1,
                },
                opacity: { duration: 0.15 },
              }}
              style={{
                width: "fit-content",
                borderRadius: "0.4rem",
                maxWidth: "14.0625rem",
                maxHeight: "26.96125rem",
              }}
              ref={menuRef}
              className="menu not-draggable"
            >
              <div className="menu-buttons not-draggable">
                {menuItems.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "0.6rem 2rem 0.6rem 1rem",
                      fontSize: "0.9rem",
                    }}
                    className={`menu-btn n-menu-btn not-draggable ${
                      item.title.toLowerCase() === "remove image"
                        ? "remove-img"
                        : "change-img"
                    }`}
                    onClick={item.function}
                  >
                    {item.title}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </Popper>
    </>
  );
};

export default ImageMenu;
