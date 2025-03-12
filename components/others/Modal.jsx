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
  const [selectedColor, setSelectedColor] = useState(null);
  const [modalIsPinned, setModalIsPinned] = useState(false);
  const [localImages, setLocalImages] = useState([]);
  const FormattedEditedDate = isOpen
    ? getNoteFormattedDate(note?.updatedAt)
    : null;

  const { data: session } = useSession();
  const userID = session?.user?.id;
  const titleTextRef = useRef(null);
  const contentTextRef = useRef(null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const modalRef = useRef(null);
  const archiveRef = useRef(false);
  const imagesChangedRef = useRef(false);
  const prevHash = useRef(null);

  const centerModal = () => {
    requestAnimationFrame(() => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;

      modalRef.current.style.transform = "none";
      modalRef.current.style.left = `${(viewportWidth - modalWidth) / 2}px`;
      modalRef.current.style.top = `${(viewportHeight - modalHeight) / 3}px`;
    });
  };

  const positionModal = () => {
    if (!initialStyle) return;
    const rect = initialStyle.element.getBoundingClientRect();
    modalRef.current.style.display = "flex";
    modalRef.current.style.left = `${rect.left}px`;
    modalRef.current.style.top = `${rect.top}px`;
    const scale = `scale(${rect.width / modalRef.current.offsetWidth}, ${
      rect.height / modalRef.current.offsetHeight
    } )`;
    modalRef.current.style.transform = scale;
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("resize", centerModal);
    }
    return () => window.removeEventListener("resize", centerModal);
  }, [isOpen]);

  useEffect(() => {
    if (!modalRef.current) return;

    if (isOpen) {
      prevHash.current = window.location.hash.replace("#", "");
      window.location.hash = `NOTE/${note?.uuid}`;

      setLocalImages(note?.images);
      setSelectedColor(note?.color);
      setModalIsPinned(note?.isPinned);
      titleTextRef.current = note?.title;
      contentTextRef.current = note?.content;

      if (contentRef?.current) {
        contentRef.current.textContent = note?.content;
      }
      if (titleRef?.current) {
        titleRef.current.innerText = note?.title;
      }

      positionModal();

      modalRef.current.offsetHeight;

      modalRef.current.style.transition =
        "all 0.2s cubic-bezier(0.35, 0.9, 0.25, 1)";

      centerModal();
    } else {
      const overlay = document.getElementById("n-overlay");
      if (!overlay) return;
      window.location.hash = prevHash.current || "home";
      modalRef.current.offsetHeight;
      positionModal();
      checkForChanges();

      const handleModalClose = (e) => {
        if (e.propertyName === "left") {
          modalRef.current.removeEventListener(
            "transitionend",
            handleModalClose
          );
          modalRef.current.removeAttribute("style");
          setLocalImages([]);
          initialStyle.element.style.opacity = "1";
        }
      };

      modalRef.current.removeEventListener("transitionend", handleModalClose); // Remove before adding
      modalRef.current.addEventListener("transitionend", handleModalClose);

      return () =>
        modalRef.current?.removeEventListener(
          "transitionend",
          handleModalClose
        );
    }
  }, [isOpen]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handlePinClick = async () => {
    setModalIsPinned((prev) => !prev);
    window.dispatchEvent(new Event("loadingStart"));
    try {
      await NoteUpdateAction("isPinned", !note.isPinned, note.uuid);
    } finally {
      window.dispatchEvent(new Event("loadingEnd"));
    }
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

  const handlePaste = (e) => {
    e.preventDefault();
    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain");
    // Insert only the text at cursor position
    document.execCommand("insertText", false, text);
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

  const checkForChanges = () => {
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
    }
  };

  if (!isMounted) return;

  return createPortal(
    <>
      <div
        ref={modalRef}
        className={[
          "modall",
          selectedColor,
          isOpen && "modal-shadow",
          selectedColor === "Default" ? "default-border" : "transparent-border",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="modal-inputs-container">
          {localImages.length === 0 && (
            <div className={isOpen ? `modal-corner` : `corner`} />
          )}
          <div className="modal-pin">
            <Button
              onClick={handlePinClick}
              disabled={!isOpen}
              style={{ opacity: !isOpen && "0" }}
            >
              <PinIcon
                color={modalIsPinned ? "#212121" : "transparent"}
                opacity={0.8}
                rotation={modalIsPinned ? "-45deg" : "-5deg"}
                images={localImages.length !== 0}
              />
            </Button>
          </div>
          <div
            style={{
              position: "relative",
              transition: "all 0.2s ease",
            }}
          >
            <NoteImagesLayout
              images={localImages}
              // isLoadingImages={isLoadingImages}
              deleteSource="note"
              noteImageDelete={noteImageDelete}
              modalOpen={isOpen}
            />
            {/* {isLoading && <div className="linear-loader" />} */}
          </div>
          {!isOpen &&
            note?.images.length === 0 &&
            !titleTextRef.current?.trim() &&
            !contentTextRef.current?.trim() && (
              <div className="empty-note" aria-label="Empty note" />
            )}
          <div
            style={{
              opacity: isOpen
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
              opacity: isOpen
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
          trigger={isOpen}
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
