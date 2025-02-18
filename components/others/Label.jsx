import React, { memo, useEffect, useRef, useState } from "react";
import TestIcon from "../icons/TestIcon";
import Button from "../Tools/Button";
import MoreVert from "../icons/MoreVert";
import { getNoteFormattedDate } from "@/utils/noteDateFormatter";
import { AnimatePresence, motion } from "framer-motion";
import LabelMenu from "./LabelMenu";
import { useAppContext } from "@/context/AppContext";

const Label = ({
  labelData,
  setTooltipAnchor,
  triggerReRender,
  dispatchNotes,
}) => {
  const { updateLabel } = useAppContext();
  const [mounted, setMounted] = useState(false);
  const [anchorEl, setAnchorEL] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const labelDate = getNoteFormattedDate(labelData.createdAt);
  const [selectedColor, setSelectedColor] = useState(labelData.color);
  const labelRef = useRef(null);
  const labelTitleRef = useRef(null);
  const originalTitleRef = useRef(null);
  const moreRef = useRef(null);
  const dateRef = useRef(null);

  useEffect(() => {
    labelTitleRef.current.innerText = labelData.label;
    originalTitleRef.current = labelData.label;
    setCharCount(labelTitleRef.current.innerText.trim().length);

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

  const handlePaste = (e) => {
    e.preventDefault();
    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain").replace(/\n/g, "");
    // Insert only the text at cursor position
    document.execCommand("insertText", false, text);
  };

  const setCursorAtEnd = (ref) => {
    const element = ref?.current;
    if (element) {
      element.focus();

      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false); // Move to the end
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const handleTitleInput = (e) => {
    const text = e.target.innerText;
    const length = text.length;
    setCharCount(() => {
      if (text.trim().length > 50) {
        return 50;
      }

      return text.trim().length;
    });

    if (length > 50) {
      // If text exceeds limit, truncate it
      const truncated = text.slice(0, 50);
      labelTitleRef.current.innerText = truncated;

      // Move cursor to end
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(labelTitleRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

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
              "background-color 0.3s ease-in-out, border-color 0.3s ease-in-out, box-shadow 0.2s ease ",
          }}
        >
          <div
            style={{
              display: "flex",
              paddingBottom: "0.9rem",
              position: "relative",
            }}
          >
            <TestIcon
              color={
                labelData.color === "rgba(255, 255, 255, 1)"
                  ? "#212121"
                  : darkenColor(labelData.color, 0.85)
              }
              size="35"
            />
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  initial={{
                    y: 3,
                    opacity: 0,
                  }}
                  animate={{
                    y: 0,
                    opacity: 1,
                  }}
                  exit={{
                    y: 3,
                    opacity: 0,
                  }}
                  transition={{
                    y: {
                      type: "spring",
                      stiffness: 1000,
                      damping: 70,
                      mass: 1,
                    },
                    opacity: { duration: 0.2 },
                  }}
                  className="edit-icon"
                />
              )}
            </AnimatePresence>
            <Button
              onClick={handleMoreClick}
              ref={moreRef}
              className="label-more-icon"
              style={{
                marginLeft: "auto",
                opacity: (isOpen || colorMenuOpen) && "1",
              }}
            >
              <MoreVert style={{ rotate: "90deg" }} />
            </Button>
          </div>
          {/* <div style={{ paddingBottom: "0.6rem", fontWeight: "550" }}>
            {labelData.label}
          </div> */}

          <div
            // style={{ outlineColor: darkenColor(labelData.color, 0.85) }}
            contentEditable={isFocused}
            suppressContentEditableWarning
            onInput={handleTitleInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
            onPaste={handlePaste}
            onFocus={() => {
              setIsFocused(true);
              labelTitleRef.current.style.outline =
                `2px ` + darkenColor(labelData.color, 0.85);
              moreRef.current.classList.add("zero-opacity");
              dateRef.current.classList.add("zero-opacity");
            }}
            onBlur={() => {
              setIsFocused(false);
              labelTitleRef.current.blur();
              moreRef.current.classList.remove("zero-opacity");
              dateRef.current.classList.remove("zero-opacity");
              labelTitleRef.current.style.removeProperty("pointer-events");
              labelTitleRef.current.style.removeProperty("outline");
              if (labelTitleRef.current.innerText.trim() === "") {
                labelTitleRef.current.innerText = originalTitleRef.current;
                return;
              }
              if (
                labelTitleRef.current.innerText.trim() !==
                originalTitleRef.current.trim()
              ) {
                originalTitleRef.current =
                  labelTitleRef.current.innerText.trim();
                updateLabel(
                  labelData.uuid,
                  labelTitleRef.current.innerText.trim()
                );
              } else {
                labelTitleRef.current.innerText =
                  originalTitleRef.current.trim();
              }
            }}
            ref={labelTitleRef}
            className="label-title-input"
            role="textbox"
            tabIndex="0"
            aria-multiline="true"
            spellCheck="false"
          />

          <div
            ref={dateRef}
            className="label-date"
            style={{
              color: "#5E5E5E",
              fontSize: "0.8rem",
              opacity: (isOpen || colorMenuOpen) && "1",
            }}
          >
            {labelDate}
          </div>
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{
                  y: 0,
                  opacity: 0,
                }}
                animate={{
                  y: 0,
                  opacity: 1,
                }}
                exit={{
                  y: 0,
                  opacity: 0,
                }}
                transition={{
                  y: {
                    type: "spring",
                    stiffness: 1000,
                    damping: 70,
                    mass: 1,
                  },
                  opacity: { duration: 0.2 },
                }}
                style={{
                  position: "absolute",
                  bottom: "1rem",
                  color: "#5E5E5E",
                  fontSize: "0.7rem",
                }}
              >
                {50 - charCount} Characters left
              </motion.div>
            )}
          </AnimatePresence>
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
        labelTitleRef={labelTitleRef}
        setCursorAtEnd={setCursorAtEnd}
      />
    </>
  );
};

export default memo(Label);
