"use client";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import "@/assets/styles/sidebar.css";
import HomeIcon from "../icons/HomeIcon";
import BellIcon from "../icons/BellIcon";
import SideArchiveIcon from "../icons/SideArchiveIcon";
import TrashIcon from "../icons/TrashIcon";
import { motion } from "framer-motion";
import AddButton from "../icons/AddButton";
import LabelIcon from "../icons/LabelIcon";
import FolderIcon from "../icons/FolderIcon";
import { emptyTrashAction } from "@/utils/actions";

const Sidebar = memo(() => {
  const addButtonRef = useRef(null);
  const containerRef = useRef(null);
  const [currentHash, setCurrentHash] = useState(null);
  const ICON_SIZE = 22;

  const navItems = [
    { hash: "home", Icon: HomeIcon },
    { hash: "labels", Icon: FolderIcon },
    { hash: "reminders", Icon: BellIcon },
    { hash: "archive", Icon: SideArchiveIcon },
    { hash: "trash", Icon: TrashIcon },
  ];

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    setCurrentHash(hash); // Set hash after hydration
  }, []);

  const handleAddNote = async () => {
    addButtonRef.current.classList.remove("animate");
    void addButtonRef.current.offsetWidth;
    addButtonRef.current.classList.add("animate");
    const hash = window.location.hash;
    if (hash.includes("labels")) {
      window.dispatchEvent(new Event("addLabel"));
      return;
    } else if (hash === "" || hash.includes("home")) {
      window.dispatchEvent(new Event("openModal"));
      return;
    } else if (hash.includes("trash")) {
      window.dispatchEvent(new Event("emptyTrash"));
      return;
    }
  };

  const handleIconClick = (hash) => {
    window.location.hash = hash;
  };

  useEffect(() => {
    const handleHashChange = () => {
      requestAnimationFrame(() => {
        const hash = window.location.hash.replace("#", "");
        setCurrentHash(hash);

        const container = containerRef.current;

        Array.from(container.children).forEach((btn) => {
          if (btn.id === hash) {
            const prevItem = container.querySelector(".link-btn-selected");
            if (prevItem) {
              prevItem?.classList.remove("link-btn-selected");
              prevItem.children[0].style.opacity = "0.75";
            }
            const event = new CustomEvent("sectionChange", {
              detail: { hash },
            });
            window.dispatchEvent(event);
            btn.classList.add("link-btn-selected");
            btn.children[0].style.opacity = "1";
          }
        });

        if (!container.querySelector(".link-btn-selected")) {
          const item = container.querySelector("button[id=home]");

          item.classList.add("link-btn-selected");
          item.children[0].style.opacity = "1";
        }
      });
    };

    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  if (currentHash === null) return;

  return (
    <>
      <aside className="sidebar">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <button
            ref={addButtonRef}
            onClick={handleAddNote}
            id="add-btn"
            className="add-button-icon pulse-button"
          >
            <AddButton />
          </button>
          <div ref={containerRef} className="sidebar-icons-container">
            {navItems.map(({ hash, Icon }) => (
              <button
                className={`link-btn`}
                id={hash}
                key={hash}
                onClick={() => handleIconClick(hash)}
                style={{ zIndex: "9" }}
              >
                <Icon size={ICON_SIZE} />
              </button>
            ))}
          </div>
        </div>
        <span className="copyright-text">&copy; {currentYear}</span>
      </aside>
    </>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
