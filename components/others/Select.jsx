import { AnimatePresence, motion } from "framer-motion";
import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const Select = ({ options, value, onChange, useSideTextforInput = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const selectedOption = options.find((option) => {
    const optionValue = typeof option === "object" ? option.value : option;
    return optionValue === value;
  });

  const selectedLabel =
    typeof selectedOption === "object"
      ? useSideTextforInput && selectedOption?.sideText
        ? selectedOption?.sideText
        : selectedOption?.label
      : selectedOption;

  useLayoutEffect(() => {
    if (value === null || value === undefined) {
      const optionValue =
        typeof options[0] === "object" ? options[0].value : options[0];
      onChange(optionValue);
    }
  }, [value]);

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
        ref={menuRef}
        style={{
          position: "relative",
        }}
      >
        <div
          className="select-input"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            borderColor: selectedOption?.disabled ? "var(--error)" : "",
          }}
        >
          <span>{selectedLabel}</span>
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
            style={{ right: "4px" }}
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
              style={{
                borderTop: selectedOption?.disabled
                  ? "solid 1px var(--error)"
                  : "",
              }}
            >
              {options.map((option) => {
                const optionValue =
                  typeof option === "object" ? option.value : option;

                const optionLabel =
                  typeof option === "object" ? option.label : option;

                const sideText =
                  typeof option === "object" ? option.sideText : null;

                const disabled =
                  typeof option === "object" ? option?.disabled : false;
                return (
                  <button
                    disabled={disabled}
                    style={{ padding: ".5rem .6rem", fontSize: "0.83rem" }}
                    className="menu-btn"
                    key={optionValue}
                    onClick={() => {
                      onChange(optionValue);
                      setIsOpen(false);
                    }}
                  >
                    <span style={{ width: "fit-content" }}>{optionLabel}</span>
                    {sideText && (
                      <span style={{ width: "fit-content" }}>{sideText}</span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default memo(Select);
