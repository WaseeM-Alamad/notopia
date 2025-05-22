import { Popper } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const Tooltip = ({ anchorEl, angle = "bottom" }) => {
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
      placement={angle}
      modifiers={[
        {
          name: "preventOverflow",
          options: {
            boundariesElement: "window",
          },
        },
      ]}
    >
      <div
        className={`${angle === "bottom" ? "tooltip": "right-tooltip"}`}
        style={{
          display: !display && "none",
        }}
      >
        <div>{anchorEl?.text}</div>
      </div>
    </Popper>,
    document.getElementById("tooltipPortal")
  );
};

export default Tooltip;
