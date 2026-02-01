import { Popper } from "@mui/material";
import { motion } from "framer-motion";
import React from "react";

const Tooltip = ({ anchorEl, text }) => {
  return (
    <Popper
      open={true}
      anchorEl={anchorEl}
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
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{
          type: "spring",
          stiffness: 800,
          damping: 40,
          mass: 1.05,
        }}
        className="tooltip"
      >
        <div
          dir="auto"
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

export default Tooltip;
