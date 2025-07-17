"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Note from "../others/Note";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

const GUTTER = 15;

const NoteWrapper = memo(
  ({
    isGrid,
    note,
    ref,
    setSelectedNotesIDs,
    selectedNotesRef,
    selectedNotes,
    index,
    handleNoteClick,
    handleSelectNote,
    fadingNotes,
    calculateLayout,
    setFadingNotes,
    dispatchNotes,
    noteActions,
  }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      requestAnimationFrame(() => {
        setMounted(true);
      });
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
            dispatchNotes={dispatchNotes}
            index={index}
            selectedNotesRef={selectedNotesRef}
            noteActions={noteActions}
            calculateLayout={calculateLayout}
            handleSelectNote={handleSelectNote}
            setSelectedNotesIDs={setSelectedNotesIDs}
            selectedNotes={selectedNotes}
          />
          {/* <p>{index}</p> */}
        </div>
      </motion.div>
    );
  }
);

NoteWrapper.displayName = "NoteWrapper";

const Archive = memo(
  ({
    visibleItems,
    notesStateRef,
    selectedNotesRef,
    notes,
    order,
    dispatchNotes,
    setSelectedNotesIDs,
    handleNoteClick,
    handleSelectNote,
    fadingNotes,
    setFadingNotes,
    rootContainerRef,
    noteActions,
    notesReady,
    containerRef,
    isGrid,
  }) => {
    const { layout } = useAppContext();
    const COLUMN_WIDTH = layout === "grid" ? 240 : 600;
    const resizeTimeoutRef = useRef(null);
    const layoutFrameRef = useRef(null);

    const notesExist = order.some((uuid) => {
      const note = notes.get(uuid);
      if (!note.isArchived || note.isTrash) return false;
      return true;
    });

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

        const items = notesStateRef.current.order.map((uuid, index) => {
          const note = notesStateRef.current.notes.get(uuid);
          return { ...note, index: index };
        });

        const positionItems = (itemList) => {
          const columnHeights = new Array(columns).fill(0);

          itemList.forEach((item) => {
            const wrapper = item.ref?.current?.parentElement;
            if (!wrapper) return;
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
    }, [calculateLayout]);

    useEffect(() => {
      calculateLayout();
    }, [visibleItems]);

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
    }, [calculateLayout, debouncedCalculateLayout, notes]);

    useEffect(() => {
      if (notes.length > 0) {
        const timer = setTimeout(calculateLayout, 50);
        return () => clearTimeout(timer);
      }
    }, [notes, calculateLayout]);

    return (
      <>
        <div ref={rootContainerRef} className="starting-div">
          {/* <div style={{ padding: "0 2rem" }} className="page-header"> */}
          {/* <ArchiveIcon size={22} color="#212121" /> */}
          {/* <div /> */}
          {/* <h1 className="page-header-title"> */}
          {/* <span>Archive</span> */}
          {/* </h1> */}
          {/* <div
            // animate={{ width: "100%" }}
            // className="page-header-divider"
            /> */}
          {/* <div className="divider-tools-container"> */}
          {/* <div className="divider-tool"> */}
          {/* <SortByIcon /> */}
          {/* <span className="divider-tool-text">Sort by</span> */}
          {/* </div> */}
          {/* <div className="divider-tool"> */}
          {/* <LabelIcon /> */}
          {/* <span className="divider-tool-text">Labels</span> */}
          {/* </div> */}
          {/* </div> */}
          {/* </div> */}
          <div ref={containerRef} className="section-container">
            {order.map((uuid, index) => {
              const note = notes.get(uuid);
              if (!visibleItems.has(note.uuid)) return null;
              if (note.isArchived && !note.isTrash)
                return (
                  <NoteWrapper
                    key={note.uuid}
                    note={note}
                    isGrid={isGrid}
                    selectedNotesRef={selectedNotesRef}
                    dispatchNotes={dispatchNotes}
                    index={index}
                    handleNoteClick={handleNoteClick}
                    handleSelectNote={handleSelectNote}
                    calculateLayout={calculateLayout}
                    fadingNotes={fadingNotes}
                    setFadingNotes={setFadingNotes}
                    noteActions={noteActions}
                    setSelectedNotesIDs={setSelectedNotesIDs}
                  />
                );
            })}
          </div>
          <div style={{ display: notesExist && "none" }} className="empty-page">
            {notesReady && !notesExist && (
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
                <div className="empty-page-archive" />
                Your archived notes appear here
              </motion.div>
            )}
            {!notesReady && (
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
                Loading notes...
              </motion.div>
            )}
          </div>
        </div>
      </>
    );
  }
);

Archive.displayName = "Archive";

export default Archive;
