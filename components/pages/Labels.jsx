"use client";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAppContext } from "@/context/AppContext";
import Label from "../others/Label";
import { v4 as uuid } from "uuid";
import { motion } from "framer-motion";
import { useSearch } from "@/context/SearchContext";

const GUTTER = 15;

const Labels = memo(
  ({
    setTooltipAnchor,
    visibleItems,
    setVisibleItems,
    setFadingNotes,
    dispatchNotes,
    fadingNotes,
    openSnackFunction,
    handleDeleteLabel,
    rootContainerRef,
    containerRef,
    isGrid,
  }) => {
    const { createLabel, labelsRef, labelsReady, layout } = useAppContext();
    const { labelSearchTerm } = useSearch();
    const [reRender, triggerReRender] = useState(false);
    const resizeTimeoutRef = useRef(null);
    const layoutFrameRef = useRef(null);
    const isFirstRenderRef = useRef(true);

    const COLUMN_WIDTH = layout === "grid" ? 240 : 450;

    const noMatchingLabels =
      labelsReady &&
      labelSearchTerm.trim() &&
      ![...labelsRef.current].some(([, labelData]) => {
        const search = labelSearchTerm.trim().toLowerCase();
        const label = labelData.label.toLowerCase().trim();

        const matchesSearch = label.includes(search);

        return matchesSearch;
      });

    const labelsExist = !!labelsRef.current.size;

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

        const columns = !isGrid
          ? 1
          : Math.max(1, Math.floor(availableWidth / (COLUMN_WIDTH + GUTTER)));
        const contentWidth = !isGrid
          ? COLUMN_WIDTH
          : columns * (COLUMN_WIDTH + GUTTER) - GUTTER;

        container.style.width = `${contentWidth}px`;
        container.style.maxWidth = isGrid ? "100%" : "90%";
        container.style.position = "relative";
        container.style.left = "50%";
        container.style.transform = "translateX(-50%)";

        const items = container.children;

        const positionItems = (itemList) => {
          const columnHeights = new Array(columns).fill(0);

          itemList.forEach((item) => {
            if (item.classList.contains("labelInput")) return;
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
    }, [isGrid]);

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
      setVisibleItems((prev) => {
        const updated = new Set(prev);
        updated.add(newUUID);
        return updated;
      });
      triggerReRender((prev) => !prev);
      requestAnimationFrame(() => {
        const element = document.querySelector(
          '.section-container [data-index="0"]'
        );
        element.focus();
      });
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

    useEffect(() => {
      calculateLayout();
    }, [visibleItems]);

    useEffect(() => {
      if (isFirstRenderRef.current) return;

      triggerReRender((prev) => !prev);
    }, [labelSearchTerm]);

    return (
      <>
        <div ref={rootContainerRef} className="starting-div">
          <div ref={containerRef} className="section-container">
            {/* <NewLabel triggerReRender={triggerReRender} /> */}
            {[...labelsRef.current]
              .sort(
                ([, a], [, b]) => new Date(b.createdAt) - new Date(a.createdAt)
              )
              .map(([uuid, labelData], index) => {
                if (!visibleItems.has(uuid)) return null;
                return (
                  <Label
                    index={index === 0 ? index : ""}
                    setTooltipAnchor={setTooltipAnchor}
                    handleDeleteLabel={handleDeleteLabel}
                    key={uuid}
                    isGrid={isGrid}
                    dispatchNotes={dispatchNotes}
                    setFadingNotes={setFadingNotes}
                    fadingNotes={fadingNotes}
                    labelData={labelData}
                    triggerReRender={triggerReRender}
                    setVisibleItems={setVisibleItems}
                    calculateLayout={calculateLayout}
                    openSnackFunction={openSnackFunction}
                  />
                );
              })}
          </div>
          <div className="empty-page">
            {labelsReady && !labelsExist && !labelSearchTerm.trim() && (
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
            {noMatchingLabels && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 900,
                  damping: 50,
                  mass: 1,
                }}
                className="empty-page-box"
              >
                <div className="no-labels-found" />
                No matching labels
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
