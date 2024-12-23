import React, { memo, useEffect, useRef, useState } from "react";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
// const colors = [
//   "#FFFFFF",
//   "#FAAFA8",
//   "#F39F76",
//   "#FFF8B8",
//   "#E2F6D3",
//   "#B4DDD3",
//   "#D4E4ED",
//   "#AECCDC",
//   "#D3BFDB",
//   "#F6E2DD",
//   "#E9E3D4",
//   "#EFEFF1",
// ];

const colors = [
  "#FFFFFF",
  "#f79b92",
  "#f09265",
  "#fcf3a2",
  "#d0f5b5",
  "#a2e0d1",
  "#b9d9eb",
  "#97c4db",
  "#cda9db",
  "#ffcec2",
  "#e6d8b8",
  "#dfdff0",
];

const ColorSelectMenu = ({
  handleColorClick,
  menuPosition,
  selectedColor,
  isOpen,
  setIsOpen,
  buttonRef,
}) => {
  const menuRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set isClient to true once the component is mounted on the client side
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (
        !menuRef.current?.contains(e.target) &&
        !buttonRef?.current?.contains(e.target)
      )
        setIsOpen(false);
    };

    document.addEventListener("click", handler);

    return () => document.removeEventListener("click", handler);
  }, []);

  if (!isClient) {
    return null; // Return nothing on the server side
  }

  return createPortal(
    <motion.div
      ref={menuRef}
      initial={{ y: 12, display: "none", opacity: 0 }}
      animate={{
        y: isOpen ? 0 : 12,
        display: isOpen ? "grid" : "none",
        opacity: isOpen ? 1 : 0,
      }}
      transition={{
        y: {
          type: "spring",
          stiffness: 1000,
          damping: 50,
          mass: 1,
        },
        opacity: { duration: 0.2 },
      }}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        top: `${menuPosition?.top}px`,
        left: `${menuPosition?.left - 108}px`,
        position: "absolute",
        height: "fit-content",
        width: "fit-content",
        padding: "9px 12px 9px 12px",
        borderRadius: "10px",
        alignSelf: "flex-start",
        backgroundColor: "white",
        boxShadow:
          "0 1px 2px 0 rgba(60,64,67,0.3),0 2px 6px 2px rgba(60,64,67,0.15)",
        gap: "0.5rem",
        zIndex: "999",
      }}
    >
      {colors.map((color, index) => {
        return (
          <button
            onClick={() => {
              handleColorClick(color);
            }}
            disabled={!isOpen}
            key={index}
            style={{
              outline: `solid 0.1rem ${
                color === selectedColor
                  ? "#a142f4"
                  : color === "#FFFFFF"
                  
                  ? "#e0e0e0"
                  : color
              }`,
              border: `solid 0.03rem ${
                color === selectedColor
                  ? "#a142f4"
                  : color === "#FFFFFF"
                  ?  "#e0e0e0"
                  : color
              }`,
              height: "30px",
              width: "30px",
              backgroundColor: color,
              backgroundColor: index === 0 ? "#FFFFFF" : color,
              backgroundImage:
                index === 0
                  ? "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M21.19 21.19l-3.06-3.06-1.43-1.43-8.3-8.3L7 7 2.81 2.81 1.39 4.22l4.25 4.25A8.056 8.056 0 0 0 4.01 13H4c0 4.42 3.58 8 8 8 1.74 0 3.35-.57 4.66-1.51l3.12 3.12 1.41-1.42zM12 19c-3.22 0-5.86-2.55-5.99-5.74l.01-.19c.04-1.14.42-2.25 1.06-3.18l8.16 8.16c-.95.6-2.05.95-3.24.95zm0-14.17l4.25 4.24a6.014 6.014 0 0 1 1.74 4.01l.01.17c-.02.56-.13 1.11-.3 1.62l1.53 1.53c.49-1.03.77-2.18.77-3.4h-.01a7.975 7.975 0 0 0-2.33-5.35L12 2 8.41 5.58 9.83 7 12 4.83z'%3E%3C/path%3E%3C/svg%3E\")"
                  : "none",
              backgroundSize: "18px 18px",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              borderRadius: "25%",
              position: "relative",
              cursor: isOpen && "pointer",
            }}
          >
            {color === selectedColor && (
              <div
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
              </div>
            )}
          </button>
        );
      })}
    </motion.div>,
    document.getElementById("colorMenuPortal")
  );
};

export default memo(ColorSelectMenu);
