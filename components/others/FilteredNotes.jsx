"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import "@/assets/styles/home.css";
import { AnimatePresence, motion } from "framer-motion";
import { useSearch } from "@/context/SearchContext";
import FilteredNote from "./FilteredNote";

const COLUMN_WIDTH = 240;
const GUTTER = 15;
const GAP_BETWEEN_SECTIONS = 88;

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
    notesStateRef,
    notes,
    order,
    filteredNotes,
    dispatchNotes,
    setTooltipAnchor,
    openSnackFunction,
    setSelectedNotesIDs,
    handleNoteClick,
    handleSelectNote,
    noteActions,
    fadingNotes,
    filters,
  }) => {
    const { searchTerm } = useSearch();
    const containerRef = useRef(null);
    const resizeTimeoutRef = useRef(null);
    const layoutFrameRef = useRef(null);
    const [layoutReady, setLayoutReady] = useState(false); // New state to track layout completion
    const [unarchivedHeight, setUnarchivedHeight] = useState(null);
    const [hasUnpinnedNotes, setHasUnpinnedNotes] = useState(false);
    const [hasArchivedNotes, setHasArchivedNotes] = useState(false);

    const filteredNotesRef = useRef(null);

    useEffect(() => {
      filteredNotesRef.current = filteredNotes;
    }, [filteredNotes]);

    // if (!filteredNotes.has(uuid)) return;

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

        // Get all the items in the container
        // const items = Array.from(container.children);
        const items = notesStateRef.current.order.map((uuid, index) => {
          const note = notesStateRef.current.notes.get(uuid);
          return { ...note, index: index };
        });

        // Sort items based on their position value (ascending order)
        const sortedItems = items.sort((a, b) => {
          return a.index - b.index; // Ascending order
        });

        // Filter out pinned and unpinned items
        const unarchivedItems = sortedItems.filter((item) => {
          if (!filteredNotesRef.current.has(item.uuid)) return false;
          return item.isArchived === false;
        });
        const archivedItems = sortedItems.filter((item) => {
          if (!filteredNotesRef.current.has(item.uuid)) return false;
          return item.isArchived === true;
        });

        const positionItems = (itemList, startY = 0) => {
          const columnHeights = new Array(columns).fill(startY);

          itemList.forEach((item) => {
            const wrapper = item.ref?.current?.parentElement;

            if (!wrapper) {
              return;
            }

            const minColumnIndex = columnHeights.indexOf(
              Math.min(...columnHeights)
            );
            const x = minColumnIndex * (COLUMN_WIDTH + GUTTER);
            const y = columnHeights[minColumnIndex];

            wrapper.style.transform = `translate(${x}px, ${y}px)`;
            wrapper.style.position = "absolute";

            columnHeights[minColumnIndex] += wrapper.offsetHeight + GUTTER;
          });

          return Math.max(...columnHeights);
        };

        // Gap between pinned and unpinned sections
        const gapBetweenSections =
          unarchivedItems.length > 0 ? GAP_BETWEEN_SECTIONS : 0;

        const unarchivedHeight = positionItems(unarchivedItems, 0);
        const archivedHeight = positionItems(
          archivedItems,
          unarchivedHeight + gapBetweenSections
        );

        setHasUnpinnedNotes(!!unarchivedItems.length);

        setHasArchivedNotes(!!archivedItems.length);

        setUnarchivedHeight(unarchivedHeight);
        container.style.height = `${archivedHeight}px`;
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

    return (
      <>
        <div ref={containerRef} className="section-container">
          <p
            className="section-label"
            style={{
              top: `${unarchivedHeight + GAP_BETWEEN_SECTIONS + 2}px`,
              opacity: hasArchivedNotes && hasUnpinnedNotes ? "1" : "0",
            }}
          >
            ARCHIVED
          </p>
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
