import { motion } from "framer-motion";
import React, { memo, useEffect, useRef, useState } from "react";
import Note from "./Note";
import { useAppContext } from "@/context/AppContext";

const NoteWrapper = ({
  GUTTER,
  isGrid,
  dispatchNotes,
  selectedNotesRef,
  note,
  overIndexRef,
  overIsPinnedRef,
  noteActions,
  fadingNotes,
  setFadingNotes,
  setSelectedNotesIDs,
  handleDragStart,
  handleSelectNote,
  handleNoteClick,
  gridNoteWidth,
  isDraggingRef,
  touchOverElementRef,
  calculateLayout = () => {},
}) => {
  const { currentSection, notesIndexMapRef } = useAppContext();
  const [mounted, setMounted] = useState(false);
  const [height, setHeight] = useState(0);
  const noteRef = useRef(null);
  const touchDownRef = useRef(null);

  const isHomeSection = currentSection?.toLowerCase() === "home";

  useEffect(() => {
    if (!noteRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height);
    });

    observer.observe(noteRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // calculateLayout();
  }, [height]);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  let startX, startY;

  const handleMouseDown = (e) => {
    if (e.button !== 0 || !isHomeSection) {
      return;
    }

    startX = e.clientX;
    startY = e.clientY;
    const targetElement = e.currentTarget;
    const target = e.target;

    const detectDrag = (event) => {
      const deltaX = Math.abs(event.clientX - startX);
      const deltaY = Math.abs(event.clientY - startY);

      if (deltaX > 5 || deltaY > 5) {
        if (
          targetElement === noteRef.current &&
          !target.classList.contains("not-draggable")
        ) {
          handleDragStart(
            e,
            targetElement,
            notesIndexMapRef.current.get(note.uuid),
            note?.isPinned,
          );
        }
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", detectDrag);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", detectDrag);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseEnter = () => {
    if (!isHomeSection) return;
    overIndexRef.current = notesIndexMapRef.current.get(note.uuid);
    overIsPinnedRef.current = note?.isPinned;
  };

  const startDragging = () => {
    if (!isHomeSection) return;
    const targetElement = noteRef.current;

    const detectDrag = (event) => {
      event.preventDefault();

      const t = event.touches[0];
      if (!t) return;

      document.body.classList.add("dragging");
      requestAnimationFrame(() => {
        handleDragStart(
          {
            clientX: t.clientX,
            clientY: t.clientY,
          },
          targetElement,
          notesIndexMapRef.current.get(note.uuid),
          note?.isPinned,
          true,
        );
      });
    };

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", detectDrag);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };

    document.addEventListener("touchmove", detectDrag, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchEnd, {
      passive: true,
    });
  };

  useEffect(() => {
    if (!isHomeSection) return;
    const handleDetectTouchOverlap = (e) => {
      // e.preventDefault();
      if (
        !isDraggingRef.current ||
        touchOverElementRef.current === noteRef.current
      ) {
        return;
      }
      const t = e.touches[0];
      const touchX = t.clientX;
      const touchY = t.clientY;
      const element = document.elementFromPoint(touchX, touchY);

      if (noteRef.current.contains(element)) {
        handleMouseEnter();
        touchOverElementRef.current = noteRef.current;
      }
    };

    document.addEventListener("touchmove", handleDetectTouchOverlap, {
      passive: false,
    });

    return () =>
      document.removeEventListener("touchmove", handleDetectTouchOverlap, {
        passive: false,
      });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, type: "tween" }}
      className="top-note-wrapper"
    >
      <div
        tabIndex={0}
        ref={noteRef}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        // onTouchEnd={() =>
        //   document.removeEventListener("touchmove", handleDetectTouchOverlap)
        // }
        onClick={(e) =>
          !touchDownRef.current &&
          handleNoteClick(e, note, notesIndexMapRef.current.get(note.uuid))
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            !touchDownRef.current &&
              handleNoteClick(e, note, notesIndexMapRef.current.get(note.uuid));
          }
        }}
        className={`grid-item ${fadingNotes.has(note?.uuid) ? "fade-out" : ""}`}
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
          selectedNotesRef={selectedNotesRef}
          note={note}
          noteActions={noteActions}
          setFadingNotes={setFadingNotes}
          setSelectedNotesIDs={setSelectedNotesIDs}
          handleSelectNote={handleSelectNote}
          handleNoteClick={handleNoteClick}
          touchDownRef={touchDownRef}
          startDragging={startDragging}
          isHomeSection={isHomeSection}
        />
        {/* <p style={{position: "absolute", bottom: "40px", color: "blue"}}>{notesIndexMapRef.current.get(note.uuid)}</p> */}
      </div>
    </motion.div>
  );
};

export default memo(NoteWrapper);
