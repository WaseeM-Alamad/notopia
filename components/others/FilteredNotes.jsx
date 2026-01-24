"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useMasonry } from "@/context/MasonryContext";
import NoteWrapper from "./note/NoteWrapper";

const FilteredNotes = memo(
  ({
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
  }) => {
    const {
      gridNoteWidth,
      GUTTER,
      isGrid,
      pinnedHeight,
      sectionsHeight,
      hasArchivedNotes,
      hasPinned,
      hasUnpinned,
      calculateLayout,
      isInCurrentSection,
    } = useMasonry();

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
            const note = notes.get(uuid);
            if (!isInCurrentSection(note)) return;
            if (!visibleItems.has(uuid)) return null;
            return (
              <NoteWrapper
                key={note?.uuid || index}
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
                GUTTER={GUTTER}
                gridNoteWidth={gridNoteWidth}
                calculateLayout={calculateLayout}
              />
            );
          })}
        </div>
      </>
    );
  },
);

export default FilteredNotes;
