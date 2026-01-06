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
import AddButton from "../icons/AddButton";
import LabelIcon from "../icons/LabelIcon";
import FolderIcon from "../icons/FolderIcon";
import { useAppContext } from "@/context/AppContext";
import SideButtons from "./SideButtons";
import SideTooltip from "../Tools/SideTooltip";
import { AnimatePresence } from "framer-motion";
import FloatingButton from "./FloatingButton";

const Sidebar = memo(() => {
  const {
    labelsRef,
    labelsReady,
    swapPinnedLabels,
    currentSection,
    addButtonRef,
    setIsExpanded,
    isExpanded,
    status,
    session,
    initialLoading
  } = useAppContext();
  const containerRef = useRef(null);
  const [currentHash, setCurrentHash] = useState(null);
  const [tooltipAnc, setTooltipAnc] = useState(null);
  const [isDragging, setIsDragging] = useState(null);
  const [actionTitle, setActionTitle] = useState("");
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [triggerFloatingBtn, setTriggerFloatingBtn] = useState(false);

  const layoutFrameRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);

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
      const width = window.innerWidth;
      setTriggerFloatingBtn(width < 605);
    };

    handler();

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
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
    hideSideTooltip();
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

  const GUTTER = 0;

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

      // container.style.height = `${0}px`;
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

  useEffect(() => {
    if (!currentSection) return;
    const section = currentSection.toLowerCase();
    if (section === "home") {
      setActionTitle("New note");
    } else if (section === "labels") {
      setActionTitle("New label");
    } else if (section === "trash") {
      setActionTitle("Empty Trash");
    } else {
      setActionTitle("New note");
    }
  }, [currentSection]);

  const draggedUUIDRef = useRef(null);
  const [overUUID, setOverUUID] = useState(null);
  const overUUIDRef = useRef(null);

  useEffect(() => {
    overUUIDRef.current = overUUID;
  }, [overUUID]);

  const handleDragStart = useCallback(
    (labelUUID) => {
      if (isDragging) return;
      setIsDragging(labelUUID);
      draggedUUIDRef.current = labelUUID;
      document.body.classList.add("dragging-sidebar");

      const handleDragEnd = () => {
        if (overUUIDRef.current !== draggedUUIDRef.current) {
          swapPinnedLabels(labelUUID, overUUIDRef.current);
        }
        setIsDragging(null);
        setOverUUID(null);
        draggedUUIDRef.current = null;

        document.body.classList.remove("dragging-sidebar");
        document.removeEventListener("mouseup", handleDragEnd);
      };

      document.addEventListener("mouseup", handleDragEnd);
    },
    [isDragging, overUUID]
  );

  const showSideTooltip = (e) => {
    if (isExpanded.open) return;
    const scrollContainer = containerRef.current;
    const currentTarget = e.currentTarget;
    tooltipTimeoutRef.current = setTimeout(() => {
      const virtualAnchor = {
        getBoundingClientRect: () => {
          const targetRect = currentTarget.getBoundingClientRect();
          return new DOMRect(
            targetRect.left,
            targetRect.top,
            targetRect.width,
            targetRect.height
          );
        },
        contextElement: scrollContainer,
      };
      setTooltipAnc(virtualAnchor);
      setTooltipOpen(true);
    }, 100);
  };

  const hideSideTooltip = () => {
    clearTimeout(tooltipTimeoutRef.current);
    setTooltipAnc(null);
    setTooltipOpen(false);
  };

  if (
    currentHash === null ||
    !currentSection ||
    (!session?.user && status === "authenticated" && status === "loading") ||
    initialLoading
  ) {
    return;
  }

  return (
    <>
      <div
        className={`aside-wrapper ${isExpanded.open && isExpanded.threshold === "after" ? "menu-expanded" : ""} ${isExpanded.threshold === "before" ? "menu-expanded" : ""} ${isExpanded.open && isExpanded.threshold === "before" ? "side-mobile-open" : ""}`}
        onClick={() => {
          setIsExpanded((prev) => ({ ...prev, open: false }));
        }}
      >
        <aside
          className={`${isDragging ? "side-dragging" : ""} ${isExpanded.threshold === "before" && isExpanded.open ? "sidebar-shadow" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence>
            {triggerFloatingBtn && (
              <FloatingButton
                addButtonRef={addButtonRef}
                handleAddNote={handleAddNote}
              />
            )}
          </AnimatePresence>

          {!triggerFloatingBtn && (
            <button
              ref={addButtonRef}
              onClick={handleAddNote}
              id="add-btn"
              className="add-btn add-btn-expand side-add-btn"
              onMouseEnter={showSideTooltip}
              onMouseLeave={hideSideTooltip}
            >
              <AnimatePresence>
                {tooltipOpen && (
                  <SideTooltip text={actionTitle} anchor={tooltipAnc} />
                )}
              </AnimatePresence>
              <AddButton />
              {/* <span className="side-btn-title">{actionTitle}</span> */}
            </button>
          )}

          <div ref={containerRef} className="btns-container">
            <SideButtons
              navItems={navItems}
              currentHash={currentHash}
              calculateVerticalLayout={calculateVerticalLayout}
              pageMounted={pageMounted}
              containerRef={containerRef}
              handleDragStart={handleDragStart}
              setOverUUID={setOverUUID}
              overUUID={overUUID}
              isDragging={isDragging}
              isExpanded={isExpanded}
              setIsExpanded={setIsExpanded}
            />
          </div>
          <div style={{ height: "2rem", width: "2rem" }} />
        </aside>
      </div>
    </>
  );
});

Sidebar.displayName = "Sidebar";

export default memo(Sidebar);
