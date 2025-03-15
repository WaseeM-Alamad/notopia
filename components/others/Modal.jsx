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
  removeLabelAction,
  undoAction,
} from "@/utils/actions";
import Tools from "./Tools";
import NoteImagesLayout from "../Tools/NoteImagesLayout";
import { useSession } from "next-auth/react";
import { useAppContext } from "@/context/AppContext";
import ModalMenu from "./ModalMenu";

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
  const { handleLabelNoteCount, labelsRef } = useAppContext();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [modalIsPinned, setModalIsPinned] = useState(false);
  const [modalLabels, setModalLabels] = useState([]);
  const [localImages, setLocalImages] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const formattedEditedDate = isOpen
    ? getNoteFormattedDate(note?.updatedAt)
    : null;

  const formattedCreatedAtDate = isOpen
    ? getNoteFormattedDate(note?.createdAt)
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
    if (!isOpen) return;

    window.addEventListener("resize", centerModal);
    return () => window.removeEventListener("resize", centerModal);
  }, [isOpen]);

  useEffect(() => {
    if (!modalRef.current) return;

    if (isOpen) {
      prevHash.current = window.location.hash.replace("#", "");
      window.location.hash = `NOTE/${note?.uuid}`;

      archiveRef.current = false;
      setLocalImages(note?.images);
      setSelectedColor(note?.color);
      setModalIsPinned(note?.isPinned);
      setModalLabels(note?.labels);
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
        "all 0.22s cubic-bezier(0.35, 0.9, 0.25, 1), opacity 0.13s, background-color 0.2s linear";

      centerModal();
    } else {
      const overlay = document.getElementById("n-overlay");
      if (!overlay) return;
      window.location.hash = prevHash.current || "home";

      modalRef.current.offsetHeight;
      checkForChanges();
      setTimeout(() => {
        positionModal();
      }, 10);

      const handleModalClose = (e) => {
        if (e.propertyName === "left") {
          modalRef.current.removeEventListener(
            "transitionend",
            handleModalClose
          );
          modalRef.current.removeAttribute("style");

          setSelectedColor(null);
          setModalIsPinned(false);
          setLocalImages([]);
          setModalLabels([]);
          setRedoStack([]);
          setUndoStack([]);

          if (modalIsPinned !== note?.isPinned) {
            setTimeout(() => {
              dispatchNotes({
                type: "PIN_NOTE",
                note: note,
              });
            }, 20);
          }
          if (archiveRef.current) {
            setTimeout(() => {
              handleArchive();
            }, 20);
          }
          if (!archiveRef.current) {
            initialStyle.element.style.opacity = "1";
          }

          archiveRef.current = false;
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

  const handleArchive = async () => {
    const undoArchive = async () => {
      const initialIndex = initialStyle.index;
      dispatchNotes({
        type: "UNDO_ARCHIVE",
        note: note,
        initialIndex: initialIndex,
      });
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

  const debouncedSetUndo = useCallback(
    debounce((text) => {
      setUndoStack((prev) => [...prev, { type: "title", text }]);
    }, 200),
    []
  );

  const debouncedSetRedo = useCallback(
    debounce((text) => {
      setRedoStack((prev) => [...prev, { type: "title", text }]);
    }, 200),
    []
  );

  const handleTitleInput = useCallback(
    (e) => {
      const text = e.target.innerText;
      const t = text === "\n" ? "" : text;

      // debouncedSetUndo(t);

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
    const labelsChange =
      JSON.stringify(modalLabels) === JSON.stringify(note?.labels);
    if (!labelsChange) {
      dispatchNotes({
        type: "UPDATE_NOTE_LABELS",
        note: note,
        newLabels: modalLabels,
      });
    }
  };

  const closeToolTip = () => {
    setTooltipAnchor((prev) => ({
      anchor: null,
      text: prev?.text,
    }));
  };

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

  const removeLabel = async (labelUUID) => {
    const newLabels = modalLabels.filter(
      (noteLabelUUID) => noteLabelUUID !== labelUUID
    );
    setModalLabels(newLabels);
    handleLabelNoteCount(labelUUID, "decrement");
    window.dispatchEvent(new Event("loadingStart"));
    await removeLabelAction({
      noteUUID: note.uuid,
      labelUUID: labelUUID,
    });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  useEffect(() => {
    if (!isOpen) return;

    const observer = new ResizeObserver(() => centerModal());
    if (modalRef.current) observer.observe(modalRef.current);

    centerModal();

    return () => observer.disconnect();
  }, [isOpen]);

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
        <div
          style={{ overflowY: !isOpen && "hidden" }}
          className="modal-inputs-container"
        >
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
                isPinned={modalIsPinned}
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
              opacity: isOpen ? "1" : "0.15",
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

          {modalLabels.length > 0 && (
            <div
              style={{ paddingBottom: "0.8rem" }}
              className="note-labels-container"
            >
              {modalLabels
                .sort((a, b) => {
                  const labelsMap = labelsRef.current;
                  const labelA = labelsMap.get(a)?.label || "";
                  const labelB = labelsMap.get(b)?.label || "";
                  return labelA.localeCompare(labelB);
                })
                .map((labelUUID, index) => {
                  const label = labelsRef.current.get(labelUUID)?.label;
                  return (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      key={labelUUID}
                      className={[
                        "label-wrapper",
                        !note.isTrash && "label-wrapper-h",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <label className="note-label">{label}</label>
                      <div
                        onClick={() => {
                          closeToolTip();
                          removeLabel(labelUUID);
                        }}
                        onMouseEnter={(e) =>
                          handleMouseEnter(e, "Remove label")
                        }
                        onMouseLeave={handleMouseLeave}
                        className="remove-label"
                      />
                    </div>
                  );
                })}
            </div>
          )}

          {isOpen && (
            <div className="modal-date-section">
              <div
                onMouseEnter={(e) =>
                  handleMouseEnter(e, "Created " + formattedCreatedAtDate)
                }
                onMouseLeave={handleMouseLeave}
                className="edited"
              >
                Edited
                {" " + formattedEditedDate}
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
          openSnackFunction={openSnackFunction}
          note={note}
          modalLabels={modalLabels}
          setModalLabels={setModalLabels}
          dispatchNotes={dispatchNotes}
          setIsOpen={setIsOpen}
          setModalStyle={setModalStyle}
          imagesChangedRef={imagesChangedRef}
          setLocalImages={setLocalImages}
          undoStack={undoStack}
          redoStack={redoStack}
        />
      </div>
    </>,
    document.getElementById("modal-portal")
  );
};

export default Modal;
