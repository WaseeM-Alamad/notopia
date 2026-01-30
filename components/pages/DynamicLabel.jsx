import { useAppContext } from "@/context/AppContext";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Note from "../others/note/Note";
import { AnimatePresence, motion } from "framer-motion";
import { getNoteFormattedDate } from "@/utils/noteDateFormatter";
import ComposeNote from "../others/ComposeNote";
import FolderIcon from "../icons/FolderIcon";
import SectionHeader from "../others/SectionHeader";
import SetLabelModal from "../others/SetLabelModal";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLayout } from "@/context/LayoutContext";
import { useMasonry } from "@/context/MasonryContext";
import NoteWrapper from "../others/note/NoteWrapper";

const DynamicLabel = ({
  visibleItems,
  setVisibleItems,
  dispatchNotes,
  notes,
  selectedNotesRef,
  noteActions,
  notesReady,
  order,
  rootContainerRef,
  setSelectedNotesIDs,
  handleNoteClick,
  handleSelectNote,
  containerRef,
  labelObj,
}) => {
  const {
    gridNoteWidth,
    GUTTER,
    isGrid,
    pinnedHeight,
    sectionsHeight,
    notesExist,
    hasArchivedNotes,
    hasPinned,
    hasUnpinned,
    calculateLayout,
  } = useMasonry();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const lastAddedNoteRef = useRef(null);

  const getLastRef = () => {
    let lastRef = null;
    for (let uuid of order) {
      const note = notes.get(uuid);
      if (note?.labels?.includes(labelObj?.uuid) && !note?.isTrash) {
        lastRef = note?.ref.current;
        lastAddedNoteRef.current = lastRef;
        return lastRef;
      }
    }
  };

  useEffect(() => {
    getLastRef();
  }, [notes, order]);

  useEffect(() => {
    setIsModalOpen(false);
  }, [labelObj?.uuid]);

  return (
    <>
      <div ref={rootContainerRef} className="starting-div">
        <SectionHeader
          title={labelObj?.label}
          iconClass="section-label-icon"
          isLabel={true}
          onClick={() => setIsModalOpen(true)}
        />
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
          <AnimatePresence presenceAffectsLayout={false}>
            {order.map((uuid, index) => {
              const note = notes.get(uuid);
              if (!visibleItems.has(note?.uuid)) return null;
              if (!note?.labels?.includes(labelObj?.uuid) || note?.isTrash)
                return null;
              return (
                <NoteWrapper
                  key={note?.uuid}
                  note={note}
                  selectedNotesRef={selectedNotesRef}
                  noteActions={noteActions}
                  isGrid={isGrid}
                  index={index}
                  dispatchNotes={dispatchNotes}
                  setSelectedNotesIDs={setSelectedNotesIDs}
                  handleNoteClick={handleNoteClick}
                  handleSelectNote={handleSelectNote}
                  gridNoteWidth={gridNoteWidth}
                  GUTTER={GUTTER}
                  calculateLayout={calculateLayout}
                />
              );
            })}
          </AnimatePresence>
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
              <div className="empty-page-dynamic-label" />
              No notes with this label yet
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
        labelObj={labelObj}
      />
      <AnimatePresence>
        {isModalOpen && (
          <SetLabelModal
            setIsOpen={setIsModalOpen}
            isOpen={isModalOpen}
            labelObj={labelObj}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(DynamicLabel);
