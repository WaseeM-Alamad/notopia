import { AnimatePresence, motion } from "framer-motion";
import React, { memo, useEffect, useState } from "react";
import MoreMenu from "./MoreMenu";
import { useAppContext } from "@/context/AppContext";

const SideBtn = ({
  type,
  name,
  hash,
  currentHash,
  Icon,
  labelUUID,
  setTooltipAnchor,
  calculateVerticalLayout,
  pageMounted,
  containerRef,
  handleDragStart,
  overUUIDRef,
  isDragging,
}) => {
  const { handlePin, labelsRef } = useAppContext();
  const [mounted, setMounted] = useState(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const selected = () => {
    const decodedCurrentHash = decodeURIComponent(currentHash).toLowerCase();

    if (currentHash.startsWith("label/")) {
      const decodedBtnHash = decodeURIComponent(hash).toLowerCase();
      return type === "label" && decodedCurrentHash === decodedBtnHash;
    } else {
      return type === "nav" && decodedCurrentHash === name.toLowerCase();
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

  const closeToolTip = () => {
    setTooltipAnchor((prev) => ({
      anchor: null,
      text: prev?.text,
    }));
  };

  const handleMouseEnter = (e, text) => {
    if (moreMenuOpen) return;
    const target = e.currentTarget;
    setTooltipAnchor({ anchor: target, text: text, display: true });
  };

  const handleMouseLeave = () => {
    setTooltipAnchor((prev) => ({
      ...prev,
      display: false,
    }));
  };

  const handleIconClick = (e, hash) => {
    const currentHash = window.location.hash.replace("#", "");
    if (hash === currentHash.toLowerCase()) return;
    e.preventDefault();
    e.stopPropagation();
    closeToolTip();

    // Update hash without triggering scroll, but preserve history
    history.pushState(null, null, `#${hash}`);

    // Manually trigger hashchange event so your other logic still works
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
        // if (
        // targetElement === noteRef.current &&
        // !target.classList.contains("not-draggable")
        // ) {
        handleDragStart(labelUUID);
        // }
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
      overUUIDRef.current = labelUUID;
    }
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
        className={`${
          overUUIDRef.current === labelUUID ? "hovered-side-btn" : ""
        }`}
        style={{
          transition:
            mounted && pageMounted
              ? "transform 0.17s ease, background-color 0.2s ease"
              : "none",
        }}
        onMouseEnter={()=> handleDragOver(labelUUID)}
      >
        <div
          key={hash}
          onContextMenu={(e) => {
            e.preventDefault();
            closeToolTip();

            const scrollContainer = containerRef.current;
            const currentTarget = e.currentTarget;

            const virtualAnchor = {
              getBoundingClientRect: () => {
                const targetRect = currentTarget.getBoundingClientRect();
                const containerRect = scrollContainer.getBoundingClientRect();

                const offsetX =
                  targetRect.left -
                  containerRect.left +
                  scrollContainer.scrollLeft;
                const offsetY =
                  targetRect.top -
                  containerRect.top +
                  scrollContainer.scrollTop;

                return new DOMRect(
                  containerRect.left + offsetX - scrollContainer.scrollLeft,
                  containerRect.top + offsetY - scrollContainer.scrollTop,
                  targetRect.width,
                  targetRect.height
                );
              },
              contextElement: scrollContainer,
            };

            setAnchorEl({ ...virtualAnchor, navTitle: name });
            setMoreMenuOpen(true);
          }}
          className={`link-btn ${
            moreMenuOpen || isDragging === labelUUID ? "side-btn-active" : ""
          } ${selected() ? "link-btn-selected" : ""} `}
          onMouseEnter={(e) => {
            handleMouseEnter(e, name);
          }}
          onMouseLeave={handleMouseLeave}
          id={hash}
          tabIndex="-1"
          onClick={(e) => handleIconClick(e, hash)}
          onMouseDown={handleMouseDown}
        >
          <Icon />
        </div>
      </motion.div>
      <AnimatePresence>
        {moreMenuOpen && (
          <MoreMenu
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
