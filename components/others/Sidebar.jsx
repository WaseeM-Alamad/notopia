"use client";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import "@/assets/styles/sidebar.css";
import HomeIcon from "../icons/HomeIcon";
import BellIcon from "../icons/BellIcon";
import SideArchiveIcon from "../icons/SideArchiveIcon";
import TrashIcon from "../icons/TrashIcon";
import { AnimatePresence, motion } from "framer-motion";
import AddButton from "../icons/AddButton";
import LabelIcon from "../icons/LabelIcon";
import FolderIcon from "../icons/FolderIcon";
import { emptyTrashAction } from "@/utils/actions";
import Tooltip from "../Tools/Tooltip";
import { useAppContext } from "@/context/AppContext";

const Sidebar = memo(() => {
  const { labelsRef, labelsReady } = useAppContext();
  const addButtonRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltipAnchor, setTooltipAnchor] = useState(null);
  const [currentHash, setCurrentHash] = useState(null);
  const [trans, setTrans] = useState(false);
  const ICON_SIZE = 22;

  const items = [
    { name: "Home", hash: "home", Icon: HomeIcon },
    { name: "Labels", hash: "labels", Icon: FolderIcon },
    { name: "Reminders", hash: "reminders", Icon: BellIcon },
    { name: "Archive", hash: "archive", Icon: SideArchiveIcon },
    { name: "Trash", hash: "trash", Icon: TrashIcon },
  ];

  const [navItems, setNavitems] = useState(items);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    setCurrentHash(hash); // Set hash after hydration
  }, []);

  useEffect(() => {
    const handler = () => {
      const labelItems = [];
      labelsRef.current.forEach((labelData) => {
        if (labelData?.isPinned) {
          labelItems.push({
            name: labelData.label,
            hash: encodeLabel(labelData.label),
            Icon: LabelIcon,
            uuid: labelData.uuid,
          });
        }
      });

      setNavitems([...items, ...labelItems]);
    };

    handler();

    window.addEventListener("refreshPinnedLabels", handler);

    return () => {
      window.removeEventListener("refreshPinnedLabels", handler);
    };
  }, [labelsReady]);

  const encodeLabel = (label) => {
    return "label/" + encodeURIComponent(label.toLowerCase());
  };

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
    closeToolTip();
    window.location.hash = hash;
  };

  const handleMouseEnter = (e, text) => {
    const target = e.currentTarget;
    setTooltipAnchor({ anchor: target, text: text, display: true });
  };

  const handleMouseLeave = () => {
    setTooltipAnchor((prev) => ({
      ...prev,
      display: false,
    }));
  };

  const closeToolTip = () => {
    setTooltipAnchor((prev) => ({
      anchor: null,
      text: prev?.text,
    }));
  };

  useEffect(() => {
    const handleHashChange = () => {
      requestAnimationFrame(() => {
        const hash = window.location.hash.replace("#", "");
        setCurrentHash(hash);

        const container = containerRef.current;

        if (!container?.children) return;

        Array.from(container.children).forEach((btn) => {
          if (btn.id === hash) {
            const prevItem = container.querySelector(".link-btn-selected");
            if (prevItem) {
              prevItem?.classList.remove("link-btn-selected");
              prevItem.children[0].style.opacity = "0.75";
            }

            if (hash.startsWith("label/")) {
              const event = new CustomEvent("sectionChange", {
                detail: { hash: hash },
              });
              window.dispatchEvent(event);
            } else {
              const event = new CustomEvent("sectionChange", {
                detail: { hash: hash },
              });
              window.dispatchEvent(event);
            }

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
  }, [labelsReady]);

  useEffect(() => {
    if (!labelsReady) return;
    requestAnimationFrame(() => {
      setTimeout(() => {
        setTrans(true);
      }, 10);
    });
  }, [labelsReady]);

  if (currentHash === null) return;

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-container">
          <button
            onMouseEnter={(e) => handleMouseEnter(e, "New note")}
            onMouseLeave={handleMouseLeave}
            ref={addButtonRef}
            onClick={handleAddNote}
            id="add-btn"
            className="add-button-icon pulse-button"
          >
            <AddButton />
          </button>
          <div ref={containerRef} className="sidebar-icons-container">
            <AnimatePresence>
              {navItems.map(({ name, hash, Icon }) => (
                <motion.button
                  key={hash}
                  initial={{ x: trans ? -100 : 0 }}
                  animate={{ x: 0 }}
                  exit={{ x: -100 }}
                  transition={{
                    type: "spring",
                    stiffness: 700,
                    damping: 50,
                    mass: 1,
                  }}
                  className={`link-btn`}
                  onMouseEnter={(e) => handleMouseEnter(e, name)}
                  onMouseLeave={handleMouseLeave}
                  id={hash}
                  onClick={() => handleIconClick(hash)}
                  style={{ zIndex: "9" }}
                >
                  <Icon size={ICON_SIZE} />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <span className="copyright-text">&copy; {currentYear}</span>
      </aside>
      <Tooltip anchorEl={tooltipAnchor} angle="right" />
    </>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
