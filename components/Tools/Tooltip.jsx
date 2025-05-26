import { Popper } from "@mui/material";
import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const Tooltip = ({ anchorEl }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [display, setDisplay] = useState(false);
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

  if (!isMounted) return null;

  return createPortal(
    <Popper
      open={true}
      anchorEl={anchorEl?.anchor}
      style={{ zIndex: "3000" }}
      placement="bottom"
      modifiers={[
        {
          name: "preventOverflow",
          options: {
            boundariesElement: "window",
          },
        },
      ]}
    >
      <motion.div
        animate={{ opacity: display ? 1 : 0 }}
        transition={{ type: "tween", duration: 0.08, ease: "linear" }}
        className="tooltip"
        style={{
          display: !display && "none",
        }}
      >
        <div dir="auto">{anchorEl?.text}</div>
      </motion.div>
    </Popper>,
    document.getElementById("tooltipPortal")
  );
};

export default Tooltip;
