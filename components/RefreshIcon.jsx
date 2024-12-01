import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import CloudIcon from "./cloudIcon";

const RefreshIcon = ({ size = 25, color = "currentColor", isLoading }) => {
  const [cloudShow, setCloudShow] = useState(true);
  return (
    <>
      {!isLoading && (
        <>
          {cloudShow && (
            <AnimatePresence mode="wait">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.5 } }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => {
                  setTimeout(() => {
                    setCloudShow(false);
                  }, 1000);
                }}
                style={{ position: "absolute", height: "24px" }}
              >
                <CloudIcon />
              </motion.span>
            </AnimatePresence>
          )}

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            style={{ position: "absolute", height: "24px" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={color}
            >
              <path d="M13 9v2h7V4h-2v2.74C16.53 5.07 14.4 4 12 4c-2.21 0-4.21.9-5.66 2.34S4 9.79 4 12c0 4.42 3.58 8 8 8 2.21 0 4.21-.9 5.66-2.34l-1.42-1.42A5.98 5.98 0 0 1 12 18c-3.31 0-6-2.69-6-6 0-1.65.67-3.15 1.76-4.24A5.98 5.98 0 0 1 12 6a6.01 6.01 0 0 1 5.19 3H13z" />
            </svg>
          </motion.span>
        </>
      )}
    </>
  );
};

export default RefreshIcon;
