"use client";
import React, { memo, useMemo, useRef } from "react";
import "../assets/styles/sidebar.css";
import { usePathname } from "next/navigation";
import HomeIcon from "./icons/HomeIcon";
import FolderIcon from "./icons/FolderIcon";
import BellIcon from "./icons/BellIcon";
import SideArchiveIcon from "./icons/SideArchiveIcon";
import TrashIcon from "./icons/TrashIcon";
import { motion } from "framer-motion";
import Link from "next/link";
import AddButton from "./icons/AddButton";
import { useAppContext } from "@/context/AppContext";

const ICON_SIZE = 22;

const navItems = [
  { path: "/home", Icon: HomeIcon },
  { path: "/folders", Icon: FolderIcon },
  { path: "/reminders", Icon: BellIcon },
  { path: "/archive", Icon: SideArchiveIcon },
  { path: "/trash", Icon: TrashIcon },
];

const springTransition = {
  type: "spring",
  stiffness: 1400,
  damping: 70,
  mass: 1,
};

const Sidebar = memo(() => {
  const { setModalOpen, modalPosition, setModalPosition } = useAppContext();
  const addButtonRef = useRef(null);
  const pathName = usePathname();

  const highlightPosition = useMemo(() => {
    const index = navItems.findIndex((item) => pathName.includes(item.path));
    return index === -1 ? 0 : index * 62;
  }, [pathName]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  if (pathName === "/") return null;

  const handleAddNote = () => {
    const rect = addButtonRef.current.getBoundingClientRect();
    setModalPosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      borderRadius: "30%",
    });
    setModalOpen(true);
  };

  return (
    <>
      <aside className="sidebar">
        <div>
          <AddButton ref={addButtonRef} onClick={handleAddNote} />
          <div className="sidebar-icons-container">
            <motion.div
              initial={{ y: highlightPosition }}
              animate={{ y: highlightPosition }}
              transition={{ y: springTransition }}
              className="selected-highlight"
            />
            {navItems.map(({ path, Icon }) => (
              <Link prefetch={true} key={path} href={path} style={{ zIndex: "9" }}>
                <Icon
                  size={ICON_SIZE}
                  color={pathName.includes(path) ? "#212121" : "#535353"}
                />
              </Link>
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
