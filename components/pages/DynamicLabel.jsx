import { useAppContext } from "@/context/AppContext";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Note from "../others/Note";
import { AnimatePresence, motion } from "framer-motion";
import { getNoteFormattedDate } from "@/utils/noteDateFormatter";
import ComposeNote from "../others/ComposeNote";
import FolderIcon from "../icons/FolderIcon";
import SectionHeader from "../others/SectionHeader";
import SetLabelModal from "../others/SetLabelModal";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLayout } from "@/context/LayoutContext";
import { useMasonry } from "@/context/MasonryContext";

const NoteWrapper = memo(
  ({
    gridNoteWidth,
    GUTTER,
    dispatchNotes,
    selectedNotesRef,
    isGrid,
    note,
    noteActions,
    fadingNotes,
    setFadingNotes,
    setSelectedNotesIDs,
    index,
    handleSelectNote,
    handleNoteClick,
    calculateLayout,
  }) => {
    const [mounted, setMounted] = useState(false);
    const [height, setHeight] = useState(0);
    const touchDownRef = useRef(null);
    const noteRef = useRef(null);

    useEffect(() => {
      if (!noteRef.current) return;

      const observer = new ResizeObserver(([entry]) => {
        setHeight(entry.contentRect.height);
      });

      observer.observe(noteRef.current);

      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      calculateLayout();
    }, [height]);

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
          ref={noteRef}
          onClick={(e) =>
            !touchDownRef.current && handleNoteClick(e, note, index)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              !touchDownRef.current && handleNoteClick(e, note, index);
            }
          }}
          className={`grid-item ${
            fadingNotes.has(note?.uuid) ? "fade-out" : ""
          }`}
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
            dispatchNotes={dispatchNotes}
            note={note}
            noteActions={noteActions}
            selectedNotesRef={selectedNotesRef}
            setFadingNotes={setFadingNotes}
            setSelectedNotesIDs={setSelectedNotesIDs}
            handleSelectNote={handleSelectNote}
            handleNoteClick={handleNoteClick}
            touchDownRef={touchDownRef}
          />
        </div>
      </motion.div>
    );
  },
);

const DynamicLabel = ({
  visibleItems,
  setVisibleItems,
  dispatchNotes,
  notes,
  selectedNotesRef,
  noteActions,
  notesReady,
  order,
  fadingNotes,
  setFadingNotes,
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
                fadingNotes={fadingNotes}
                isGrid={isGrid}
                setFadingNotes={setFadingNotes}
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
