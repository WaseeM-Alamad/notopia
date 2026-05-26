import { motion } from "framer-motion";
import React, { memo } from "react";

const HoverNotifBox = ({
  right,
  top,
  onMouseEnter,
  onMouseLeave,
  hoverNotifBoxRef,
}) => {
  return (
    <motion.div
      ref={hoverNotifBoxRef}
      initial={{
        x: -6,
        opacity: 0,
      }}
      animate={{
        x: 0,
        opacity: 1,
      }}
      exit={{
        x: -6,
        opacity: 0,
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 40,
        mass: 1.05,
      }}
      className="hover-notif-box"
      style={{
        top: top + "px",
        right: right + "px",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    ></motion.div>
  );
};

export default memo(HoverNotifBox);
