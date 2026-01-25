import CloudIcon from "@/components/icons/CloudIcon";
import GridIcon from "@/components/icons/GridIcon";
import ListIcon from "@/components/icons/ListIcon";
import LocalSaveIcon from "@/components/icons/LocalSaveIcon";
import RefreshIcon from "@/components/icons/RefreshIcon";
import Button from "@/components/Tools/Button";
import CustomThreeLineSpinner from "@/components/Tools/CustomSpinner";
import { useAppContext } from "@/context/AppContext";
import { useLayout } from "@/context/LayoutContext";
import { useSearch } from "@/context/SearchContext";
import { AnimatePresence, motion } from "framer-motion";
import React, { useRef, useState, useEffect } from "react";

const NavButtons = () => {
  const { hideTooltip, showTooltip, isOnline } = useAppContext();
  const { layout } = useLayout();

  const [isLoading, setIsLoading] = useState(0);
  const [UpToDatetrigger, setUpToDateTrigger] = useState(true);
  const isGrid = layout === "grid";

  const isFirstRunRef = useRef(true);
  const timeoutRef = useRef(null);

  const handleRefresh = () => {
    if (!isLoading && UpToDatetrigger)
      window.dispatchEvent(new Event("refresh"));
  };

  useEffect(() => {
    const startLoading = () => {
      setIsLoading((prev) => prev + 1);
      clearTimeout(timeoutRef.current);
      setUpToDateTrigger(true);
    };
    const stopLoading = () => {
      setTimeout(() => {
        setIsLoading((prev) => {
          if (prev > 0) return prev - 1;
          return prev;
        });
      }, 800);
    };

    window.addEventListener("loadingStart", startLoading);
    window.addEventListener("loadingEnd", stopLoading);

    return () => {
      window.removeEventListener("loadingStart", startLoading);
      window.removeEventListener("loadingEnd", stopLoading);
    };
  }, []);

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    if (!isLoading) {
      setUpToDateTrigger(false);
      timeoutRef.current = setTimeout(() => {
        setUpToDateTrigger(true);
      }, 1100);
    }
  }, [isLoading]);

  return (
    <div style={{ marginLeft: "auto" }} className="top-icons">
      <Button
        onMouseEnter={(e) => showTooltip(e, isGrid ? "List view" : "Grid view")}
        onMouseLeave={hideTooltip}
        onFocus={(e) => showTooltip(e, isGrid ? "List view" : "Grid view")}
        onBlur={hideTooltip}
        onClick={() => window.dispatchEvent(new Event("toggleLayout"))}
        className="nav-btn layout-btn"
      >
        {isGrid ? <ListIcon /> : <GridIcon />}
      </Button>
      <Button
        disabled={(isLoading && UpToDatetrigger) || !UpToDatetrigger}
        className="nav-btn"
        onClick={handleRefresh}
        onMouseEnter={(e) => showTooltip(e, "Refresh")}
        onMouseLeave={hideTooltip}
        onFocus={(e) => showTooltip(e, "Refresh")}
        onBlur={hideTooltip}
      >
        <AnimatePresence>
          {!isLoading && UpToDatetrigger && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { delay: 0.1 } }}
              transition={{ duration: 0.2 }}
              style={{ position: "absolute", display: "flex" }}
            >
              <RefreshIcon />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isLoading && UpToDatetrigger && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { delay: 0.07 } }}
              transition={{ duration: 0.15 }}
              style={{ position: "absolute", display: "flex" }}
            >
              <CustomThreeLineSpinner
                size={20}
                strokeWidth={2.8}
                color={
                  document.documentElement.classList.contains("dark-mode")
                    ? "#dfdfdf"
                    : "#292929"
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!UpToDatetrigger && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.35 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.25 }}
              style={{ position: "absolute", display: "flex" }}
            >
              {isOnline ? <CloudIcon /> : <LocalSaveIcon />}
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </div>
  );
};

export default NavButtons;
