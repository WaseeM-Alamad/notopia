"use client";
import React, { memo, useEffect, useRef, useState } from "react";
import Note from "../others/note/Note";
import { AnimatePresence, motion } from "framer-motion";
import ComposeNote from "../others/ComposeNote";
import { useAppContext } from "@/context/AppContext";
import { useNoteDragging } from "@/hooks/useNoteDragging";
import { useMasonry } from "@/context/MasonryContext";
import NoteWrapper from "../others/note/NoteWrapper";

const GAP_BETWEEN_SECTIONS = 88;

const Home = memo(
  ({
    visibleItems,
    selectedNotesRef,
    setVisibleItems,
    notes,
    order,
    dispatchNotes,
    handleNoteClick,
    setSelectedNotesIDs,
    handleSelectNote,
    noteActions,
    notesReady,
    containerRef,
    rootContainerRef,
  }) => {
    const {
      gridNoteWidth,
      GUTTER,
      isGrid,
      pinnedHeight,
      notesExist,
      hasPinned,
      hasUnpinned,
      calculateLayout,
    } = useMasonry();
    const lastAddedNoteRef = useRef(null);
    const touchOverElementRef = useRef(null);
    const overIndexRef = useRef(null);
    const overIsPinnedRef = useRef(null);
    const isDraggingRef = useRef(false);
    const handleDragStartRef = useRef(null);

    const getLastRef = () => {
      let lastRef = null;
      for (let uuid of order) {
        const note = notes.get(uuid);
        if (!note?.isArchived && !note?.isTrash) {
          lastRef = note?.ref.current;
          lastAddedNoteRef.current = lastRef;
          return lastRef;
        }
      }
    };

    useNoteDragging({
      touchOverElementRef,
      handleDragStartRef,
      calculateLayout,
      isDraggingRef,
      overIsPinnedRef,
      overIndexRef,
      dispatchNotes,
    });

    useEffect(() => {
      getLastRef();
    }, [notes, order]);

    return (
      <>
        <div ref={rootContainerRef} className="starting-div">
          {/* <button
            style={{ position: "fixed" }}
            onClick={() => {
              const containerBottom =
                containerRef.current.getBoundingClientRect().bottom +
                window.scrollY;
              console.log("containerBottom", containerBottom);
            }}
          >
            gg
          </button> */}
          <div
            ref={containerRef}
            className="section-container"
            // onMouseMove={handleMouseMove}
          >
            <p
              className="section-label"
              style={{
                // top: "33px",
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

              {order.map((uuid, index) => {
                const note = notes.get(uuid);
                if (!visibleItems.has(note?.uuid)) return null;
                if (note?.isArchived || note?.isTrash) return null;

                return (
                  <NoteWrapper
                    selectedNotesRef={selectedNotesRef}
                    key={note?.uuid}
                    note={note}
                    isGrid={isGrid}
                    // fadingNotes={fadingNotes}
                    overIndexRef={overIndexRef}
                    overIsPinnedRef={overIsPinnedRef}
                    noteActions={noteActions}
                    dispatchNotes={dispatchNotes}
                    handleDragStart={handleDragStartRef.current}
                    setSelectedNotesIDs={setSelectedNotesIDs}
                    handleNoteClick={handleNoteClick}
                    handleSelectNote={handleSelectNote}
                    gridNoteWidth={gridNoteWidth}
                    GUTTER={GUTTER}
                    isDraggingRef={isDraggingRef}
                    touchOverElementRef={touchOverElementRef}
                    calculateLayout={calculateLayout}
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
                <div className="empty-page-home" />
                Notes you add appear here
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
        <ComposeNote
          dispatchNotes={dispatchNotes}
          setVisibleItems={setVisibleItems}
          containerRef={containerRef}
          lastAddedNoteRef={lastAddedNoteRef}
        />
      </>
    );
  },
);

Home.displayName = "Home";

export default Home;
