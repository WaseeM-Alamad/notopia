import { motion } from "framer-motion";
import React from "react";

const ImageDropZone = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.98 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="drop-overlay"
    >
      <div className="drop-zone-content">
        <h2 className="drop-text">Drop images here</h2>
      </div>

      <svg className="drop-zone-outline">
        <rect
          x="3"
          y="3"
          width="calc(100% - 6px)"
          height="calc(100% - 6px)"
          rx="11.2"
          ry="11.2"
          className="animated-dash"
        />
      </svg>
    </motion.div>
  );
};

export default ImageDropZone;
