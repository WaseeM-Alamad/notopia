import { Popper } from "@mui/material";
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
      <div
        style={{
          display: !display && "none",
          opacity: '0.9',
          pointerEvents: "none",
          backgroundColor: "rgb(32,33,36)",
          color: "white",
          fontFamily: "sans-serif",
          fontSize: "12px",
          letterSpacing: ".3px",
          lineHeight: "1rem",
          fontWeight: "350",
          width: "fit-content",
          textOverflow: "ellipsis",
          borderRadius: "0.3rem",
          padding: "0.3rem 0.5rem",
        }}
      >
        <div>{anchorEl?.text}</div>
      </div>
    </Popper>,
    document.getElementById("tooltipPortal")
  );
};

export default Tooltip;
