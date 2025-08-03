"use client";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import HomeIcon from "../icons/HomeIcon";
import BellIcon from "../icons/BellIcon";
import SideArchiveIcon from "../icons/SideArchiveIcon";
import TrashIcon from "../icons/TrashIcon";
import { AnimatePresence, motion } from "framer-motion";
import AddButton from "../icons/AddButton";
import LabelIcon from "../icons/LabelIcon";
import FolderIcon from "../icons/FolderIcon";
import Tooltip from "../Tools/Tooltip";
import { useAppContext } from "@/context/AppContext";
import SideBtn from "./SideBtn";
import RightTooltip from "../Tools/RightTooltip";

const Sidebar = memo(() => {
  const {
    labelsRef,
    labelsReady,
    swapPinnedLabels,
    currentSection,
    addButtonRef,
  } = useAppContext();
  const containerRef = useRef(null);
  const [tooltipAnchor, setTooltipAnchor] = useState(null);
  const [currentHash, setCurrentHash] = useState(null);
  const [isDragging, setIsDragging] = useState(null);
  const layoutFrameRef = useRef(null);

  const items = [
    { type: "nav", name: "Home", hash: "home", Icon: HomeIcon },
    { type: "nav", name: "Labels", hash: "labels", Icon: FolderIcon },
    {
      type: "nav",
      name: "Reminders",
      hash: "reminders",
      Icon: BellIcon,
      uuid: "remind",
    },
    { type: "nav", name: "Archive", hash: "archive", Icon: SideArchiveIcon },
    { type: "nav", name: "Trash", hash: "trash", Icon: TrashIcon },
  ];

  const [navItems, setNavitems] = useState(items);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash.toLowerCase().startsWith("note/")) {
      setCurrentHash(hash);
    } else {
      setCurrentHash("home");
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      const labelItems = [];
      const sortedLabels = [...labelsRef.current].sort(
        ([aUUID, a], [bUUID, b]) =>
          new Date(b.pinDate).getTime() - new Date(a.pinDate).getTime()
      );
      sortedLabels.forEach(([uuid, labelData]) => {
        if (labelData?.isPinned) {
          labelItems.push({
            type: "label",
            name: labelData.label,
            hash: encodeLabel(labelData.label),
            Icon: LabelIcon,
            uuid: labelData.uuid,
          });
        }
      });

      setNavitems(() => {
        const updatedItems = [...items];
        const lastIndex = updatedItems.length - 1;
        updatedItems.splice(3, 0, ...labelItems);
        return updatedItems;
      });

      calculateVerticalLayout();
    };

    handler();

    window.addEventListener("refreshPinnedLabels", handler);
    // window.addEventListener("loadLabels", handler)

    return () => {
      window.removeEventListener("refreshPinnedLabels", handler);
      // window.removeEventListener("loadLabels", handler);
    };
  }, [labelsReady]);

  useEffect(() => {
    calculateVerticalLayout();
  }, [navItems, currentHash]);

  const encodeLabel = (label) => {
    return "label/" + encodeURIComponent(label.toLowerCase());
  };

  const handleAddNote = async () => {
    closeToolTip();
    addButtonRef.current.classList.remove("animate");
    void addButtonRef.current.offsetWidth;
    addButtonRef.current.classList.add("animate");
    const section = currentSection.toLowerCase();
    if (section === "labels") {
      window.dispatchEvent(new Event("addLabel"));
      return;
    } else if (section === "home" || section === "dynamiclabel") {
      window.dispatchEvent(new Event("openModal"));
      return;
    } else if (section === "trash") {
      window.dispatchEvent(new Event("emptyTrash"));
      return;
    }
  };

  const closeToolTip = () => {
    setTooltipAnchor((prev) => ({
      anchor: null,
      text: prev?.text,
    }));
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

  useEffect(() => {
    const handleHashChange = () => {
      requestAnimationFrame(() => {
        const hash = window.location.hash.replace("#", "");
        const allowedHashes = [
          "home",
          "labels",
          "reminders",
          "archive",
          "trash",
        ];

        if (
          allowedHashes.includes(hash.toLocaleLowerCase()) ||
          hash.startsWith("label/")
        ) {
          const event = new CustomEvent("sectionChange", {
            detail: { hash: hash },
          });
          window.dispatchEvent(event);

          // const setHash = hash.replace("label/", "");

          setCurrentHash(hash);
        } else if (
          !hash.toLowerCase().startsWith("note/") &&
          !hash.toLowerCase().startsWith("search")
        ) {
          setCurrentHash("home");
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

  const GUTTER = 15;

  const calculateVerticalLayout = useCallback(() => {
    if (layoutFrameRef.current) {
      cancelAnimationFrame(layoutFrameRef.current);
    }

    layoutFrameRef.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;

      container.style.position = "relative";

      let y = 0;
      const items = container.children;
      Array.from(items).forEach((ref) => {
        if (!ref) return;
        ref.style.position = "absolute";
        ref.style.transform = `translateY(${y}px)`;
        y += ref.offsetHeight + GUTTER;
      });

      container.style.height = `${0}px`;
    });
  }, []);

  const [pageMounted, setPageMounted] = useState(false);

  useEffect(() => {
    if (!labelsReady || !currentSection) return;
    requestAnimationFrame(() => {
      setTimeout(() => {
        setPageMounted(true);
      }, 500);
    });
  }, [labelsReady, currentSection]);

  const handleAddTooltip = (e) => {
    const section = currentSection.toLowerCase();
    if (section === "home") {
      handleMouseEnter(e, "New note");
    } else if (section === "labels") {
      handleMouseEnter(e, "New label");
    } else if (section === "trash") {
      handleMouseEnter(e, "Empty trash");
    } else {
      handleMouseEnter(e, "New note");
    }
  };

  const draggedUUIDRef = useRef(null);
  const overUUIDRef = useRef(null);

  const handleDragStart = (labelUUID) => {
    if (isDragging) return;
    setIsDragging(labelUUID);
    draggedUUIDRef.current = labelUUID;
    closeToolTip();
    document.body.classList.add("dragging-sidebar");

    const handleDragEnd = () => {
      swapPinnedLabels(labelUUID, overUUIDRef.current);
      setIsDragging(null);
      overUUIDRef.current = null;
      draggedUUIDRef.current = null;

      document.body.classList.remove("dragging-sidebar");
      document.removeEventListener("mouseup", handleDragEnd);
    };

    document.addEventListener("mouseup", handleDragEnd);
  };

  if (!currentSection) return;

  if (currentHash === null) return;

  return (
    <>
      <aside className="sidebar">
        <button
          onMouseEnter={handleAddTooltip}
          onMouseLeave={handleMouseLeave}
          ref={addButtonRef}
          onClick={handleAddNote}
          id="add-btn"
          className="add-button-icon pulse-button"
        >
          <AddButton />
        </button>
        <div
          ref={containerRef}
          className={`sidebar-icons-container ${
            isDragging ? "side-dragging" : ""
          }`}
        >
          <AnimatePresence>
            {navItems.map(({ type, name, hash, Icon, uuid: labelUUID }) => (
              <SideBtn
                key={labelUUID || hash}
                type={type}
                name={name}
                hash={hash}
                Icon={Icon}
                labelUUID={labelUUID}
                currentHash={currentHash}
                setTooltipAnchor={setTooltipAnchor}
                calculateVerticalLayout={calculateVerticalLayout}
                pageMounted={pageMounted}
                containerRef={containerRef}
                handleDragStart={handleDragStart}
                overUUIDRef={overUUIDRef}
                isDragging={isDragging}
              />
            ))}
            {/* <span className="copyright-text">&copy; {currentYear}</span> */}
          </AnimatePresence>
        </div>
        <div style={{ height: "2rem", width: "2rem" }} />
      </aside>
      <RightTooltip anchorEl={tooltipAnchor} />
    </>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
