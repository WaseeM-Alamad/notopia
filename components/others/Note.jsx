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
import { NoteUpdateAction, updateOrderAction } from "@/utils/actions";
import Button from "../Tools/Button";
import NoteImagesLayout from "../Tools/NoteImagesLayout";
import { useSession } from "next-auth/react";
import CheckMark from "../icons/CheckMark";
import { AnimatePresence, motion } from "framer-motion";

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
    setModalTrigger,
    index,
  }) => {
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
    const [isHovered, setIsHovered] = useState(false);
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
        openNote(e);
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
        try {
          await NoteUpdateAction("pinArchived", true, note.uuid);
          await updateOrderAction({
            uuid: note.uuid,
            type: "shift to start",
          });
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

    const handleCheckClick = () => {
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
          transition={{ duration: 0.16 }}
          onAnimationComplete={() => {
            if (localIsArchived) {
              dispatchNotes({
                type: "ARCHIVE_NOTE",
                note: note,
              });
            } else if (localIsTrash) {
              const updatedNote = {
                ...note,
                isTrash: !note.isTrash,
                isPinned: false,
              };
              setNotes((prev) => {
                const newNotes = new Map(prev);
                newNotes.set(note.uuid, updatedNote);
                return newNotes; // Return the updated map
              });
              setOrder((prev) => {
                const filteredOrder = prev.filter((uuid) => uuid !== note.uuid);
                return [note.uuid, ...filteredOrder];
              });
            } else if (isNoteDeleted) {
              setNotes((prev) => {
                const newNotes = new Map(prev);
                newNotes.delete(note.uuid);
                return newNotes; // Return the updated map
              });
              setOrder((prev) => {
                const filteredOrder = prev.filter((uuid) => uuid !== note.uuid);
                return filteredOrder;
              });
            } else if (localArchivedPin) {
              const updatedNote = {
                ...note,
                isPinned: true,
                isArchived: false,
              };
              setNotes((prev) => {
                const newNotes = new Map(prev);
                newNotes.set(note.uuid, updatedNote);
                return newNotes;
              });

              setOrder((prev) => {
                const filteredOrder = prev.filter((uuid) => uuid !== note.uuid);
                return [note.uuid, ...filteredOrder];
              });
            }
          }}
          onMouseEnter={() => {
            if (!isDragging) {
              setIsHovered(true);
            } else if (isDragging?.current) return;
            else {
              setIsHovered(true);
            }
          }}
          onMouseLeave={() => {
            if (colorMenuOpen || moreMenuOpen) return;
            setIsHovered(false);
          }}
          className="note-wrapper"
          style={{ position: "relative" }}
        >
          <span
            style={{ opacity: selected && "1" }}
            ref={checkRef}
            className="checkmark"
            onClick={handleCheckClick}
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
                note.images.length === 0 || note.title || note.content
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
                  opacity: selected && "1",
                }}
                className="pin"
              >
                {!note.isTrash && (
                  <Button onClick={handlePinClick}>
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
            <AnimatePresence>
              {isHovered && (
                <NoteTools
                  colorMenuOpen={colorMenuOpen}
                  setColorMenuOpen={handleMenuIsOpenChange}
                  moreMenuOpen={moreMenuOpen}
                  setMoreMenuOpen={setMoreMenuOpen}
                  images={note.images.length !== 0}
                  note={note}
                  setIsLoadingImages={setIsLoadingImages}
                  userID={userID}
                  setLocalIsArchived={setLocalIsArchived}
                  setLocalIsTrash={setLocalIsTrash}
                  setIsNoteDeleted={setIsNoteDeleted}
                  index={index}
                />
              )}
            </AnimatePresence>
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
            calculateLayout={calculateLayout}
            togglePin={togglePin}
            index={index}
            isLoadingImages={isLoadingImages}
            setIsLoadingImages={setIsLoadingImages}
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
