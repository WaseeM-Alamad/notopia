"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import "@/assets/styles/home.css";
import { AnimatePresence, motion } from "framer-motion";
import { useSearch } from "@/context/SearchContext";
import FilteredNote from "./FilteredNote";

const COLUMN_WIDTH = 240;
const GUTTER = 15;

const NoteWrapper = memo(
  ({
    note,
    noteActions,
    ref,
    setSelectedNotesIDs,
    dispatchNotes,
    selectedNotes,
    index,
    setTooltipAnchor,
    openSnackFunction,
    handleNoteClick,
    handleSelectNote,
    calculateLayout,
    fadingNotes,
  }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setTimeout(() => {
        setMounted(true);
      }, 100);
    }, []);

    return (
      <motion.div
        ref={ref}
        className={`grid-item ${fadingNotes.has(note.uuid) ? "fade-out" : ""}`}
        onClick={(e) => handleNoteClick(e, note, index)}
        style={{
          width: `${COLUMN_WIDTH}px`,
          marginBottom: `${GUTTER}px`,
          visibility: mounted ? "visible" : "hidden", // Hide until ready
          transition: `transform ${
            mounted ? "0.22s" : "0"
          } cubic-bezier(0.5, 0.2, 0.3, 1), opacity 0s`,
        }}
      >
        <FilteredNote
          note={note}
          noteActions={noteActions}
          setSelectedNotesIDs={setSelectedNotesIDs}
          selectedNotes={selectedNotes}
          dispatchNotes={dispatchNotes}
          setTooltipAnchor={setTooltipAnchor}
          openSnackFunction={openSnackFunction}
          handleNoteClick={handleNoteClick}
          handleSelectNote={handleSelectNote}
          index={index}
          calculateLayout={calculateLayout}
        />
        {/* <p>{index}</p> */}
      </motion.div>
    );
  }
);

NoteWrapper.displayName = "NoteWrapper";

const Home = memo(
  ({
    notes,
    order,
    filteredNotes,
    setNoMatchingNotes,
    dispatchNotes,
    setTooltipAnchor,
    openSnackFunction,
    setSelectedNotesIDs,
    handleNoteClick,
    handleSelectNote,
    noteActions,
    setFadingNotes,
    fadingNotes,
    filters,
  }) => {
    const { searchTerm } = useSearch();
    const containerRef = useRef(null);
    const resizeTimeoutRef = useRef(null);
    const layoutFrameRef = useRef(null);
    const [layoutReady, setLayoutReady] = useState(false); // New state to track layout completion

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

        // Set layout as ready after calculations
        setLayoutReady(true);
      });
    }, []);

    const debouncedCalculateLayout = useCallback(() => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        calculateLayout();
      }, 100);
    }, [calculateLayout]);

    // Initialize layout on component mount
    useEffect(() => {
      // Set layoutReady to false before any new calculations
      setLayoutReady(false);
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
    }, [calculateLayout, debouncedCalculateLayout, notes]);

    // Run additional layout calculation after initial render
    useEffect(() => {
      if (notes.length > 0) {
        setLayoutReady(false); // Reset layout state
        // Use multiple timing attempts to ensure layout is calculated properly
        const immediateTimer = requestAnimationFrame(calculateLayout);
        const backupTimer = setTimeout(calculateLayout, 50);
        const finalTimer = setTimeout(calculateLayout, 150);

        return () => {
          cancelAnimationFrame(immediateTimer);
          clearTimeout(backupTimer);
          clearTimeout(finalTimer);
        };
      }
    }, [notes, calculateLayout]);

    useEffect(() => {
      setLayoutReady(false);
      calculateLayout();
    }, [searchTerm, calculateLayout]);

    // Add CSS class for fade-in effect
    useEffect(() => {
      if (containerRef.current && layoutReady) {
        containerRef.current.classList.add("layout-ready");
      } else if (containerRef.current) {
        containerRef.current.classList.remove("layout-ready");
      }
    }, [layoutReady]);
    const filtersExist = () => {
      return (
        Object.values(filters).some((filter) => filter !== null) ||
        searchTerm.trim() !== ""
      );
    };

    const matchesFilters = (note) => {
      if (filters.color && note.color !== filters.color) {
        return false;
      }

      if (
        searchTerm &&
        !(
          note.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase().trim())
        )
      ) {
        return false;
      }

      if (filters.label && !note.labels.includes(filters.label)) {
        return false;
      }

      if (filters.image && note.images.length === 0) {
        return false;
      }

      return true;
    };

    return (
      <>
        <div ref={containerRef} className="section-container">
          {order.map((uuid, index) => {
            if (!filteredNotes.has(uuid)) return;
            const note = notes.get(uuid);
            return (
              <NoteWrapper
                key={note.uuid}
                note={note}
                noteActions={noteActions}
                dispatchNotes={dispatchNotes}
                index={index}
                setSelectedNotesIDs={setSelectedNotesIDs}
                setTooltipAnchor={setTooltipAnchor}
                openSnackFunction={openSnackFunction}
                handleNoteClick={handleNoteClick}
                handleSelectNote={handleSelectNote}
                calculateLayout={calculateLayout}
                fadingNotes={fadingNotes}
              />
            );
          })}
        </div>
      </>
    );
  }
);

export default Home;
