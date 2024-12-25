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

const Note = memo(
  ({ Note, togglePin }) => {
    const [note, setNote] = useState(Note);
    const [modalTrigger, setModalTrigger] = useState(false);
    const [menuIsOpen, setMenuIsOpen] = useState(false);
    const [trigger2, setTrigger2] = useState(false);
    const [opacityTrigger, setOpacityTrigger] = useState(true);
    const noteRef = useRef(null);
    const inputsRef = useRef(null);
    const timeoutRef = useRef(null);

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
        inputsRef.current.contains(e.target)
      ) {
        const rect = noteRef.current.getBoundingClientRect();
        setNotePos({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        setModalTrigger(true);
      }
    }, []);

    useEffect(() => {
      if (trigger2) {
        setOpacityTrigger(false);
      }
      if (!modalTrigger) setOpacityTrigger(true);
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
          style={noteStyle}
          className="note"
          onClick={handleNoteClick}
          ref={noteRef}
        >
          <div>
            <div className="corner" />
            <div
              style={{ opacity: menuIsOpen ? "1" : undefined }}
              className="pin"
            >
              <Button onClick={handlePinClick}>
                <PinIcon
                  color={Note.isPinned ? "#212121" : "transparent"}
                  opacity={0.8}
                  rotation={Note.isPinned ? "0deg" : "40deg"}
                />
              </Button>
            </div>
            <div ref={inputsRef}>
              {Note.title && (
                <div className="title">
                  <p>{note.title}</p>
                </div>
              )}
              {note.content && (
                <div className="content">
                  <p>{note.content}</p>
                </div>
              )}
            </div>
          </div>
          <NoteTools
            isOpen={menuIsOpen}
            setIsOpen={handleMenuIsOpenChange}
            setNote={setNote}
            noteVals={{
              color: note.color,
              updatedAt: note.updatedAt,
              createdAt: note.createdAt,
              uuid: note.uuid,
            }}
          />
        </div>
        <NoteModal
          trigger={modalTrigger}
          setTrigger={handleModalTriggerChange}
          trigger2={trigger2}
          setTrigger2={handleTrigger2Change}
          notePos={notePos}
          noteVals={{
            color: note.color,
            updatedAt: note.updatedAt,
            uuid: note.uuid,
          }}
        />
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
