"use client";
import React, { memo } from "react";
import { useMasonry } from "@/context/MasonryContext";
import NoteWrapper from "../others/note/NoteWrapper";
import SectionHeader from "../others/SectionHeader";

const FilteredNotes = memo(
  ({
    notes,
    order,
    selectedNotesRef,
    dispatchNotes,
    setSelectedNotesIDs,
    handleNoteClick,
    handleSelectNote,
    noteActions,
    visibleItems,
    containerRef,
    rootContainerRef,
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
    } = useMasonry();

    return (
      <div ref={rootContainerRef} className="starting-div">
        <SectionHeader title="Reminders" iconClass="section-reminders-icon" />
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
            if (!visibleItems.has(uuid)) return null;
            if (note?.reminder && !note.isTrash)
              return (
                <NoteWrapper
                  key={note?.uuid}
                  note={note}
                  noteActions={noteActions}
                  selectedNotesRef={selectedNotesRef}
                  dispatchNotes={dispatchNotes}
                  isGrid={isGrid}
                  index={index}
                  setSelectedNotesIDs={setSelectedNotesIDs}
                  handleNoteClick={handleNoteClick}
                  handleSelectNote={handleSelectNote}
                  GUTTER={GUTTER}
                  gridNoteWidth={gridNoteWidth}
                  calculateLayout={calculateLayout}
                />
              );
          })}
        </div>
      </div>
    );
  },
);

export default FilteredNotes;
