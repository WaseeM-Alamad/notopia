import { useAppContext } from "@/context/AppContext";
import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const KeybindsTable = ({ keybindsRef, isOpen, setIsOpen }) => {
  const { showTooltip, hideTooltip, closeToolTip, lockScroll } =
    useAppContext();
  const [isScrolled, setIsScrolled] = useState(false);

  const tableRef = useRef(null);

  useEffect(() => {
    lockScroll(isOpen);

    return () => {
      lockScroll(false);
    };
  }, [isOpen]);

  useEffect(() => {
    const table = tableRef.current;
    const handleScroll = () => {
      if (!table) return;
      setIsScrolled(table.scrollTop > 0);
    };

    table.addEventListener("scroll", handleScroll);
    return () => {
      table.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const binds = [
    {
      type: "category",
      text: "Navigation",
    },
    {
      type: "item",
      title: "Navigate to next/previous note",
      keybind: "j / k",
    },
    {
      type: "item",
      title: "Move note to next/previous position",
      keybind: "Shift + j / k",
    },
    {
      type: "category",
      text: "Application",
    },
    {
      type: "item",
      title: "Compose a new note/label",
      keybind: "c",
    },
    {
      type: "item",
      title: "Compose a new list",
      keybind: "l",
    },
    {
      type: "item",
      title: "Search notes/labels",
      keybind: "/",
    },
    {
      type: "item",
      title: "Select all notes",
      keybind: "Ctrl + a",
    },
    {
      type: "item",
      title: "Open keyboard shortcut help",
      keybind: "?, Ctrl + /",
    },
    {
      type: "category",
      text: "Actions",
    },
    {
      type: "item",
      title: "Archive note",
      keybind: "e",
    },
    {
      type: "item",
      title: "Trash note",
      keybind: "#, del",
    },
    {
      type: "item",
      title: "Pin or unpin notes",
      keybind: "f",
    },
    {
      type: "item",
      title: "Select note",
      keybind: "x",
    },
    {
      type: "item",
      title: "Undo action",
      keybind: "Ctrl + z",
    },
    {
      type: "item",
      title: "Redo action",
      keybind: "Ctrl + shift + z",
    },
    {
      type: "item",
      title: "Redo action",
      keybind: "Ctrl + y",
    },
    {
      type: "item",
      title: "Toggle between list and grid view",
      keybind: "Ctrl + g",
    },
    {
      type: "category",
      text: "Editor",
    },
    {
      type: "item",
      title: "Finish editing",
      keybind: "Esc",
    },
    {
      type: "item",
      title: "Toggle checkboxes",
      keybind: "Ctrl + Shift + 8",
    },
  ];

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: {
          type: "tween",
          duration: 0.15,
          ease: "linear",
        },
      }}
      className="modal-container"
      onClick={() => setIsOpen(false)}
    >
      <motion.div
        initial={{
          transform: "translate(-50%, -40%) scale(0.97)",
          opacity: 0,
        }}
        animate={{
          transform: "translate(-50%, -40%) scale(1)",
          opacity: 1,
        }}
        exit={{
          transform: "translate(-50%, -40%) scale(0.97)",
          opacity: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 40,
          mass: 1.05,
        }}
        className="keybinds-modal"
        onClick={(e) => e.stopPropagation()}
        ref={keybindsRef}
      >
        <div
          onClick={() => {
            closeToolTip();
            setIsOpen(false);
          }}
          onMouseEnter={(e) => showTooltip(e, "Close")}
          onMouseLeave={hideTooltip}
          className="clear-icon btn small-btn"
        />
        <div
          className={`keybinds-header ${isScrolled ? "keybinds-container-scrolled" : ""}`}
        >
          <div className="keyboard-dialog-icon" />
          Keyboard Shortcuts
        </div>
        <table ref={tableRef}>
          <tbody>
            {binds.map((data) => {
              if (data.type === "category")
                return (
                  <tr key={data.text}>
                    <th colSpan="2">{data.text}</th>
                  </tr>
                );
              else
                return (
                  <tr className="keybind-item" key={data.keybind}>
                    <td>{data.title}</td>
                    <td>{data.keybind}</td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </motion.div>
    </motion.div>,
    document.getElementById("modal-portal")
  );
};

export default KeybindsTable;
