"use client";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import "../assets/styles/sidebar.css";
import HomeIcon from "./icons/HomeIcon";
import FolderIcon from "./icons/FolderIcon";
import BellIcon from "./icons/BellIcon";
import SideArchiveIcon from "./icons/SideArchiveIcon";
import TrashIcon from "./icons/TrashIcon";
import { motion } from "framer-motion";
import AddButton from "./icons/AddButton";
import { useAppContext } from "@/context/AppContext";

const ICON_SIZE = 22;

const springTransition = {
  type: "spring",
  stiffness: 1400,
  damping: 70,
  mass: 1,
};

const Sidebar = memo(() => {
  const { setModalOpen } = useAppContext();
  const [currentSection, setCurrentSection] = useState();
  const addButtonRef = useRef(null);
  const homeRef = useRef(null);
  const foldersRef = useRef(null);
  const remindersRef = useRef(null);
  const archiveRef = useRef(null);
  const trashRef = useRef(null);

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
    setModalOpen(true);
  };

  const handleIconClick = (hash, ref) => {
    window.location.hash = hash;
    const rect = ref.current?.getBoundingClientRect();
    const containerRect = ref.current?.parentElement?.getBoundingClientRect(); // parent is .sidebar-icons-container
    if (rect && containerRect) {
      setHighlightPosition({
        top: rect.top - containerRect.top, // Adjust top relative to the container
        left: rect.left - containerRect.left, // Adjust left relative to the container
      });
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash.replace("#", "");
      // navItems.map(({hash, Icon, ref}) => {
        
      //   if (currentHash === hash) {
      //     const rect = ref.current?.getBoundingClientRect();
      //     const containerRect =
      //       ref.current?.parentElement?.getBoundingClientRect(); // parent is .sidebar-icons-container
      //     setHighlightPosition({
      //       top: rect.top - containerRect.top, // Adjust top relative to the container
      //       left: rect.left - containerRect.left, // Adjust left relative to the container
      //     });
      //   }
      // });
      setCurrentSection(currentHash);
    };

    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <>
      <aside className="sidebar">
        <div>
          <AddButton ref={addButtonRef} onClick={handleAddNote} />
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
                  color={hash.includes(currentSection) ? "#212121" : "#535353"}
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
