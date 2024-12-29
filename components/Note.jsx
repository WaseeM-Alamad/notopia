import React, {
  memo,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import "../assets/styles/note.css";
import NoteTools from "./NoteTools";
import NoteModal from "./NoteModal";
import PinIcon from "./icons/PinIcon";
import { NoteUpdateAction } from "@/utils/actions";
import Button from "./Tools/Button";
import NoteImagesLayout from "./Tools/NoteImagesLayout";

const Note = memo(
  ({ Note, togglePin, calculateLayout }) => {
    const [note, setNote] = useState(Note);
    const [modalTrigger, setModalTrigger] = useState(false);
    const [menuIsOpen, setMenuIsOpen] = useState(false);
    const [trigger2, setTrigger2] = useState(false);
    const [opacityTrigger, setOpacityTrigger] = useState(true);
    const noteRef = useRef(null);
    const inputsRef = useRef(null);
    const timeoutRef = useRef(null);
    const imagesRef = useRef(null);
    const noteStuffRef = useRef(null);
    const titleRef = useRef(null);
    const contentRef = useRef(null);

    const [notePos, setNotePos] = useState(() => ({
      top: 0,
      left: 0,
      width: 240,
      height: 20,
    }));

    const noteStyle = useMemo(
      () => ({
        opacity: opacityTrigger ? "1" : "0",
        backgroundColor: note.color,
        border: "solid 1px transparent",
        borderColor: note.color === "#FFFFFF" ? "#e0e0e0" : "transparent",
      }),
      [note.color, opacityTrigger]
    );

    const handleNoteClick = useCallback((e) => {
      if (
        (noteRef.current && noteRef.current === e.target) ||
        inputsRef.current.contains(e.target) ||
        imagesRef.current.contains(e.target) ||
        noteStuffRef.current.contains(e.target)
      ) {
        const rect = noteRef.current.getBoundingClientRect();
        setNotePos({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          source:
            e.target === contentRef
              ? "note"
              : e.target === titleRef
              ? "title"
              : "note",
        });
        setModalTrigger(true);
      }
    }, []);

    useEffect(() => {
      if (window.location.hash.includes(note.uuid)) {
        noteRef.current.click();
      }

      if (trigger2) {
        setOpacityTrigger(false);
      } else {
        const rect = noteRef.current.getBoundingClientRect();
        setNotePos({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
      if (!modalTrigger) {
        setOpacityTrigger(true);
        
      }
    }, [trigger2, modalTrigger]);

    const handlePinClick = useCallback(
      async (e) => {
        e.stopPropagation(); // Prevent note click event
        togglePin(note.uuid);
        window.dispatchEvent(new Event("loadingStart"));

        try {
          await NoteUpdateAction("isPinned", !Note.isPinned, note.uuid);
        } finally {
          timeoutRef.current = setTimeout(() => {
            window.dispatchEvent(new Event("loadingEnd"));
          }, 800);
        }
      },
      [note.uuid, Note.isPinned, togglePin]
    );

    const handleMenuIsOpenChange = useCallback((value) => {
      setMenuIsOpen(value);
    }, []);

    const handleModalTriggerChange = useCallback((value) => {
      setModalTrigger(value);
    }, []);

    const handleTrigger2Change = useCallback((value) => {
      setTrigger2(value);
    }, []);

    return (
      <>
        <div
          style={{
            ...noteStyle,
            paddingBottom:
              note.images.length === 0 || note.title || note.content
                ? "45px"
                : "0px  ",
          }}
          className="note"
          onClick={handleNoteClick}
          ref={noteRef}
        >
          <div ref={noteStuffRef}>
            {note.images.length === 0 && <div className="corner" />}
            <div
              style={{ opacity: menuIsOpen ? "1" : undefined }}
              className="pin"
            >
              <Button onClick={handlePinClick}>
                <PinIcon
                  pinColor={note.color}
                  color={Note.isPinned ? "#212121" : "transparent"}
                  opacity={0.8}
                  rotation={Note.isPinned ? "0deg" : "40deg"}
                  images={note.images.length !== 0}
                />
              </Button>
            </div>
            <div ref={imagesRef}>
              <NoteImagesLayout
                images={note.images}
                calculateMasonryLayout={calculateLayout}
              />
            </div>
            {note.images.length === 0 &&
              !note.title.trim() &&
              !note.content.trim() && (
                <div className="empty-note" aria-label="Empty note" />
              )}
            <div ref={inputsRef}>
              {note.title.trim() && (
                <div ref={titleRef} className="title">
                  {note.title}
                </div>
              )}
              {note.content.trim() && (
                <div ref={contentRef} className="content">
                  {note.content}
                </div>
              )}
            </div>
          </div>
          <NoteTools
            isOpen={menuIsOpen}
            setIsOpen={handleMenuIsOpenChange}
            setNote={setNote}
            images={note.images.length !== 0}
            noteVals={{
              color: note.color,
              updatedAt: note.updatedAt,
              createdAt: note.createdAt,
              uuid: note.uuid,
            }}
          />
        </div>
        {modalTrigger && (
          <NoteModal
            trigger={modalTrigger}
            setTrigger={handleModalTriggerChange}
            trigger2={trigger2}
            setTrigger2={handleTrigger2Change}
            notePos={notePos}
            note={{ ...note, isPinned: Note.isPinned }}
            setNote={setNote}
            calculateLayout={calculateLayout}
            togglePin={togglePin}
          />
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary rerenders
    return (
      prevProps.Note.uuid === nextProps.Note.uuid &&
      prevProps.Note.isPinned === nextProps.Note.isPinned &&
      prevProps.Note.color === nextProps.Note.color &&
      prevProps.Note.title === nextProps.Note.title &&
      prevProps.Note.content === nextProps.Note.content &&
      prevProps.Note.updatedAt === nextProps.Note.updatedAt
    );
  }
);

Note.displayName = "Note";

export default Note;
