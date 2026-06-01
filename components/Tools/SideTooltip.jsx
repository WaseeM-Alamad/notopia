import { Popper } from "@mui/material";
import { motion } from "framer-motion";
import React from "react";

const SideTooltip = ({ text, anchor, Xi = 10 }) => {
  const XiPx = Xi + "px";
  const XfPx = Math.abs(Xi + 3) + "px";
  return (
    <Popper
      open={true}
      anchorEl={anchor}
      style={{ zIndex: "999" }}
      placement="right"
      modifiers={[
        {
          name: "preventOverflow",
          options: {
            boundariesElement: "viewport",
          },
        },
      ]}
    >
      <motion.div
        initial={{
          transform: `translateY(-50%) translateX(${XiPx}) scale(0.97)`,
          opacity: 0,
        }}
        animate={{
          transform: `translateY(-50%) translateX(${XfPx}) scale(1)`,
          opacity: 1,
        }}
        exit={{
          transform: `translateY(-50%) translateX(${XiPx}) scale(0.97)`,
          opacity: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 600,
          damping: 40,
          mass: 1.05,
        }}
        className="right-tooltip"
      >
        <div
          style={{
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {text}
        </div>
      </motion.div>
    </Popper>
  );
};

export default SideTooltip;
