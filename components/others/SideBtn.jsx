import { AnimatePresence, motion } from "framer-motion";
import React, { memo, useEffect, useRef, useState } from "react";
import Menu from "./Menu";
import { useAppContext } from "@/context/AppContext";
import SideTooltip from "../Tools/SideTooltip";
import { useLabelsContext } from "@/context/LabelsContext";

const SideBtn = ({
  type,
  name,
  hash,
  currentHash,
  Icon,
  labelUUID,
  calculateVerticalLayout,
  pageMounted,
  containerRef,
  handleDragStart,
  setOverUUID,
  overUUID,
  isDragging,
}) => {
  const { currentSection } = useAppContext();
  const { handlePin, labelsRef } = useLabelsContext();
  const [mounted, setMounted] = useState(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [tooltipAnc, setTooltipAnc] = useState(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const selected = () => {
    const decodedCurrentHash = decodeURIComponent(currentHash).toLowerCase();
    const section = currentSection.toLowerCase();
    if (section === "dynamiclabel") {
      const decodedBtnHash = decodeURIComponent(hash).toLowerCase();
      return type === "label" && decodedCurrentHash === decodedBtnHash;
    } else {
      return type === "nav" && section === name.toLowerCase();
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        setMounted(true);
      }, 50);
    });

    return () => {
      calculateVerticalLayout();
    };
  }, []);

  const handleContextMenu = (e) => {
    e.preventDefault();

    hideSideTooltip();
    const scrollContainer = containerRef.current;
    const currentTarget = e.currentTarget;
    let virtualAnchor = null;

    const sidebarClosed = document.body.classList.contains("sidebar-closed");

    if (sidebarClosed) {
      virtualAnchor = {
        getBoundingClientRect: () => {
          const targetRect = currentTarget.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();

          const offsetX =
            targetRect.left - containerRect.left + scrollContainer.scrollLeft;
          const offsetY =
            targetRect.top - containerRect.top + scrollContainer.scrollTop;

          return new DOMRect(
            containerRect.left + offsetX - scrollContainer.scrollLeft,
            containerRect.top + offsetY - scrollContainer.scrollTop,
            targetRect.width,
            targetRect.height,
          );
        },
        contextElement: scrollContainer,
      };
    } else {
      virtualAnchor = {
        getBoundingClientRect: () =>
          new DOMRect(e.pageX - window.scrollX, e.pageY - window.scrollY, 0, 0),
        contextElement: document.body,
      };
    }

    setAnchorEl({ ...virtualAnchor, navTitle: name });
    setMoreMenuOpen(true);
  };

  const handleIconClick = (e, hash) => {
    hideSideTooltip();
    window.innerWidth < 605 && window.dispatchEvent(new Event("close-sidebar"));
    const currentHash = window.location.hash.replace("#", "");
    if (hash === currentHash.toLowerCase()) return;
    e.preventDefault();
    e.stopPropagation();

    history.pushState(null, null, `#${hash}`);

    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  const unpinLabel = () => {
    handlePin(labelUUID);
    window.dispatchEvent(new Event("refreshPinnedLabels"));
    setMoreMenuOpen(false);
  };

  const navToSection = () => {
    const currentHash = window.location.hash.replace("#", "");
    if (hash === currentHash.toLowerCase()) {
      setMoreMenuOpen(false);
      return;
    }
    if (type === "label") {
      const labelData = labelsRef.current.get(labelUUID);
      const encodedLabel = encodeURIComponent(labelData.label);
      history.pushState(null, null, `#label/${encodedLabel.toLowerCase()}`);

      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } else {
      history.pushState(null, null, `#${hash.toLowerCase()}`);

      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
    setMoreMenuOpen(false);
  };

  const menuItems = [
    {
      title: type === "label" ? "Unpin label" : "",
      function: unpinLabel,
      icon: "unpin-menu-icon",
    },
    {
      title: "Navigate",
      function: navToSection,
      icon: "nav-menu-icon",
    },
  ];

  const handleMouseDown = (e) => {
    if (e.button !== 0 || type !== "label") {
      return;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const targetElement = e.currentTarget;
    const target = e.target;

    const detectDrag = (event) => {
      const deltaX = Math.abs(event.clientX - startX);
      const deltaY = Math.abs(event.clientY - startY);

      if (deltaX > 5 || deltaY > 5) {
        handleDragStart(labelUUID);
        document.removeEventListener("mousemove", detectDrag);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", detectDrag);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", detectDrag);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleDragOver = (labelUUID) => {
    if ((type === "label" || name === "Reminders") && isDragging) {
      setOverUUID(labelUUID);
    }
  };

  const tooltipTimeoutRef = useRef(null);

  const showSideTooltip = (e) => {
    const sidebarOpen = document.body.classList.contains("sidebar-open");
    const isSmallScreen = window.innerWidth < 605;

    if (moreMenuOpen || isSmallScreen || sidebarOpen) return;
    const scrollContainer = containerRef.current;
    const currentTarget = e.currentTarget;
    clearTimeout(tooltipTimeoutRef.current);
    tooltipTimeoutRef.current = setTimeout(() => {
      const virtualAnchor = {
        getBoundingClientRect: () => {
          const targetRect = currentTarget.getBoundingClientRect();
          return new DOMRect(
            targetRect.left,
            targetRect.top,
            targetRect.width,
            targetRect.height,
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

  return (
    <>
      <motion.div
        initial={{
          marginRight: pageMounted ? 150 : 0,
          opacity: pageMounted ? 0 : 1,
        }}
        animate={{ marginRight: 0, opacity: 1 }}
        exit={{
          marginRight: pageMounted ? 150 : 0,
          opacity: pageMounted ? 0 : 1,
          transition: { duration: 0.16, ease: "easeInOut", type: "tween" },
        }}
        transition={{ type: "spring", stiffness: 800, damping: 50, mass: 1 }}
        className={`side-btn-wrapper ${
          overUUID === labelUUID ? "hovered-side-btn" : ""
        }`}
        style={{
          transition:
            mounted && pageMounted
              ? "transform 0.18s ease, background-color 0.2s ease"
              : "none",
        }}
        onMouseEnter={() => {
          handleDragOver(labelUUID);
        }}
      >
        <div
          key={hash}
          onContextMenu={handleContextMenu}
          className={`side-icon ${
            moreMenuOpen || isDragging === labelUUID ? "side-btn-active" : ""
          } ${selected() ? "selected" : ""} `}
          id={hash}
          tabIndex="-1"
          onClick={(e) => handleIconClick(e, hash)}
          onMouseEnter={showSideTooltip}
          onMouseLeave={hideSideTooltip}
          onMouseDown={handleMouseDown}
        >
          <Icon />
          <span className="side-btn-title">{name}</span>
        </div>
      </motion.div>
      <AnimatePresence>
        {tooltipOpen && <SideTooltip text={name} anchor={tooltipAnc} />}
      </AnimatePresence>
      <AnimatePresence>
        {moreMenuOpen && (
          <Menu
            setIsOpen={setMoreMenuOpen}
            anchorEl={anchorEl}
            isOpen={moreMenuOpen}
            menuItems={menuItems}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(SideBtn);
