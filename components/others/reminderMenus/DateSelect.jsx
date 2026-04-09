import { AnimatePresence, motion } from "framer-motion";
import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import DatePicker from "./DatePicker";
import { getNoteFormattedDate } from "@/utils/noteDateFormatter";
import { format } from "date-fns";

const DateSelect = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const getFormattedDate = (date) => {
    return format(new Date(date), `MMM d, yyyy`);
  };

  useLayoutEffect(() => {
    if (!value) {
      onChange(new Date());
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
        >
          <span>{getFormattedDate(value)}</span>
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
              style={{ zIndex: "10", position: "absolute", width: "100%" }}
            >
              <DatePicker
                onSelect={(selectedDate) => {
                  onChange(selectedDate);
                  setIsOpen(false);
                }}
                selected={value}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default memo(DateSelect);
