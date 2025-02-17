import React, { memo, useEffect, useRef, useState } from "react";
import TestIcon from "../icons/TestIcon";
import Button from "../Tools/Button";
import MoreVert from "../icons/MoreVert";
import { getNoteFormattedDate } from "@/utils/noteDateFormatter";
import { motion } from "framer-motion";
import LabelMenu from "./LabelMenu";

const Label = ({ labelData, setTooltipAnchor, triggerReRender, dispatchNotes }) => {
  const [mounted, setMounted] = useState(false);
  const [anchorEl, setAnchorEL] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(labelData.color);
  const labelRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 10);
  }, []);

  const handleMoreClick = (e) => {
    setAnchorEL(e.currentTarget);
    setIsOpen((prev) => !prev);
    setColorMenuOpen(false);
  };

  function changeOpacity(color, newOpacity) {
    let parts = color.split(",");
    parts[3] = ` ${newOpacity})`; // Replace opacity while keeping format
    return parts.join(",");
  }

  function darkenColor(rgba, factor = 0.8) {
    let parts = rgba.match(/\d+/g); // Extracts [R, G, B, A] as strings
    let [r, g, b, a] = parts.map(Number); // Convert to numbers

    // Reduce RGB values to darken (factor < 1 makes it darker)
    r = Math.max(0, Math.floor(r * factor));
    g = Math.max(0, Math.floor(g * factor));
    b = Math.max(0, Math.floor(b * factor));

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  const labelDate = getNoteFormattedDate(labelData.createdAt);
  return (
    <>
      <div
        ref={labelRef}
        style={{
          transition: `transform ${
            mounted ? "0.22s" : "0s"
          } cubic-bezier(0.2, 0, 0, 1), opacity 0.23s ease`,
        }}
      >
        <motion.div
          className="label"
          initial={{ y: 11, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            y: { type: "spring", stiffness: 700, damping: 50, mass: 1 },
            opacity: { duration: 0.2 },
          }}
          style={{
            border: "solid",
            backgroundColor: changeOpacity(labelData.color, 0.5),
            border: "solid 1px transparent",
            borderColor:
              labelData.color === "rgba(255, 255, 255, 1)"
                ? "#e0e0e0"
                : "transparent",
            transition:
              "background-color 0.3s ease-in-out, border-color 0.3s ease-in-out ",
          }}
        >
          <div style={{ display: "flex", paddingBottom: "0.9rem" }}>
            <TestIcon
              color={
                labelData.color === "rgba(255, 255, 255, 1)"
                  ? "#212121"
                  : darkenColor(labelData.color, 0.85)
              }
              size="35"
            />
            <Button
              onClick={handleMoreClick}
              className="label-more-icon"
              style={{
                marginLeft: "auto",
                opacity: (isOpen || colorMenuOpen) && "1",
              }}
            >
              <MoreVert style={{ rotate: "90deg" }} />
            </Button>
          </div>
          <div style={{ paddingBottom: "0.6rem", fontWeight: "600" }}>
            {labelData.label}
          </div>

          <div
            className="label-date"
            style={{
              color: "#5E5E5E",
              fontSize: "0.8rem",
              opacity: (isOpen || colorMenuOpen) && "1",
            }}
          >
            {labelDate}
          </div>
        </motion.div>
      </div>
      <LabelMenu
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        labelRef={labelRef}
        colorMenuOpen={colorMenuOpen}
        setColorMenuOpen={setColorMenuOpen}
        setTooltipAnchor={setTooltipAnchor}
        anchorEl={anchorEl}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        labelData={labelData}
        triggerReRender={triggerReRender}
        dispatchNotes={dispatchNotes}
      />
    </>
  );
};

export default memo(Label);
