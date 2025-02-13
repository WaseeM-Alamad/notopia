import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "@/assets/styles/modal.css";
import Button from "../Tools/Button";
import PinIcon from "../icons/PinIcon";
import { getNoteFormattedDate } from "@/utils/noteDateFormatter";
import { debounce } from "lodash";
import {
  NoteImageDeleteAction,
  NoteTextUpdateAction,
  NoteUpdateAction,
  undoAction,
} from "@/utils/actions";
import Tools from "./Tools";
import NoteImagesLayout from "../Tools/NoteImagesLayout";
import { useSession } from "next-auth/react";

const Modal = ({
  note,
  initialStyle,
  isOpen,
  setIsOpen,
  onClose,
  closeRef,
  setTooltipAnchor,
  dispatchNotes,
  openSnackFunction,
  closeSnackbar,
  setModalStyle,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [display, setDisplay] = useState(false);
  const [trigger, setTrigger] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [modalIsPinned, setModalIsPinned] = useState(false);
  const [localImages, setLocalImages] = useState([]);
  const FormattedEditedDate = trigger
    ? getNoteFormattedDate(note?.updatedAt)
    : null;

  const { data: session } = useSession();
  const userID = session?.user?.id;
  const titleTextRef = useRef(null);
  const contentTextRef = useRef(null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const modalRef = useRef(null);
  const modalHeightRef = useRef(null);
  const archiveRef = useRef(false);
  const isFirstRenderRef = useRef(true);
  const imagesChangedRef = useRef(false);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (isOpen) {
      initialStyle.element.classList.add("opacity");
      setSelectedColor(note?.color);
      setLocalImages(note?.images);
      titleTextRef.current = note?.title;

      contentTextRef.current = note?.content;
      if (contentRef?.current) {
        contentRef.current.textContent = note?.content;
      }
      if (titleRef?.current) {
        titleRef.current.innerText = note?.title;
      }
      setModalIsPinned(note?.isPinned);
      setTimeout(() => {
        setTrigger(true);
      }, 20);
      setTimeout(() => {
        setDisplay(true);
      }, 0);
    } else {
      modalHeightRef.current =
        modalRef?.current?.getBoundingClientRect()?.height;
      handleClose();

      setTimeout(() => {
        setModalStyle((prev) => {
          const rect = prev.element.getBoundingClientRect();
          return {
            ...prev,
            height: rect.height,
          };
        });
        setTrigger(false);
      }, 10);
    }

    const handler = (e) => {
      if (e.propertyName === "top" && !isOpen) {
        // console.log("finish");
        initialStyle.element.classList.remove("opacity");

        if (initialStyle?.element) {
          initialStyle.element.style.opacity = "1";
        }

        if (archiveRef.current) {
          handleArchive();
        }

        setDisplay(false);
        // setSelectedColor(null);

        if (modalIsPinned !== note?.isPinned) {
          dispatchNotes({
            type: "PIN_NOTE",
            note: note,
          });
        }

        setLocalImages([]);
        // titleTextRef.current = null;
        // contentTextRef.current = null;
        // titleRef.current = null;
        // contentRef.current = null;
        onClose();
        imagesChangedRef.current = false;

        // window.dispatchEvent(new Event("calculateLayout"));

        modalRef.current.removeEventListener("transitionend", handler);
      }
    };

    if (modalRef.current) {
      modalRef.current.addEventListener("transitionend", handler);
    }
  }, [isOpen]);

  useEffect(() => {
    closeRef.current = handleClose;
  }, [note, modalIsPinned]);

  const handleClose = () => {
    if (
      titleTextRef.current !== note?.title ||
      contentTextRef.current !== note?.content
    ) {
      console.log("compare text");
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
      closeSnackbar();
    }
  };

  const updateTextDebounced = useCallback(
    debounce(async (values) => {
      window.dispatchEvent(new Event("loadingStart"));
      await NoteTextUpdateAction(values, note?.uuid);
      window.dispatchEvent(new Event("loadingEnd"));
    }, 600),
    [note?.uuid] // Dependencies array, make sure it's updated when `note.uuid` changes
  );

  const handleTitleInput = useCallback(
    (e) => {
      const text = e.target.innerText;
      const t = text === "\n" ? "" : text;
      titleTextRef.current = t;

      updateTextDebounced({ title: t, content: contentTextRef.current });

      if (text === "\n") {
        e.target.innerText = "";
      }
    },
    [note?.content]
  );

  const handleContentInput = useCallback(
    (e) => {
      const text = e.target.innerText;
      const t = text === "\n" ? "" : text;
      contentTextRef.current = t;

      updateTextDebounced({ title: titleTextRef.current, content: t });

      if (text === "\n") {
        e.target.innerText = "";
      }
    },
    [note?.title]
  );

  const handlePaste = (e) => {
    e.preventDefault();
    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain");
    // Insert only the text at cursor position
    document.execCommand("insertText", false, text);
  };

  const handlePinClick = async () => {
    setModalIsPinned((prev) => !prev);
    window.dispatchEvent(new Event("loadingStart"));
    try {
      await NoteUpdateAction("isPinned", !note.isPinned, note.uuid);
    } finally {
      window.dispatchEvent(new Event("loadingEnd"));
    }
  };

  useEffect(() => {
    const nav = document.querySelector("nav");
    if (trigger) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      if (modalRef.current) modalRef.current.style.marginLeft = `${0}px`;
      if (nav) nav.style.marginLeft = `${-scrollbarWidth}px`;
      if (nav) nav.style.paddingLeft = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "";
      if (nav) nav.style.marginLeft = "0px";
      if (nav) nav.style.paddingLeft = "0px";
    }
    return () => (document.body.style.overflow = "auto"); // Cleanup
  }, [trigger]);

  const handleArchive = async () => {
    setTimeout(async () => {
      const undoArchive = async () => {
        const initialIndex = initialStyle.index;
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

      dispatchNotes({
        type: "ARCHIVE_NOTE",
        note: note,
      });

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
      const first = initialStyle.index === 0;
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction("isArchived", !note.isArchived, note.uuid, first);
      window.dispatchEvent(new Event("loadingEnd"));

      archiveRef.current = false;
    }, 10);
  };

  const noteImageDelete = useCallback(
    async (imageUUID, imageURL) => {
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

      imagesChangedRef.current = true;

      const undo = async () => {
        setLocalImages((prev) => {
          const updatedImages = [...prev];
          updatedImages.splice(imageIndex, 0, imageObject);
          return updatedImages;
        });
        imagesChangedRef.current = false;
      };

      const onClose = async () => {
        // imagesChangedRef.current = true;
        const filePath = `${userID}/${note.uuid}/${imageUUID}`;
        window.dispatchEvent(new Event("loadingStart"));
        await NoteImageDeleteAction(filePath, note.uuid, imageUUID);
        window.dispatchEvent(new Event("loadingEnd"));
      };

      openSnackFunction({
        snackMessage: "Image deleted",
        snackOnUndo: undo,
        snackOnClose: onClose,
        unloadWarn: true,
      });
    },
    [note?.uuid]
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return;

  return createPortal(
    <>
      <div
        className="modal"
        ref={modalRef}
        style={{
          display: display ? "flex" : "none",
          top: !trigger ? initialStyle?.top : "30%",
          left: !trigger ? initialStyle?.left : "50%",
          width: "600px",
          transform: trigger
            ? "translate(-50%, -30%) "
            : `scale(0.4, ${initialStyle?.height / modalHeightRef?.current})`,
          transformOrigin: "top left",
          backgroundColor: selectedColor,
          border: "solid 1px",
          borderColor: note?.color === "#FFFFFF" ? "#e0e0e0" : "transparent",
        }}
      >
        <div
          style={{
            overflowY: trigger ? "auto" : "hidden",
            opacity: trigger ? "1" : "0",
          }}
          className="modal-inputs-container"
        >
          {localImages.length === 0 && (
            <div className={trigger ? `modal-corner` : `corner`} />
          )}
          <div className="modal-pin">
            <Button
              onClick={handlePinClick}
              disabled={!trigger}
              style={{ opacity: !trigger && "0" }}
            >
              <PinIcon
                color={modalIsPinned ? "#212121" : "transparent"}
                opacity={0.8}
                rotation={modalIsPinned ? "0deg" : "40deg"}
              />
            </Button>
          </div>
          <div
            style={{
              position: "relative",
              // opacity: isLoading ? "0.6" : "1",
              transition: "all 0.2s ease",
            }}
          >
            <NoteImagesLayout
              images={localImages}
              // isLoadingImages={isLoadingImages}
              deleteSource="note"
              noteImageDelete={noteImageDelete}
              modalOpen={trigger}
            />
            {/* {isLoading && <div className="linear-loader" />} */}
          </div>
          {!trigger &&
            note?.images.length === 0 &&
            !titleTextRef.current?.trim() &&
            !contentTextRef.current?.trim() && (
              <div className="empty-note" aria-label="Empty note" />
            )}
          <div
            style={{
              opacity: trigger
                ? "1"
                : contentTextRef.current && !titleTextRef.current
                ? "0"
                : !titleTextRef.current && !contentTextRef.current
                ? "0"
                : "1",
            }}
            contentEditable
            suppressContentEditableWarning
            onInput={handleTitleInput}
            onPaste={handlePaste}
            ref={titleRef}
            className="
               modal-title-input modal-editable-title"
            role="textbox"
            tabIndex="0"
            aria-multiline="true"
            aria-label="Title"
            spellCheck="false"
          />
          <div
            style={{
              opacity: trigger
                ? "1"
                : !contentTextRef.current && titleTextRef.current
                ? "0"
                : !titleTextRef.current && !contentTextRef.current
                ? "0"
                : "1",
              minHeight: "30px",
              transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
            }}
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentInput}
            onPaste={handlePaste}
            ref={contentRef}
            className={`${"modal-content-input"} modal-editable-content`}
            role="textbox"
            tabIndex="0"
            aria-multiline="true"
            aria-label="Note"
            spellCheck="false"
          />
          {isOpen && (
            <div className="modal-date-section">
              <div className="edited">
                Edited
                {" " + FormattedEditedDate}
              </div>
            </div>
          )}
        </div>
        <Tools
          trigger={trigger}
          archiveRef={archiveRef}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          setTooltipAnchor={setTooltipAnchor}
          note={note}
          dispatchNotes={dispatchNotes}
          setIsOpen={setIsOpen}
          setModalStyle={setModalStyle}
          imagesChangedRef={imagesChangedRef}
          setLocalImages={setLocalImages}
        />
      </div>
    </>,
    document.getElementById("modal-portal")
  );
};

export default Modal;
