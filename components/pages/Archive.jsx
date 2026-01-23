"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Note from "../others/Note";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import SectionHeader from "../others/SectionHeader";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLayout } from "@/context/LayoutContext";
import { useMasonry } from "@/context/MasonryContext";

const NoteWrapper = memo(
  ({
    gridNoteWidth,
    GUTTER,
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
    dispatchNotes,
    noteActions,
  }) => {
    const [mounted, setMounted] = useState(false);
    const touchDownRef = useRef(null);

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
            fadingNotes.has(note?.uuid) ? "fade-out" : ""
          }`}
          onClick={(e) =>
            !touchDownRef.current && handleNoteClick(e, note, index)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              !touchDownRef.current && handleNoteClick(e, note, index);
            }
          }}
          style={{
            maxWidth: `${isGrid ? gridNoteWidth : 600}px`,
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
            handleSelectNote={handleSelectNote}
            handleNoteClick={handleNoteClick}
            setSelectedNotesIDs={setSelectedNotesIDs}
            selectedNotes={selectedNotes}
            touchDownRef={touchDownRef}
          />
          {/* <p>{index}</p> */}
        </div>
      </motion.div>
    );
  },
);

NoteWrapper.displayName = "NoteWrapper";

const Archive = memo(
  ({
    visibleItems,
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
  }) => {
    const { gridNoteWidth, GUTTER, isGrid, notesExist } = useMasonry();

    return (
      <>
        <div ref={rootContainerRef} className={`starting-div `}>
          <SectionHeader title="Archive" iconClass="section-archive-icon" />
          <div ref={containerRef} className="section-container">
            {order.map((uuid, index) => {
              const note = notes.get(uuid);
              if (!visibleItems.has(note?.uuid)) return null;
              if (note?.isArchived && !note?.isTrash)
                return (
                  <NoteWrapper
                    key={note?.uuid}
                    note={note}
                    isGrid={isGrid}
                    selectedNotesRef={selectedNotesRef}
                    dispatchNotes={dispatchNotes}
                    index={index}
                    handleNoteClick={handleNoteClick}
                    handleSelectNote={handleSelectNote}
                    fadingNotes={fadingNotes}
                    setFadingNotes={setFadingNotes}
                    noteActions={noteActions}
                    setSelectedNotesIDs={setSelectedNotesIDs}
                    gridNoteWidth={gridNoteWidth}
                    GUTTER={GUTTER}
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
  },
);

Archive.displayName = "Archive";

export default Archive;
