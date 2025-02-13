import React, {
  memo,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import "@/assets/styles/note.css";
import "@/assets/styles/LinearLoader.css";
import NoteTools from "./NoteTools";
import NoteModal from "./NoteModal";
import PinIcon from "../icons/PinIcon";
import {
  NoteUpdateAction,
  removeLabelAction,
  undoAction,
} from "@/utils/actions";
import Button from "../Tools/Button";
import NoteImagesLayout from "../Tools/NoteImagesLayout";
import { useSession } from "next-auth/react";
import CheckMark from "../icons/CheckMark";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

const Note = memo(
  ({
    note,
    dispatchNotes,
    calculateLayout,
    isLoadingImagesAddNote = [],
    setSelectedNotesIDs,
    selectedNotes,
    isDragging,
    modalTrigger,
    setTooltipAnchor,
    openSnackFunction,
    setModalTrigger,
    index,
  }) => {
    const { addLabel, labelsRef } = useAppContext();
    const { data: session } = useSession();
    const userID = session?.user?.id;
    const [localIsArchived, setLocalIsArchived] = useState(false);
    const [localIsTrash, setLocalIsTrash] = useState(false);
    const [localArchivedPin, setLocalArchivedPin] = useState(false);
    const [isNoteDeleted, setIsNoteDeleted] = useState(false);
    const [colorMenuOpen, setColorMenuOpen] = useState(false);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const [trigger2, setTrigger2] = useState(false);
    const [opacityTrigger, setOpacityTrigger] = useState(true);
    const [isLoadingImages, setIsLoadingImages] = useState([]);
    const [selected, setSelected] = useState(false);
    const isLoading = isLoadingImagesAddNote.includes(note.uuid);
    const noteRef = useRef(null);
    const inputsRef = useRef(null);
    const imagesRef = useRef(null);
    const noteStuffRef = useRef(null);
    const titleRef = useRef(null);
    const contentRef = useRef(null);
    const checkRef = useRef(null);

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
      }),
      [note.color, opacityTrigger]
    );

    // const noteStyle = useMemo(
    //   () => ({
    //     opacity: opacityTrigger ? "1" : "0",
    //     // backgroundColor: note.color,
    //     background: "url(https://www.gstatic.com/keep/backgrounds/recipe_light_0609.svg)",
    //     backgroundPositionX: "right",
    //     backgroundPositionY: "bottom",
    //     backgroundSize: "cover",
    //     border: "solid 1px transparent",
    //   }),
    //   [note.color, opacityTrigger]
    // );

    const handleNoteClick = (e) => {
      if (!selectedNotes.current) {
        // openNote(e);
      } else {
        // if (!inputsRef.current?.contains(e.target))
        handleCheckClick();
      }
    };

    const openNote = useCallback((e) => {
      if (
        (noteRef.current && noteRef.current === e.target) ||
        inputsRef.current.contains(e.target) ||
        imagesRef.current.contains(e.target) ||
        noteStuffRef.current.contains(e.target)
      ) {
        // console.log("open note")
        const rect = noteRef.current.getBoundingClientRect();
        setNotePos({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          source:
            e.target === contentRef.current
              ? "note"
              : e.target === titleRef.current
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
        setNotePos((prev) => ({
          ...prev,
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }));
      }
      if (!modalTrigger) {
        setOpacityTrigger(true);
      }
    }, [trigger2, modalTrigger]);

    const handlePinClick = async (e) => {
      closeToolTip();
      if (selectedNotes.current) {
        setSelectedNotesIDs([]);
        window.dispatchEvent(new Event("topMenuClose"));
      }
      e.stopPropagation(); // Prevent note click event
      if (!note.isArchived) {
        window.dispatchEvent(new Event("loadingStart"));
        dispatchNotes({
          type: "PIN_NOTE",
          note: note,
        });

        try {
          const first = index === 0;
          await NoteUpdateAction("isPinned", !note.isPinned, note.uuid, first);
        } finally {
          window.dispatchEvent(new Event("loadingEnd"));
        }
      } else {
        setLocalArchivedPin((prev) => !prev);
        window.dispatchEvent(new Event("loadingStart"));
        const initialIndex = index;

        const undoPinArchived = async () => {
          dispatchNotes({
            type: "UNDO_PIN_ARCHIVED",
            note: note,
            initialIndex: initialIndex,
          });
          setTimeout(() => {
            window.dispatchEvent(new Event("closeModal"));
          }, 0);

          window.dispatchEvent(new Event("loadingStart"));
          await undoAction({
            type: "UNDO_PIN_ARCHIVED",
            noteUUID: note.uuid,
            initialIndex: initialIndex,
            endIndex: 0,
          });
          window.dispatchEvent(new Event("loadingEnd"));
        };

        openSnackFunction({
          snackMessage: "Note unarchived and pinned",
          snackOnUndo: undoPinArchived,
        });

        try {
          await NoteUpdateAction("pinArchived", true, note.uuid);
        } finally {
          window.dispatchEvent(new Event("loadingEnd"));
        }
      }
    };

    const handleMenuIsOpenChange = useCallback((value) => {
      setColorMenuOpen(value);
    }, []);

    const handleModalTriggerChange = useCallback((value) => {
      setModalTrigger(value);
    }, []);

    const handleTrigger2Change = useCallback((value) => {
      setTrigger2(value);
    }, []);

    const handleCheckClick = (e) => {
      e.stopPropagation();
      closeToolTip();
      setSelected((prev) => !prev);

      if (selected) {
        setSelected(false);
        setSelectedNotesIDs((prev) => prev.filter((id) => id !== note.uuid));
      } else {
        setSelected(true);
        setSelectedNotesIDs((prev) => [...prev, note.uuid]);
      }
    };

    useEffect(() => {
      const handleCloseMenu = () => {
        setSelected(false);
      };

      window.addEventListener("topMenuClose", handleCloseMenu);

      return () => {
        window.removeEventListener("topMenuClose", handleCloseMenu);
      };
    }, []);

    const handleMouseEnter = (e, text) => {
      const target = e.currentTarget;
      setTooltipAnchor({ anchor: target, text: text, display: true });
    };

    const handleMouseLeave = () => {
      setTooltipAnchor((prev) => ({
        ...prev,
        display: false,
      }));
    };

    const closeToolTip = () => {
      setTooltipAnchor((prev) => ({
        anchor: null,
        text: prev.text,
      }));
    };

    const handleArchive = useCallback(async () => {
      const initialIndex = index;
      setLocalIsArchived((prev) => !prev);
      const undoArchive = async () => {
        dispatchNotes({
          type: "UNDO_ARCHIVE",
          note: note,
          initialIndex: initialIndex,
        });
        setTimeout(() => {
          window.dispatchEvent(new Event("closeModal"));
        }, 0);
        window.dispatchEvent(new Event("loadingStart"));
        await undoAction({
          type: "UNDO_ARCHIVE",
          noteUUID: note.uuid,
          value: note.isArchived,
          pin: note.isPinned,
          initialIndex: initialIndex,
          endIndex: 0,
        });
        window.dispatchEvent(new Event("loadingEnd"));
      };
      openSnackFunction({
        snackMessage: `${
          note.isArchived
            ? "Note unarchived"
            : note.isPinned
            ? "Note unpinned and archived"
            : "Note Archived"
        }`,
        snackOnUndo: undoArchive,
      });
      const first = index === 0;
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction("isArchived", !note.isArchived, note.uuid, first);
      window.dispatchEvent(new Event("loadingEnd"));
    }, [index, note]);

    const removeLabel = async (noteLabel) => {
      dispatchNotes({
        type: "REMOVE_LABEL",
        note: note,
        labelUUID: noteLabel.uuid,
      });
      window.dispatchEvent(new Event("loadingStart"));
      await removeLabelAction({
        noteUUID: note.uuid,
        labelUUID: noteLabel.uuid,
      });
      window.dispatchEvent(new Event("loadingEnd"));
    };

    return (
      <>
        <motion.div
          animate={{
            opacity:
              localIsArchived ||
              localIsTrash ||
              isNoteDeleted ||
              localArchivedPin
                ? 0
                : 1,
          }}
          transition={{ duration: 0.2 }}
          onAnimationComplete={() => {
            if (localIsArchived) {
              dispatchNotes({
                type: "ARCHIVE_NOTE",
                note: note,
              });
            } else if (localIsTrash) {
              dispatchNotes({
                type: "TRASH_NOTE",
                note: note,
              });
            } else if (isNoteDeleted) {
              dispatchNotes({
                type: "DELETE_NOTE",
                note: note,
              });
            } else if (localArchivedPin) {
              dispatchNotes({
                type: "PIN_ARCHIVED_NOTE",
                note: note,
              });
            }
          }}
          className="note-wrapper"
          style={{ position: "relative" }}
        >
          <span
            style={{
              opacity: (selected || colorMenuOpen || moreMenuOpen) && "1",
            }}
            ref={checkRef}
            className="checkmark"
            onClick={handleCheckClick}
            onMouseEnter={(e) =>
              handleMouseEnter(
                e,
                `${selected ? "Deselect note" : "Select note"}`
              )
            }
            onMouseLeave={handleMouseLeave}
          >
            <CheckMark
              color={selected ? "rgb(111, 111, 111)" : note.color}
              size="23"
            />
          </span>
          <div
            style={{
              ...noteStyle,
              paddingBottom:
                note.images.length === 0 ||
                note.labels.length !== 0 ||
                note.title ||
                note.content
                  ? "45px"
                  : "0px  ",
              borderColor: selected
                ? "#212121"
                : note.color === "#FFFFFF"
                ? "#e0e0e0"
                : "transparent",
              outline: `solid 1px ${selected ? "#212121" : "transparent"} `,
            }}
            className="note"
            onClick={handleNoteClick}
            ref={noteRef}
          >
            <div ref={noteStuffRef}>
              {note.images.length === 0 && <div className="corner" />}
              <div
                style={{
                  opacity: colorMenuOpen ? "1" : undefined,
                  opacity: (colorMenuOpen || moreMenuOpen) && "1",
                }}
                className="pin"
              >
                {!note.isTrash && (
                  <Button
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, `${note.isPinned ? "Unpin" : "Pin"}`)
                    }
                    onMouseLeave={handleMouseLeave}
                    onClick={handlePinClick}
                  >
                    <PinIcon
                      pinColor={note.color}
                      color={
                        note.isPinned || localArchivedPin
                          ? "#212121"
                          : "transparent"
                      }
                      opacity={0.8}
                      rotation={
                        note.isPinned || localArchivedPin ? "0deg" : "40deg"
                      }
                      images={note.images.length !== 0}
                    />
                  </Button>
                )}
              </div>
              <div
                style={{
                  position: "relative",
                  opacity: isLoading && note.images.length > 0 ? "0.6" : "1",
                  transition: "all 0.2s ease",
                }}
                ref={imagesRef}
              >
                <NoteImagesLayout
                  images={note.images}
                  calculateMasonryLayout={calculateLayout}
                  isLoadingImages={isLoadingImages}
                />
                {isLoading && note.images.length > 0 && (
                  <div className="linear-loader" />
                )}
              </div>

              {note.images.length === 0 &&
                note.labels.length === 0 &&
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
              {note.labels.length !== 0 && (
                <>
                  <div className="note-labels-container">
                    {note.labels.map((noteLabel, index) => {
                      if (index + 1 >= 3 && note.labels.length > 3) return;
                      return (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          key={noteLabel.uuid}
                          className="label-wrapper"
                        >
                          <label className="note-label">
                            {noteLabel.label}
                          </label>
                          <div
                            onClick={() => removeLabel(noteLabel)}
                            className="remove-label"
                          />
                        </div>
                      );
                    })}
                    {note.labels.length > 3 && (
                      <div className="more-labels">
                        <label className="more-labels-label">
                          +{note.labels.length - 2}
                        </label>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <NoteTools
              colorMenuOpen={colorMenuOpen}
              setColorMenuOpen={handleMenuIsOpenChange}
              setTooltipAnchor={setTooltipAnchor}
              moreMenuOpen={moreMenuOpen}
              setMoreMenuOpen={setMoreMenuOpen}
              images={note.images.length !== 0}
              note={note}
              dispatchNotes={dispatchNotes}
              setIsLoadingImages={setIsLoadingImages}
              userID={userID}
              openSnackFunction={openSnackFunction}
              setLocalIsArchived={setLocalIsArchived}
              setLocalIsTrash={setLocalIsTrash}
              handleArchive={handleArchive}
              setIsNoteDeleted={setIsNoteDeleted}
              index={index}
            />
          </div>
        </motion.div>
        {modalTrigger && (
          <NoteModal
            trigger={modalTrigger}
            setTrigger={handleModalTriggerChange}
            trigger2={trigger2}
            setTrigger2={handleTrigger2Change}
            notePos={notePos}
            note={note}
            dispatchNotes={dispatchNotes}
            calculateLayout={calculateLayout}
            index={index}
            isLoadingImages={isLoadingImages}
            setIsLoadingImages={setIsLoadingImages}
            openSnackFunction={openSnackFunction}
            setTooltipAnchor={setTooltipAnchor}
            handleArchive={handleArchive}
            isLoading={isLoading}
            userID={userID}
          />
        )}
      </>
    );
  }
);

Note.displayName = "Note";

export default Note;
