import { useAppContext } from "@/context/AppContext";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect } from "react";
import HorizontalLoader from "../Tools/HorizontalLoader";

const SplashScreen = () => {
  const { initialLoading } = useAppContext();

  return (
    <AnimatePresence>
      {initialLoading && (
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -150 }}
          transition={{
            opacity: { duration: 0.2 },
            y: { type: "spring", stiffness: 300, damping: 30 },
          }}
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            zIndex: "1000000000000000000",
            backgroundColor: "var(--bg)",
            display: "flex",
            flexDirection: "column",
            gap: "0rem",
            justifyContent: "center",
            alignItems: "center",
            height: "100dvh",
            userSelect: "none",
          }}
          key="splash"
        >
          <div className="splash-wrapper">
            <span
              style={{
                fontSize: "3.3rem",
                letterSpacing: "0.3rem",
                color: "var(--notopia)",
                fontWeight: "bold",
              }}
            >
              Notopia
            </span>

            <HorizontalLoader color="var(--notopia)" size={0.8} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
