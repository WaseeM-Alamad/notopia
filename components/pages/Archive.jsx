"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Note from "../others/note/Note";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import SectionHeader from "../others/SectionHeader";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLayout } from "@/context/LayoutContext";
import { useMasonry } from "@/context/MasonryContext";
import NoteWrapper from "../others/note/NoteWrapper";

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
    const { gridNoteWidth, GUTTER, isGrid, notesExist, calculateLayout } =
      useMasonry();

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

export default memo(Archive);
