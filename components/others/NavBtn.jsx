import { AnimatePresence, motion } from "framer-motion";
import React, { memo, useEffect, useState } from "react";
import MoreMenu from "./MoreMenu";
import { useAppContext } from "@/context/AppContext";

const NavBtn = ({
  type,
  name,
  hash,
  currentHash,
  Icon,
  labelUUID,
  setTooltipAnchor,
  calculateVerticalLayout,
  pageMounted,
}) => {
  const { handlePin, labelsRef } = useAppContext();
  const [mounted, setMounted] = useState(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

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

  return (
    <>
      <motion.div
        key={hash}
        onContextMenu={(e) => {
          e.preventDefault();
          closeToolTip();

          const virtualAnchor = {
            getBoundingClientRect: () =>
              new DOMRect(
                e.pageX - window.scrollX,
                e.pageY - window.scrollY,
                0,
                0
              ),
            contextElement: document.body,
          };

          setAnchorEl({ ...virtualAnchor, navTitle: name });
          setMoreMenuOpen(true);
        }}
        className={`link-btn ${
          decodeURIComponent(currentHash).toLowerCase() === name.toLowerCase()
            ? "link-btn-selected"
            : ""
        }`}
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
        onMouseEnter={(e) => handleMouseEnter(e, name)}
        onMouseLeave={handleMouseLeave}
        id={hash}
        tabIndex="-1"
        onClick={(e) => handleIconClick(e, hash)}
        style={{
          zIndex: "9",
          transition: mounted && pageMounted ? "transform 0.2s ease" : "none",
        }}
      >
        <Icon />
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

export default memo(NavBtn);
