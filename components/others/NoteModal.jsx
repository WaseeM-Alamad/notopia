import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import "@/assets/styles/modal.css";
import { createPortal } from "react-dom";
import Button from "../Tools/Button";
import PinIcon from "../icons/PinIcon";
import NoteImagesLayout from "../Tools/NoteImagesLayout";
import {
  NoteTextUpdateAction,
  NoteUpdateAction,
  NoteImageDeleteAction,
} from "@/utils/actions";
import { debounce } from "lodash";
import NoteModalTools from "./NoteModalTools";
import { getNoteFormattedDate } from "@/utils/noteDateFormatter";

const NoteModal = ({
  trigger,
  setTrigger,
  trigger2,
  setTrigger2,
  notePos,
  note,
  setNotes,
  calculateLayout,
  togglePin,
  isLoadingImages,
  setIsLoadingImages,
  isLoading,
  userID,
}) => {
  const modalRef = useRef(null);
  const [width, setWidth] = useState(5);
  const [isClient, setIsClient] = useState(false);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [selectedColor, setSelectedColor] = useState(note.color);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const hash = window.location.hash.includes("archive") ? "archive" : "home";
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const containerRef = useRef(null);
  const isFirstRun = useRef(true);
  const FormattedEditedDate = getNoteFormattedDate(note.updatedAt);

  useEffect(() => {
    // Set isClient to true once the component is mounted on the client side
    setIsClient(true);

    window.location.hash = `${hash}/NOTE/${note.uuid}`; // Set the hash
  }, []);

  const handleClose = (e, closeRef) => {
    if (containerRef.current === e.target || closeRef?.current === e.target) {
      setTrigger2(false);
      setTimeout(() => {
        if (isPinned !== note.isPinned) {
          togglePin(note.uuid);
        }
        window.location.hash = hash;
        calculateLayout();
        setTrigger(false);
      }, 250);
    }
  };

  useEffect(() => {
    if (isFirstRun.current === true) {
      isFirstRun.current = false;
      return;
    }
    if (isPinned !== note.isPinned) {
      setNotes((prevNotes) =>
        prevNotes.map((mapNote) =>
          mapNote.uuid === note.uuid
            ? { ...mapNote, updatedAt: new Date() }
            : mapNote
        )
      );
    }
  }, [
    note.title,
    note.content,
    note.color,
    note.labels,
    isPinned,
    note.isArchived,
    note.isTrash,
    note.images,
  ]);

  useEffect(() => {
    setTimeout(() => {
      setTrigger2(trigger);
    }, 10);
  }, [trigger]);

  useEffect(() => {
    if (trigger2) {
      if (notePos.source === "note") {
        contentRef.current.focus();
      } else if (notePos.source === "title") {
        titleRef.current.focus();
      } else {
        contentRef.current.focus();
      }
      if (contentRef.current) contentRef.current.textContent = note.content;
      if (titleRef.current) titleRef.current.innerText = note.title;
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      modalRef.current.style.marginLeft = `${0}px`;
      //marginLeft: trigger2? '0px': "5px",
    } else {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = ""; // Remove padding
      if (modalRef.current)
        modalRef.current.style.marginLeft = `${
          scrollbarWidth === 0 ? 0 : scrollbarWidth - 5
        }px`;
    }
    return () => (document.body.style.overflow = "auto"); // Cleanup
  }, [trigger2]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (modalRef.current) {
        setWidth(modalRef.current?.offsetWidth);
      }
    });

    if (modalRef.current) {
      observer.observe(modalRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [trigger2]);

  const updateTextDebounced = useCallback(
    debounce(async (values) => {
      window.dispatchEvent(new Event("loadingStart"));
      await NoteTextUpdateAction(values, note.uuid);
      setTimeout(() => {
        window.dispatchEvent(new Event("loadingEnd"));
      }, 800);
    }, 600),
    [] // Dependencies array, make sure it's updated when `note.uuid` changes
  );

  const handlePinClick = async () => {
    setIsPinned((prev) => !prev);
    window.dispatchEvent(new Event("loadingStart"));
    try {
      await NoteUpdateAction("isPinned", !note.isPinned, note.uuid);
    } finally {
      setTimeout(() => {
        window.dispatchEvent(new Event("loadingEnd"));
      }, 800);
    }
  };

  const handleTitleInput = useCallback(
    (e) => {
      const text = e.target.innerText;
      const t = text === "\n" ? "" : text;
      setNotes((prevNotes) => {
      return prevNotes.map((noteItem) =>
        noteItem.uuid === note.uuid ? { ...noteItem, title: t } : noteItem
      );
    });

      updateTextDebounced({ title: t, content: note.content });

      if (text === "\n") {
        e.target.innerText = "";
      }
    },
    [note.uuid, note.content]
  );

  const handleContentInput = useCallback(
    (e) => {
      const text = e.target.innerText;
      const t = text === "\n" ? "" : text;
      setNotes((prevNotes) => {
        return prevNotes.map((noteItem) =>
          noteItem.uuid === note.uuid ? { ...noteItem, content: t } : noteItem
        );
      });
      updateTextDebounced({ title: note.title, content: t });

      if (text === "\n") {
        e.target.innerText = "";
      }
    },
    [note.uuid, note.title]
  );

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      contentRef.current.focus();
    } else if (e.shiftKey && e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertLineBreak");
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain");
    // Insert only the text at cursor position
    document.execCommand("insertText", false, text);
  };

  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;

    // Check if the scroll position is at the bottom
    if (scrollTop + clientHeight === scrollHeight) {
      setIsAtBottom(true); // Set state to true when at the bottom
    } else {
      setIsAtBottom(false); // Set state to false when not at the bottom
    }
  };

  const closeKeyDown = (e) => {
    if (e.key === "Escape") {
      setTrigger2(false);
      setTimeout(() => {
        setTrigger(false);
      }, 250);
    }
  };

  const noteImageDelete = useCallback(async (imageID) => {
    setNotes((prevNotes) =>
      prevNotes.map((mapNote) =>
        mapNote.uuid === note.uuid
          ? {
              ...mapNote,
              images: mapNote.images.filter((image) => image.uuid !== imageID),
            }
          : mapNote
      )
    );
    const filePath = `${userID}/${note.uuid}/${imageID}`;
    window.dispatchEvent(new Event("loadingStart"));
    await NoteImageDeleteAction(filePath, note.uuid, imageID);
    setTimeout(() => {
      window.dispatchEvent(new Event("loadingEnd"));
    }, 800);
  }, []);

  if (!isClient || !trigger) {
    return null; // Return nothing on the server side
  }

  return createPortal(
    <>
      <div
        ref={containerRef}
        onClick={handleClose}
        onKeyDown={closeKeyDown}
        style={{
          display: trigger ? "" : "none",
          backgroundColor: trigger2 && "rgba(0,0,0,0.5)",
        }}
        className="modal-container"
      >
        <div
          ref={modalRef}
          style={{
            top: trigger2 ? "30%" : `${notePos.top}px`,
            left: trigger2 ? "50%" : `${notePos.left}px`,
            width: trigger2 ? "600px" : `${notePos.width}px`,
            height: trigger2 ? "" : `${notePos.height}px`,
            minHeight: trigger2 ? "185px" : "",
            transform: trigger2 && "translate(-50%, -30%)",
            borderRadius: "0.7rem",
            backgroundColor: note.color,
            transition:
              "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), width 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.25s linear",
          }}
          className="modal"
        >
          <div
            style={{ overflowY: trigger2 ? "auto" : "hidden" }}
            className="modal-inputs-container"
            onScroll={handleScroll}
          >
            {note.images.length === 0 && <div className="modal-corner" />}
            <div className="modal-pin">
              <Button
                disabled={!trigger2}
                style={{ opacity: !trigger2 && "0" }}
                onClick={handlePinClick}
              >
                <PinIcon
                  color={isPinned ? "#212121" : "transparent"}
                  opacity={0.8}
                  rotation={isPinned ? "0deg" : "40deg"}
                />
              </Button>
            </div>
            <div
              style={{
                position: "relative",
                opacity: isLoading ? "0.6" : "1",
                transition: "all 0.2s ease",
              }}
            >
              <NoteImagesLayout
                width={width}
                images={note.images}
                isLoadingImages={isLoadingImages}
                deleteSource="note"
                noteImageDelete={noteImageDelete}
                modalOpen={true}
              />
              {isLoading && <div className="linear-loader" />}
            </div>
            {!trigger2 &&
              note.images.length === 0 &&
              !note.title.trim() &&
              !note.content.trim() && (
                <div className="empty-note" aria-label="Empty note" />
              )}
            <div
              style={{
                display: trigger2
                  ? ""
                  : note.content && !note.title
                  ? "none"
                  : !note.title && !note.content
                  ? "none"
                  : "",
              }}
              contentEditable
              suppressContentEditableWarning
              onInput={handleTitleInput}
              onKeyDown={handleTitleKeyDown}
              onPaste={handlePaste}
              ref={titleRef}
              className={`${
                trigger2 ? "modal-title-input" : "modal-closed-title-input"
              } modal-editable-title`}
              role="textbox"
              tabIndex="0"
              aria-multiline="true"
              aria-label="Title"
              spellCheck="false"
            />
            <div
              style={{
                display: trigger2
                  ? ""
                  : !note.content && note.title
                  ? "none"
                  : !note.title && !note.content
                  ? "none"
                  : "",
                // minHeight: "3.8rem",
                transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
              }}
              contentEditable
              suppressContentEditableWarning
              onInput={handleContentInput}
              onPaste={handlePaste}
              ref={contentRef}
              className={`${
                trigger2 ? "modal-content-input" : "modal-closed-content-input"
              } modal-editable-content`}
              role="textbox"
              tabIndex="0"
              aria-multiline="true"
              aria-label="Note"
              spellCheck="false"
            />
            {trigger2 && (
              <div className="modal-date-section">
                <div className="edited">
                  Edited
                  {" " + FormattedEditedDate}
                </div>
              </div>
            )}
          </div>

          {trigger2 && (
            <NoteModalTools
              setNotes={setNotes}
              note={note}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              handleClose={handleClose}
              isAtBottom={isAtBottom}
              setIsLoadingImages={setIsLoadingImages}
            />
          )}
        </div>
      </div>
    </>,
    document.getElementById("modal-portal")
  );
};

export default memo(NoteModal);
