import { duration, Popper } from "@mui/material";
import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const RightTooltip = ({ anchorEl, margin = "20" }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [display, setDisplay] = useState(false);
  const anchor = anchorEl?.anchor;
  const timeoutRef = useRef(null);
  const isTooltipVisible = useRef(false); // Track tooltip visibility

  useEffect(() => {
    if (anchorEl?.display) {
      if (isTooltipVisible.current) {
        setDisplay(true);
      } else {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setDisplay(true);
          isTooltipVisible.current = true;
        }, 200);
      }
    } else {
      clearTimeout(timeoutRef.current);
      setDisplay(false);
      isTooltipVisible.current = false;
    }
  }, [anchorEl]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [pos, setPos] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setPos({
      top: rect.top + rect.height / 2,
      left: rect.right,
    });
  }, [anchor]);

  if (!isMounted) return null;

  return createPortal(
    <motion.div
      layout={false}
      animate={{
        display: display ? "block" : "none",
        left: pos.left,
        top: pos.top,
        marginLeft: display ? `20px` : "13px",
        opacity: display ? 1 : 0,
      }}
      transition={{
        marginLeft: { type: "spring", stiffness: 500, damping: 40, mass: 1.05 },
        opacity: { type: "spring", stiffness: 800, damping: 50, mass: 1 },
        display: { duration: 0 },
        left: { duration: 0 },
        top: { duration: 0 },
      }}
      className={"right-tooltip"}
      style={{
        display: !display && "none",
      }}
    >
      <div dir="auto">{anchorEl?.text}</div>
    </motion.div>,
    document.getElementById("tooltipPortal")
  );
};

export default RightTooltip;
