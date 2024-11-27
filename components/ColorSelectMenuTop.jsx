import React, { useState, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { IconButton, Tooltip } from "@mui/material";
import ColorIcon from "@/components/ColorIcon";
import "@/assets/styles/ColorSelectMenu.css";
import TopColor from "./TopColor";

const colors = [
  "#FFFFFF",
  "#FAAFA8",
  "#F39F76",
  "#FFF8B8",
  "#E2F6D3",
  "#B4DDD3",
  "#D4E4ED",
  "#AECCDC",
  "#D3BFDB",
  "#F6E2DD",
  "#E9E3D4",
  "#EFEFF1",
];

const colorMap = {
  "#FFFFFF": "Default",
  "#FAAFA8": "Coral",
  "#F39F76": "Peach",
  "#FFF8B8": "Sand",
  "#E2F6D3": "Mint",
  "#B4DDD3": "Sage",
  "#D4E4ED": "Fog",
  "#AECCDC": "Storm",
  "#D3BFDB": "Dusk",
  "#F6E2DD": "Blossom",
  "#E9E3D4": "Clay",
  "#EFEFF1": "Chalk",
};

export default function ColorSelectMenu({
  isOpen,
  setIsOpen,
  ColorMenuRef,
  selectedColorTop,
  setSelectedColorTop,
  handleColorSelect,
}) {
  const [hoveredColor, setHoveredColor] = useState(null);

  const [menuPosition, setMenuPosition] = useState({ top: "100%", left: 0 });

  const buttonRef = useRef(null);
  const iconRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        ColorMenuRef.current &&
        !ColorMenuRef.current.contains(event.target) &&
        !iconRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const updateMenuPosition = () => {
    if (!buttonRef.current || !ColorMenuRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuRect = ColorMenuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate new position
    let newPosition = {
      top: "100%",
      left: 0,
      transform: "none",
    };

    // Check horizontal overflow
    if (buttonRect.left + menuRect.width > viewportWidth) {
      // If menu would overflow right edge, align it to the right of the button
      const overflow = buttonRect.left + menuRect.width - viewportWidth;
      newPosition.left = Math.min(-overflow - 10, 0); // 8px margin
    }

    // Check vertical overflow
    if (buttonRect.bottom + menuRect.height > viewportHeight) {
      // If menu would overflow bottom edge, position it above the button
      newPosition.top = "auto";
      newPosition.bottom = "100%";
      newPosition.marginTop = 0;
      newPosition.marginBottom = "8px";
    }

    setMenuPosition(newPosition);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    // Update position on next tick to ensure menu is rendered
    setTimeout(updateMenuPosition, 0);
  };

  // Update position on window resize
  useEffect(() => {
    if (isOpen) {
      window.addEventListener("resize", updateMenuPosition);
      return () => window.removeEventListener("resize", updateMenuPosition);
    }
  }, [isOpen]);

  return (
    <div className="color-select-container" ref={buttonRef}>
      <Tooltip title="Background options" disableInteractive>
        <IconButton
          disableTouchRipple
          sx={{
            "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" },
            padding: "10.5px",
          }}
          ref={iconRef}
          onClick={toggleMenu}
        >
          <TopColor />
        </IconButton>
      </Tooltip>
      {isOpen && (
        <div
          ref={ColorMenuRef}
          className="color-menu"
          style={{
            ...menuPosition,
            position: "absolute",
            zIndex: 1000,
          }}
        >
          <div className="color-options">
            {colors.map((color, index) => (
              <button
                type="button"
                key={index}
                className="color-option"
                onClick={() => handleColorSelect(color)}
                onMouseEnter={() => setHoveredColor(color)}
                onMouseLeave={() => setHoveredColor(null)}
              >
                <span
                  className="color-swatch"
                  style={{
                    backgroundColor: index === 0 ? "#FFFFFF" : color,
                    backgroundImage:
                      index === 0
                        ? "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M21.19 21.19l-3.06-3.06-1.43-1.43-8.3-8.3L7 7 2.81 2.81 1.39 4.22l4.25 4.25A8.056 8.056 0 0 0 4.01 13H4c0 4.42 3.58 8 8 8 1.74 0 3.35-.57 4.66-1.51l3.12 3.12 1.41-1.42zM12 19c-3.22 0-5.86-2.55-5.99-5.74l.01-.19c.04-1.14.42-2.25 1.06-3.18l8.16 8.16c-.95.6-2.05.95-3.24.95zm0-14.17l4.25 4.24a6.014 6.014 0 0 1 1.74 4.01l.01.17c-.02.56-.13 1.11-.3 1.62l1.53 1.53c.49-1.03.77-2.18.77-3.4h-.01a7.975 7.975 0 0 0-2.33-5.35L12 2 8.41 5.58 9.83 7 12 4.83z'%3E%3C/path%3E%3C/svg%3E\")"
                        : "none",
                    backgroundSize: "18px 18px",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                />
                <Tooltip title={colorMap[color] || ""}>
                <span
                  className="color-border"
                  style={{
                    borderColor:
                      selectedColorTop === color
                        ? "#A142F4"
                        : hoveredColor === color
                        ? "black"
                        : index === 0
                        ? "#e0e0e0"
                        : color,
                  }}
                />
                </Tooltip>
                {selectedColorTop === color && (
                  <span className="check-icon-wrapper">
                    <Check className="check-icon" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
