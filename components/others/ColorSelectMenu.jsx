import React, { memo, useEffect, useRef, useState } from "react";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Popper } from "@mui/material";

const colors = [
  {color: "rgba(255, 255, 255, 1)", name: "Default"},
  {color: "rgba(247, 155, 146, 1)", name: "Coral"},
  {color: "rgba(240, 146, 101, 1)", name: "Peach"},
  {color: "rgba(252, 243, 162, 1)", name: "Sand"},
  {color: "rgba(208, 245, 181, 1)", name: "Mint"},
  {color: "rgba(162, 224, 209, 1)", name: "Seafoam"},
  {color: "rgba(185, 217, 235, 1)", name: "Fog"},
  {color: "rgba(151, 196, 219, 1)", name: "Storm"},
  {color: "rgba(205, 169, 219, 1)", name: "Lavender"},
  {color: "rgba(255, 206, 194, 1)", name: "Blossom"},
  {color: "rgba(230, 216, 184, 1)", name: "Clay"},
  {color: "rgba(223, 223, 240, 1)", name: "Wisteria"},
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
      if (!menuRef.current.contains(e.target) && !anchorEl.contains(e.target)) {
        if (isOpen) setIsOpen(false);
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

  const handleMouseEnter = (e, text) => {
    const target = e.currentTarget;
    setTooltipAnchor({ anchor: target, text: text, display: true });
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
        className="not-draggable color"
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
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gridTemplateRows: "repeat(2, 1fr)",
          height: "fit-content",
          width: "fit-content",
          padding: "9px 12px",
          borderRadius: "10px",
          backgroundColor: "white",
          boxShadow:
            "0 1px 2px 0 rgba(60,64,67,0.3),0 2px 6px 2px rgba(60,64,67,0.15)",
          gap: "0.4rem",
          zIndex: "999",
        }}
      >
        {colors.map((colorItem, index) => (
          <button
            onClick={() => handleColorClick(colorItem.color)}
            onMouseEnter={(e) => {
              const text = colorItem.name
              handleMouseEnter(e, text);

              setHoveredColor(colorItem.color);
            }}
            onMouseLeave={() => {
              setHoveredColor(null);
              handleMouseLeave();
            }}
            disabled={!isOpen}
            key={index}
            className="not-draggable color"
            style={{
              outline: `solid 0.1rem ${
                hoveredColor === colorItem.color && selectedColor !== colorItem.color
                  ? "#303030"
                  : colorItem.color === selectedColor
                  ? "#a142f4"
                  : colorItem.color === "rgba(255, 255, 255, 1)"
                  ? "#e0e0e0"
                  : colorItem.color
              }`,
              border: `solid 0.03rem ${
                hoveredColor === colorItem.color && selectedColor !== colorItem.color
                  ? "#303030"
                  : colorItem.color === selectedColor
                  ? "#a142f4"
                  : colorItem.color === "rgba(255, 255, 255, 1)"
                  ? "#e0e0e0"
                  : colorItem.color
              }`,
              height: "32px",
              width: "32px",
              backgroundColor: colorItem.color,
              backgroundImage:
                index === 0
                  ? "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M21.19 21.19l-3.06-3.06-1.43-1.43-8.3-8.3L7 7 2.81 2.81 1.39 4.22l4.25 4.25A8.056 8.056 0 0 0 4.01 13H4c0 4.42 3.58 8 8 8 1.74 0 3.35-.57 4.66-1.51l3.12 3.12 1.41-1.42zM12 19c-3.22 0-5.86-2.55-5.99-5.74l.01-.19c.04-1.14.42-2.25 1.06-3.18l8.16 8.16c-.95.6-2.05.95-3.24.95zm0-14.17l4.25 4.24a6.014 6.014 0 0 1 1.74 4.01l.01.17c-.02.56-.13 1.11-.3 1.62l1.53 1.53c.49-1.03.77-2.18.77-3.4h-.01a7.975 7.975 0 0 0-2.33-5.35L12 2 8.41 5.58 9.83 7 12 4.83z'%3E%3C/path%3E%3C/svg%3E\")"
                  : "none",
              backgroundSize: "18px 18px",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              borderRadius: "50%",
              position: "relative",
              cursor: isOpen ? "pointer" : "default",
              transition: "all 0.1s ease",
              scale:
                hoveredColor === colorItem.color && selectedColor !== colorItem.color
                  ? "105%"
                  : "1",
            }}
          >
            <AnimatePresence>
              {colorItem.color === selectedColor && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
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
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        ))}
      </motion.div>
    </Popper>,
    document.getElementById("colorMenuPortal")
  );
};

export default memo(ColorSelectMenu);
