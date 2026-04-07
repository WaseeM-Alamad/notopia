import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

const Select = () => {
  const options = [
    { value: "chocolate", label: "Chocolate" },
    { value: "strawberry", label: "Strawberry" },
    { value: "vanilla", label: "Vanilla" },
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const menuEl = menuRef.current;

      if (isOpen && !menuEl?.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleRightClick = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("contextmenu", handleRightClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("contextmenu", handleRightClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={isOpen ? "select-open" : ""} style={{ padding: "0 1rem" }}>
      <div
        style={{
          position: "relative",
          // width: "90%"
        }}
      >
        <div
          ref={menuRef}
          className="select-input"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span>{options[selectedIndex].label}</span>
          <motion.div
            initial={{
              transform: `translateY(-50%) rotateX(${isOpen ? "180deg" : "0"})`,
            }}
            animate={{
              transform: `translateY(-50%) rotateX(${isOpen ? "180deg" : "0"})`,
            }}
            transition={{
              type: "tween",
              duration: 0.2,
            }}
            style={{ right: "2px" }}
            className="down-arrow-icon"
          />
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{
                opacity: 0,
                transform: "scale(.97) translateY(-5px)",
                willChange: "none",
                pointerEvents: "auto",
              }}
              animate={{
                opacity: 1,
                transform: "scale(1) translateY(0px)",
                pointerEvents: "auto",
              }}
              exit={{
                opacity: 0,
                transform: "scale(.97) translateY(-5px)",
                pointerEvents: "none",
              }}
              transition={{
                transform: {
                  type: "spring",
                  stiffness: 1100,
                  damping: 50,
                  mass: 1,
                },
                opacity: { duration: 0.15 },
              }}
              className="select-menu menu-border"
            >
              {options.map(({ value, label }) => (
                <div
                  style={{ padding: ".5rem .6rem" }}
                  className="menu-btn"
                  key={label}
                >
                  {label}{" "}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Select;
