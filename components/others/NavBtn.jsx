import { motion } from "framer-motion";
import React, { memo, useEffect, useState } from "react";

const NavBtn = ({
  name,
  hash,
  currentHash,
  Icon,
  setTooltipAnchor,
  calculateVerticalLayout,
  pageMounted,
}) => {
  const [mounted, setMounted] = useState(null);

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

  return (
    <motion.div
      key={hash}
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
  );
};

export default memo(NavBtn);
