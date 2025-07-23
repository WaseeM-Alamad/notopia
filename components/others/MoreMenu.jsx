import { copyNoteAction, undoAction } from "@/utils/actions";
import { Popper } from "@mui/material";
import { motion } from "framer-motion";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { v4 as generateUUID } from "uuid";
import ManageLabelsMenu from "./ManageLabelsMenu";

const MoreMenu = ({
  isOpen,
  setIsOpen,
  anchorEl,
  menuItems,
  transformOrigin = "top left",
}) => {
  const [isClient, setIsClient] = useState();
  const navTitle = anchorEl?.navTitle ?? null;

  const menuRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const menuEl = menuRef.current;
      const anchor = anchorEl?.contains ? anchorEl : null;
      const btnRef = anchorEl?.btnRef ?? null;

      if (
        isOpen &&
        !menuEl?.contains(e.target) &&
        !(anchor && anchor.contains(e.target)) &&
        btnRef !== e.target
      ) {
        setIsOpen(false);
      }
    };

    const handleResize = () => {
      setIsOpen(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, anchorEl]);

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
              boundariesElement: "viewport",
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
              transformOrigin: transformOrigin,
              width: "fit-content",
              maxWidth: "14.0625rem",
              maxHeight: "26.96125rem",
              borderRadius: "0.6rem",
              position: "relative",
              paddingTop: navTitle?.trim() && "0",
              pointerEvents: !isOpen && "none",
            }}
            ref={menuRef}
            className="menu not-draggable menu-border"
          >
            {navTitle?.trim() && (
              <div className="menu-top-title">{navTitle}</div>
            )}
            <div className="menu-buttons not-draggable">
              {menuItems.map((item, index) => {
                if (!item?.title?.trim()) {
                  return;
                }
                return (
                  <div
                    key={index}
                    style={{
                      padding: "0.5rem 1.5rem 0.5rem 2.6rem",
                      fontSize: "14px",
                    }}
                    className={`${
                      item.icon || ""
                    } menu-btn n-menu-btn not-draggable`}
                    onClick={item.function}
                  >
                    {item.title}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </Popper>
    </>
  );
};

export default memo(MoreMenu);
