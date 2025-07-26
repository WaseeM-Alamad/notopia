"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSearch } from "@/context/SearchContext";
import { useAppContext } from "@/context/AppContext";
import Note from "./Note";

const GUTTER = 15;
const GAP_BETWEEN_SECTIONS = 88;

const NoteWrapper = memo(
  ({
    note,
    noteActions,
    ref,
    selectedNotesRef,
    setSelectedNotesIDs,
    dispatchNotes,
    selectedNotes,
    isGrid,
    index,
    handleNoteClick,
    handleSelectNote,
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, type: "tween" }}
      >
        <div
          ref={ref}
          className={`grid-item ${
            fadingNotes.has(note.uuid) ? "fade-out" : ""
          }`}
          onClick={(e) => handleNoteClick(e, note, index)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleNoteClick(e, note, index);
            }
          }}
          style={{
            maxWidth: `${isGrid ? 240 : 600}px`,
            minWidth: !isGrid && "15rem",
            width: "100%",
            marginBottom: `${GUTTER}px`,
            transition: `transform ${
              mounted ? "0.22s" : "0"
            } cubic-bezier(0.5, 0.2, 0.3, 1), opacity 0s`,
          }}
        >
          <Note
            note={note}
            noteActions={noteActions}
            selectedNotesRef={selectedNotesRef}
            setSelectedNotesIDs={setSelectedNotesIDs}
            selectedNotes={selectedNotes}
            dispatchNotes={dispatchNotes}
            handleNoteClick={handleNoteClick}
            handleSelectNote={handleSelectNote}
            index={index}
          />
          {/* <p>{index}</p> */}
        </div>
      </motion.div>
    );
  }
);

NoteWrapper.displayName = "NoteWrapper";

const FilteredNotes = memo(
  ({
    notesStateRef,
    notes,
    order,
    selectedNotesRef,
    filteredNotes,
    dispatchNotes,
    setSelectedNotesIDs,
    handleNoteClick,
    handleSelectNote,
    noteActions,
    fadingNotes,
    visibleItems,
    containerRef,
    isGrid,
  }) => {
    const { searchTerm } = useSearch();
    const { layout, calculateLayoutRef } = useAppContext();
    const resizeTimeoutRef = useRef(null);
    const layoutFrameRef = useRef(null);
    const [layoutReady, setLayoutReady] = useState(false); // New state to track layout completion
    const filteredNotesRef = useRef(null);
    const [pinnedHeight, setPinnedHeight] = useState(null);
    const [sectionsHeight, setSectionsHeight] = useState(null);

    const COLUMN_WIDTH = layout === "grid" ? 240 : 600;

    const hasPinned = [...visibleItems].some((uuid) => {
      const note = notes.get(uuid);
      return note?.isPinned;
    });

    const hasUnpinned = [...visibleItems].some((uuid) => {
      const note = notes.get(uuid);
      return !note?.isPinned && !note?.isArchived;
    });

    const hasArchivedNotes = [...visibleItems].some((uuid) => {
      const note = notes.get(uuid);
      return note?.isArchived;
    });

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
        const pinnedItems = sortedItems.filter((item) => {
          if (
            !filteredNotesRef.current.has(item.uuid) ||
            item.isTrash ||
            item.isArchived
          )
            return false;
          return item.isPinned === true;
        });
        const unpinnedItems = sortedItems.filter((item) => {
          if (
            !filteredNotesRef.current.has(item.uuid) ||
            item.isTrash ||
            item.isArchived
          )
            return false;
          return item.isPinned === false;
        });

        const archivedItems = sortedItems.filter((item) => {
          if (!filteredNotesRef.current.has(item.uuid) || item.isTrash)
            return false;
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
        const pinnedHeight = positionItems(
          pinnedItems,
          pinnedItems.length > 0 && 30
        );

        const unpinnedGap = pinnedItems.length > 0 ? GAP_BETWEEN_SECTIONS : 0;
        const unpinnedHeight = positionItems(
          unpinnedItems,
          pinnedHeight + unpinnedGap
        );

        const archivedGap =
          unpinnedItems.length > 0 || pinnedItems.length > 0
            ? pinnedItems.length > 0 && unpinnedItems.length === 0
              ? 0
              : GAP_BETWEEN_SECTIONS
            : 0;

        const archivedY = unpinnedHeight + archivedGap || 30;
        const archivedHeight = positionItems(archivedItems, archivedY);

        const sectionGap =
          (pinnedItems.length > 0 && unpinnedItems.length === 0
            ? unpinnedHeight - GAP_BETWEEN_SECTIONS
            : unpinnedHeight) +
          (pinnedItems.length > 0 || unpinnedItems.length > 0
            ? GAP_BETWEEN_SECTIONS + 2
            : 32);

        setSectionsHeight(sectionGap);

        setPinnedHeight(pinnedHeight + GAP_BETWEEN_SECTIONS + 2);
        container.style.height = `${archivedHeight}px`;
        setLayoutReady(true);
      });
    }, [isGrid]);

    const debouncedCalculateLayout = useCallback(() => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        calculateLayout();
      }, 100);
    }, [calculateLayout]);

    useEffect(() => {
      calculateLayoutRef.current = calculateLayout;
    }, [calculateLayout, layout]);

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

    useEffect(() => {
      calculateLayout();
    }, [visibleItems]);

    return (
      <>
        <div ref={containerRef} className="section-container">
          <p
            className="section-label"
            style={{
              opacity: hasPinned ? "1" : "0",
              display: visibleItems.size === 0 && "none",
            }}
          >
            PINNED
          </p>
          <p
            className="section-label"
            style={{
              top: `${pinnedHeight}px`,
              opacity: hasPinned && hasUnpinned ? "1" : "0",
              display: visibleItems.size === 0 && "none",
            }}
          >
            OTHERS
          </p>
          <p
            className="section-label"
            style={{
              top: `${sectionsHeight}px`,
              opacity: hasArchivedNotes ? "1" : "0",
            }}
          >
            ARCHIVED
          </p>
          {order.map((uuid, index) => {
            if (!filteredNotes.has(uuid)) return;
            if (!visibleItems.has(uuid)) return null;
            const note = notes.get(uuid);
            return (
              <NoteWrapper
                key={note.uuid}
                note={note}
                noteActions={noteActions}
                selectedNotesRef={selectedNotesRef}
                dispatchNotes={dispatchNotes}
                isGrid={isGrid}
                index={index}
                setSelectedNotesIDs={setSelectedNotesIDs}
                handleNoteClick={handleNoteClick}
                handleSelectNote={handleSelectNote}
                fadingNotes={fadingNotes}
              />
            );
          })}
        </div>
      </>
    );
  }
);

export default FilteredNotes;
