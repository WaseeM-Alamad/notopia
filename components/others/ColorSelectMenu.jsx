import React, { memo, useEffect, useRef, useState } from "react";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Popper } from "@mui/material";

const colors = [
  "Default",
  "Coral",
  "Peach",
  "Sand",
  "Mint",
  "Seafoam",
  "Fog",
  "Storm",
  "Lavender",
  "Blossom",
  "Clay",
  "Wisteria",
];

const ColorSelectMenu = ({
  handleColorClick,
  selectedColor,
  isOpen,
  setIsOpen,
  anchorEl,
  setTooltipAnchor,
}) => {
  const [hoveredColor, setHoveredColor] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !menuRef.current.contains(e.target) &&
        !anchorEl.contains(e.target) &&
        !e.target.classList.contains("menu-btn")
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => document.removeEventListener("click", handleClickOutside);
  }, [setIsOpen]);

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseEnter = (e, color) => {
    const target = e.currentTarget;
    setTooltipAnchor({ anchor: target, text: color, display: true });
  };

  const handleMouseLeave = () => {
    setTooltipAnchor((prev) => ({
      ...prev,
      display: false,
    }));
  };

  return createPortal(
    <Popper
      open={isOpen}
      anchorEl={anchorEl}
      style={{ zIndex: "998" }}
      placement="bottom"
      modifiers={[
        {
          name: "preventOverflow",
          options: {
            boundariesElement: "window",
          },
        },
      ]}
    >
      <motion.div
        ref={menuRef}
        className="not-draggable color-menu"
        initial={{ y: 5, opacity: 0 }}
        animate={{
          y: isOpen ? 0 : 5,
          opacity: isOpen ? 1 : 0,
        }}
        exit={{ y: 5, opacity: 0 }}
        transition={{
          y: { type: "spring", stiffness: 1000, damping: 50, mass: 1 },
          opacity: { duration: 0.2 },
        }}
      >
        {colors.map((color, index) => {
          const colorClass =
            hoveredColor === color && selectedColor !== color
              ? "hovered-color"
              : color === selectedColor
              ? "menu-color-selected"
              : color === "Default"
              ? "menu-color-default"
              : "";

          return (
            <button
              onClick={() => handleColorClick(color)}
              onMouseEnter={(e) => {
                handleMouseEnter(e, color);

                setHoveredColor(color);
              }}
              onMouseLeave={() => {
                setHoveredColor(null);
                handleMouseLeave();
              }}
              disabled={!isOpen}
              key={index}
              className={`${colorClass} not-draggable menu-color-btn ${
                index === 0 && "default-color-icon"
              } ${color} `}
            >
              <AnimatePresence>
                {color === selectedColor && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{
                      scale: 0,
                      opacity: 0,
                      transition: { duration: 0.2 },
                    }}
                    className="not-draggable"
                    style={{
                      backgroundColor: "#a142f4",
                      position: "absolute",
                      top: "-8px",
                      fontSize: "19px",
                      right: "-4.5px",
                      display: "flex",
                      borderRadius: "50%",
                    }}
                  >
                    <DoneRoundedIcon
                      sx={{ color: "white", margin: "auto", fontSize: "17px" }}
                      className="not-draggable"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </motion.div>
    </Popper>,
    document.getElementById("colorMenuPortal")
  );
};

export default memo(ColorSelectMenu);
