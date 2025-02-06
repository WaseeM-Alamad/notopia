"use client";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import "@/assets/styles/sidebar.css";
import HomeIcon from "../icons/HomeIcon";
import FolderIcon from "../icons/FolderIcon";
import BellIcon from "../icons/BellIcon";
import SideArchiveIcon from "../icons/SideArchiveIcon";
import TrashIcon from "../icons/TrashIcon";
import { motion } from "framer-motion";
import AddButton from "../icons/AddButton";

const Sidebar = memo(() => {
  const [mounted, setMounted] = useState(false);
  const addButtonRef = useRef(null);
  const homeRef = useRef(null);
  const foldersRef = useRef(null);
  const remindersRef = useRef(null);
  const archiveRef = useRef(null);
  const trashRef = useRef(null);

  const ICON_SIZE = 22;

  const springTransition = {
    type: "spring",
    stiffness: 1400,
    damping: 70,
    mass: 1,
    duration: !mounted && 0,
  };

  const navItems = [
    { hash: "home", Icon: HomeIcon, ref: homeRef },
    { hash: "folders", Icon: FolderIcon, ref: foldersRef },
    { hash: "reminders", Icon: BellIcon, ref: remindersRef },
    { hash: "archive", Icon: SideArchiveIcon, ref: archiveRef },
    { hash: "trash", Icon: TrashIcon, ref: trashRef },
  ];

  const [highlightPosition, setHighlightPosition] = useState({
    top: 0,
    left: 0,
  });

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const handleAddNote = () => {
    window.dispatchEvent(new Event("openModal"));
    addButtonRef.current.classList.remove("animate");
    void addButtonRef.current.offsetWidth;
    addButtonRef.current.classList.add("animate");
  };

  const handleIconClick = (hash, ref) => {
    window.dispatchEvent(new Event("sectionChange"));
    window.location.hash = hash;
    const rect = ref.current?.getBoundingClientRect();
    const containerRect = ref.current?.parentElement?.getBoundingClientRect(); // parent is .sidebar-icons-container
    // console.log(
    //   "top: ",
    //   rect.top - containerRect.top,
    //   "left: ",
    //   rect.left - containerRect.left
    // );
    if (rect && containerRect) {
      setHighlightPosition({
        top: rect.top - containerRect.top, // Adjust top relative to the container
        left: rect.left - containerRect.left, // Adjust left relative to the container
      });
    }
  };

  useEffect(() => {
    setHighlightPosition(() => {
      const hash = window.location.hash.replace("#", "");
      switch (hash) {
        case "home":
          return { top: 0, left: 0, section: "home" };
        case "folders":
          return { top: 62.390625, left: 0, section: "folders" };
        case "reminders":
          return { top: 124.78125, left: 0, section: "reminders" };
        case "archive":
          return { top: 187.171875, left: 0, section: "archive" };
        case "trash":
          return { top: 249.5625, left: 0, section: "trash" };
        default:
          return { top: 0, left: 0, section: "home" };
      }
    });

    const handleHashChange = () => {
      const currentHash = window.location.hash.replace("#", "");
      setHighlightPosition((prev) => ({
        ...prev,
        section: currentHash,
      }));
    };

    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    setTimeout(() => {
      setMounted(true);
    }, 10);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <>
      <aside className="sidebar">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            ref={addButtonRef}
            onClick={handleAddNote}
            className="add-button-icon pulse-button"
            style={{
              borderRadius: "50%",
              display: "flex",
            }}
          >
            <AddButton />
          </div>
          <div className="sidebar-icons-container">
            <motion.div
              initial={{ y: highlightPosition.top, x: highlightPosition.left }}
              animate={{ y: highlightPosition.top, x: highlightPosition.left }}
              transition={{ y: springTransition }}
              className="selected-highlight"
            />
            {navItems.map(({ hash, Icon, ref }) => (
              <button
                ref={ref}
                className={`link-btn `}
                key={hash}
                onClick={() => handleIconClick(hash, ref)}
                style={{ zIndex: "9" }}
              >
                <Icon
                  size={ICON_SIZE}
                  color={
                    highlightPosition.section === hash ? "#212121" : "#535353"
                  }
                />
              </button>
            ))}
          </div>
        </div>
        <span
          className="copyright-text"
          style={{
            marginTop: "auto",
            marginBottom: "160px",
            userSelect: "none",
            fontSize: "0.7rem",
            color: "rgba(0,0,0,0.3)",
          }}
        >
          &copy; {currentYear}
        </span>
      </aside>
    </>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
