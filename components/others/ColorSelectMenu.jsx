import React, { memo, useEffect, useRef, useState } from "react";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import { AnimatePresence, motion } from "framer-motion";
import { Popper } from "@mui/material";
import { useAppContext } from "@/context/AppContext";

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

const backgrounds = [
  "DefaultBG",
  "Groceries",
  "Food",
  "Music",
  "Recipes",
  "Notes",
  "Places",
  "Travel",
  "Video",
  "Celebration",
];

const ColorSelectMenu = ({
  isLabel = false,
  handleColorClick,
  handleBackground,
  selectedColor,
  selectedBG,
  isOpen,
  setIsOpen,
  anchorEl,
}) => {
  const { showTooltip, hideTooltip, closeToolTip } = useAppContext();
  const [hoveredItem, setHoveredItem] = useState(false);
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
    const closeMenu = () => {
      setIsOpen(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", closeMenu);
    window.addEventListener("resize", closeMenu);
    return () => {
      window.removeEventListener("resize", closeMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.addEventListener("contextmenu", closeMenu);
    };
  }, []);

  return (
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
        id="color-menu"
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
        style={{ pointerEvents: !isOpen && "none" }}
      >
        {/* display: "flex",
            padding: "9px 12px 1px 12px",
            justifyContent: "space-around", */}
        <div
          className={`${
            isLabel ? "label-color-section-menu" : "color-section-menu"
          }`}
        >
          {colors.map((color, index) => {
            const colorClass =
              hoveredItem === color && selectedColor !== color
                ? "hovered-item"
                : color === selectedColor
                  ? "menu-item-selected"
                  : color === "Default"
                    ? "menu-item-default"
                    : "";

            return (
              <button
                onClick={() => {
                  closeToolTip();
                  handleColorClick(color);
                }}
                onMouseEnter={(e) => {
                  showTooltip(e, color);

                  setHoveredItem(color);
                }}
                onMouseLeave={(e) => {
                  setHoveredItem(null);
                  hideTooltip(e);
                }}
                disabled={!isOpen}
                key={index}
                className={`${colorClass} not-draggable menu-color-btn ${
                  index === 0 && "default-color-icon"
                } ${isLabel ? "label-" + color : color} `}
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
                        top: "-5px",
                        fontSize: "19px",
                        right: "-4.5px",
                        display: "flex",
                        borderRadius: "50%",
                      }}
                    >
                      <DoneRoundedIcon
                        sx={{
                          color: "white",
                          margin: "auto",
                          fontSize: "16px",
                        }}
                        className="not-draggable"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
        {!isLabel && (
          <div className="menu-bg-container">
            {backgrounds.map((name) => {
              const itemClass =
                hoveredItem === name && selectedBG !== name
                  ? "hovered-item"
                  : name === selectedBG
                    ? "menu-item-selected"
                    : name === "DefaultBG"
                      ? "menu-item-default"
                      : "";
              return (
                <button
                  onClick={() => {
                    closeToolTip();
                    handleBackground(name);
                  }}
                  onMouseEnter={(e) => {
                    showTooltip(e, name === "DefaultBG" ? "Default" : name);

                    setHoveredItem(name);
                  }}
                  onMouseLeave={(e) => {
                    setHoveredItem(null);
                    hideTooltip(e);
                  }}
                  className={`menu-bg-btn menu-bg-${name} ${itemClass}`}
                  key={name}
                  disabled={!isOpen}
                >
                  <AnimatePresence>
                    {name === selectedBG && (
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
                          top: "-5px",
                          fontSize: "19px",
                          right: "-4.5px",
                          display: "flex",
                          borderRadius: "50%",
                        }}
                      >
                        <DoneRoundedIcon
                          sx={{
                            color: "white",
                            margin: "auto",
                            fontSize: "16px",
                          }}
                          className="not-draggable"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </Popper>
  );
};

export default memo(ColorSelectMenu);
