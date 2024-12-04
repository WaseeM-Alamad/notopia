import React, { useState, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import "@/assets/styles/ColorSelectMenu.css";
import { IconButton, Tooltip } from "@mui/material";
import ColorIcon from "@/components/ColorIconForm";

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

const TooltipPosition = {
  modifiers: [
    {
      name: "offset",
      options: {
        offset: [0, -11], // Adjust position (x, y)
      },
    },
  ],
};

const slotProps = {
  tooltip: {
    sx: {
      height: "fit-content",
      margin: "0",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      fontFamily: "Roboto",
      fontWeight: "400",
      fontSize: "0.76rem",
      padding: "5px 8px 5px 8px",
    },
  },
};

export default function ColorSelectMenu({ selectedColor, setSelectedColor, handleUpdate }) {
  const [hoveredColor, setHoveredColor] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleColorSelect = (color) => {
    handleUpdate("color", color);
    setSelectedColor(color);
  };

  return (
    <div className="color-select-container" ref={menuRef}>
      <Tooltip
        slotProps={slotProps}
        PopperProps={TooltipPosition}
        title="Background color"
        disableInteractive
      >
        <IconButton
          sx={{ "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" } }}
          onClick={toggleMenu}
        >
          <ColorIcon />
        </IconButton>
      </Tooltip>
      {isOpen && (
        <div className="color-menu">
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
                <Tooltip
                  slotProps={slotProps}
                  PopperProps={TooltipPosition}
                  disableInteractive
                  title={colorMap[color] || ""}
                >
                  <span
                    className="color-border"
                    style={{
                      borderColor:
                        selectedColor === color
                          ? "#A142F4"
                          : hoveredColor === color
                          ? "black"
                          : index === 0
                          ? "#e0e0e0"
                          : color,
                    }}
                  />
                </Tooltip>
                {selectedColor === color && (
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
