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
  dispatchNotes,
  calculateLayout,
  isLoadingImages,
  setIsLoadingImages,
  isLoading,
  openSnackFunction,
  setTooltipAnchor,
  handleArchive,
  userID,
}) => {
  const modalRef = useRef(null);
  const [width, setWidth] = useState(5);
  const [isClient, setIsClient] = useState(false);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [selectedColor, setSelectedColor] = useState(note.color);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [localImages, setLocalImages] = useState(note.images);
  const hash = window.location.hash.includes("archive") ? "archive" : "home";
  const imagesChangedRef = useRef(false);
  const titleTextRef = useRef(note.title);
  const contentTextRef = useRef(note.content);
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const containerRef = useRef(null);
  const archiveRef = useRef(false);
  const isFirstRun = useRef(true);
  const FormattedEditedDate = getNoteFormattedDate(note.updatedAt);

  useEffect(() => {
    // Set isClient to true once the component is mounted on the client side
    setIsClient(true);

    window.location.hash = `${hash}/NOTE/${note.uuid}`; // Set the hash
  }, []);

  const handleClose = (e, idk = true) => {
    if (
      e.currentTarget.classList.contains("close") ||
      containerRef.current === e.target ||
      e.key === "Escape"
    ) {

      openSnackFunction({close: true});

      if (
        titleTextRef.current !== note.title ||
        contentTextRef.current !== note.content
      ) {
        dispatchNotes({
          type: "UPDATE_TEXT",
          note: note,
          newTitle: titleTextRef.current,
          newContent: contentTextRef.current,
        });
      }

      if (imagesChangedRef.current) {
        console.log("images changed");
        dispatchNotes({
          type: "UPDATE_IMAGES",
          note: note,
          newImages: localImages,
        });
      }

      setTimeout(() => {
        setTrigger2(false);
      }, 10);

      setTimeout(() => {
        if (idk) {
          if (isPinned !== note.isPinned) {
            dispatchNotes({
              type: "PIN_NOTE",
              note: note,
            });
          }
        }
        if (archiveRef.current) {
          handleArchive();
          archiveRef.current = false;
        }
        window.location.hash = hash;
        calculateLayout();
        setTrigger(false);
      }, 250);
    }
  };

  const setCursorAtEnd = (ref) => {
    const element = ref?.current;
    if (element) {
      element.focus();

      // Wait a bit for focus to apply, then set the cursor at the end
      setTimeout(() => {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false); // Move to the end
        selection.removeAllRanges();
        selection.addRange(range);
      }, 0); // Small delay to ensure focus happens first
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setTrigger2(trigger);
    }, 10);
  }, [trigger]);

  useEffect(() => {
    // console.log("source:", notePos.source)
    const nav = document.querySelector("nav");
    if (trigger2) {
      if (notePos.source === "note") {
        setCursorAtEnd(contentRef);
      } else if (notePos.source === "title") {
        setCursorAtEnd(titleRef);
      } else {
        setCursorAtEnd(contentRef);
      }
      if (contentRef?.current) contentRef.current.textContent = note.content;
      if (titleRef?.current) titleRef.current.innerText = note.title;
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      if (modalRef.current) modalRef.current.style.marginLeft = `${0}px`;
      if (nav) nav.style.marginLeft = `${-scrollbarWidth}px`;
      if (nav) nav.style.paddingLeft = `${scrollbarWidth}px`;
    } else {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = ""; // Remove padding
      if (modalRef.current)
        modalRef.current.style.marginLeft = `${
          scrollbarWidth === 0 ? 0 : scrollbarWidth - 5
        }px`;
      if (nav) nav.style.marginLeft = "0px";
      if (nav) nav.style.paddingLeft = "0px";
    }
    return () => (document.body.style.overflow = "auto"); // Cleanup
  }, [trigger2]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (modalRef?.current) {
        setWidth(modalRef?.current?.offsetWidth);
      }
    });

    if (modalRef?.current) {
      observer.observe(modalRef?.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [trigger2]);

  const updateTextDebounced = useCallback(
    debounce(async (values) => {
      window.dispatchEvent(new Event("loadingStart"));
      await NoteTextUpdateAction(values, note.uuid);
      window.dispatchEvent(new Event("loadingEnd"));
    }, 600),
    [] // Dependencies array, make sure it's updated when `note.uuid` changes
  );

  const handlePinClick = async () => {
    setIsPinned((prev) => !prev);
    window.dispatchEvent(new Event("loadingStart"));
    try {
      await NoteUpdateAction("isPinned", !note.isPinned, [note.uuid]);
    } finally {
      window.dispatchEvent(new Event("loadingEnd"));
    }
  };

  const handleTitleInput = useCallback(
    (e) => {
      const text = e.target.innerText;
      const t = text === "\n" ? "" : text;
      titleTextRef.current = t;

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
      contentTextRef.current = t;

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
      contentRef?.current?.focus();
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
      handleClose(e);
    }
  };

  const noteImageDelete = useCallback(async (imageUUID, imageURL) => {
    const imageObject = { url: imageURL, uuid: imageUUID };
    let imageIndex;

    setLocalImages((prev) => {
      const filteredImages = prev.reduce((acc, image, index) => {
        if (image.uuid === imageUUID) {
          imageIndex = index;
          return acc;
        }
        acc.push(image);
        return acc;
      }, []);
      return filteredImages;
    });

    const undo = async () => {
      setLocalImages((prev) => {
        const updatedImages = [...prev];
        updatedImages.splice(imageIndex, 0, imageObject);
        return updatedImages;
      });
    };

    const onClose = async () => {
      imagesChangedRef.current = true;
      const filePath = `${userID}/${note.uuid}/${imageUUID}`;
      window.dispatchEvent(new Event("loadingStart"));
      await NoteImageDeleteAction(filePath, note.uuid, imageUUID);
      window.dispatchEvent(new Event("loadingEnd"));
    };

    openSnackFunction({
      snackMessage: "Image deleted",
      snackOnUndo: undo,
      snackOnClose: onClose,
    });
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
            backgroundColor: note.color,
            border: "solid 1px",
            borderColor: note.color === "#FFFFFF" ? "#e0e0e0" : "transparent",
          }}
          className="modal"
        >
          <div
            style={{ overflowY: trigger2 ? "auto" : "hidden" }}
            className="modal-inputs-container"
            onScroll={handleScroll}
          >
            {localImages.length === 0 && (
              <div className={trigger2 ? `modal-corner` : `corner`} />
            )}
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
                images={localImages}
                isLoadingImages={isLoadingImages}
                deleteSource="note"
                noteImageDelete={noteImageDelete}
                modalOpen={trigger2}
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
              setLocalImages={setLocalImages}
              note={note}
              dispatchNotes={dispatchNotes}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              imagesChangedRef={imagesChangedRef}
              handleClose={handleClose}
              isAtBottom={isAtBottom}
              archiveRef={archiveRef}
              setTooltipAnchor={setTooltipAnchor}
              setIsPinned={setIsPinned}
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
