"use client";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "@/assets/styles/home.css";
import { useAppContext } from "@/context/AppContext";
import Label from "../others/Label";
import { v4 as uuid } from "uuid";
import { motion } from "framer-motion";

const COLUMN_WIDTH = 240;
const GUTTER = 15;

const Labels = memo(
  ({
    setTooltipAnchor,
    dispatchNotes,
    openSnackFunction,
    handleDeleteLabel,
    rootContainerRef,
  }) => {
    const { createLabel, labelsRef, labelsReady } = useAppContext();
    const [reRender, triggerReRender] = useState(false);
    const containerRef = useRef(null);
    const resizeTimeoutRef = useRef(null);
    const layoutFrameRef = useRef(null);

    const labelsExist = useMemo(() => {
      return !!labelsRef.current.size;
    }, [labelsReady, reRender, labelsRef.current]);

    const calculateLayout = useCallback(() => {
      if (layoutFrameRef.current) {
        cancelAnimationFrame(layoutFrameRef.current);
      }

      layoutFrameRef.current = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;

        const parent = container.parentElement;
        const parentWidth = parent.clientWidth;
        const style = window.getComputedStyle(parent);
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingRight = parseFloat(style.paddingRight) || 0;
        const availableWidth = parentWidth - paddingLeft - paddingRight;

        const columns = Math.max(
          1,
          Math.floor(availableWidth / (COLUMN_WIDTH + GUTTER))
        );
        const contentWidth = columns * (COLUMN_WIDTH + GUTTER) - GUTTER;

        container.style.width = `${contentWidth}px`;
        container.style.maxWidth = "100%";
        container.style.position = "relative";
        container.style.left = "50%";
        container.style.transform = "translateX(-50%)";

        const items = container.children;

        const positionItems = (itemList) => {
          const columnHeights = new Array(columns).fill(0);

          itemList.forEach((item) => {
            const minColumnIndex = columnHeights.indexOf(
              Math.min(...columnHeights)
            );
            const x = minColumnIndex * (COLUMN_WIDTH + GUTTER);
            const y = columnHeights[minColumnIndex];

            item.style.transform = `translate(${x}px, ${y}px)`;
            item.style.position = "absolute";

            columnHeights[minColumnIndex] += item.offsetHeight + GUTTER;
          });

          return Math.max(...columnHeights);
        };

        const totalHeight = positionItems(Array.from(items));
        container.style.height = `${totalHeight}px`;
      });
    }, []);

    const debouncedCalculateLayout = useCallback(() => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        calculateLayout();
      }, 100);
    }, [calculateLayout, reRender]);

    const handleCreateLabel = () => {
      const newUUID = uuid();
      let newLabel = "New label";
      [...labelsRef.current].map(([uuid, labelData]) => {
        const existingLabel = labelData.label.toLowerCase();

        if (
          existingLabel.replace(/\d+/g, "").trim().toLowerCase() === "new label"
        ) {
          const num = existingLabel.match(/\d+/)?.[0];
          if (num !== undefined) {
            newLabel = `New label ${parseInt(num, 10) + 1}`;
          } else {
            newLabel = `New label 2`;
          }
        }
      });

      const createdAt = new Date();
      createLabel(newUUID, newLabel, createdAt);
      triggerReRender((prev) => !prev);
      setTimeout(() => {
        const element = document.querySelector(
          '.section-container [data-index="0"]'
        );
        element.focus();
      }, 10);
    };

    useEffect(() => {
      window.addEventListener("addLabel", handleCreateLabel);
      return () => window.removeEventListener("addLabel", handleCreateLabel);
    }, []);

    useEffect(() => {
      calculateLayout();
      window.addEventListener("resize", debouncedCalculateLayout);

      return () => {
        window.removeEventListener("resize", debouncedCalculateLayout);
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }
        if (layoutFrameRef.current) {
          cancelAnimationFrame(layoutFrameRef.current);
        }
      };
    }, [calculateLayout, debouncedCalculateLayout, reRender]);

    return (
      <>
        <div ref={rootContainerRef} className="starting-div">
          
          <div ref={containerRef} className="section-container">
            {/* <NewLabel triggerReRender={triggerReRender} /> */}
            {[...labelsRef.current]
              .reverse()
              .map(([uuid, labelData], index) => {
                return (
                  <Label
                    index={index === 0 ? index : ""}
                    setTooltipAnchor={setTooltipAnchor}
                    handleDeleteLabel={handleDeleteLabel}
                    key={uuid}
                    dispatchNotes={dispatchNotes}
                    labelData={labelData}
                    triggerReRender={triggerReRender}
                    calculateLayout={calculateLayout}
                    openSnackFunction={openSnackFunction}
                  />
                );
              })}
          </div>
          <div className="empty-page">
            {labelsReady && !labelsExist && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 800,
                  damping: 50,
                  mass: 1,
                }}
                className="empty-page-box"
              >
                <div className="empty-page-labels" />
                Labels you add appear here
              </motion.div>
            )}
            {!labelsReady && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 800,
                  damping: 50,
                  mass: 1,
                }}
                className="empty-page-box"
              >
                <div className="empty-page-loading" />
                Loading labels...
              </motion.div>
            )}
          </div>
        </div>
      </>
    );
  }
);

Labels.displayName = "Labels";

export default Labels;
