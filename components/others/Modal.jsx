import React, { memo, useCallback, useEffect, useRef, useState } from "react";
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
import { v4 as uuid } from "uuid";
import ListItemsLayout from "./ListitemsLayout";

const Modal = ({
  note,
  noteActions,
  initialStyle,
  setInitialStyle,
  isOpen,
  setIsOpen,
  setTooltipAnchor,
  dispatchNotes,
  openSnackFunction,
  setModalStyle,
  current,
}) => {
  const { handleLabelNoteCount, labelsRef, ignoreKeysRef } = useAppContext();
  const [isMounted, setIsMounted] = useState(false);
  const [localNote, setLocalNote] = useState(null);
  const [localPinned, setLocalPinned] = useState(null);
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
  const addListItemRef = useRef(null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const modalRef = useRef(null);
  const archiveRef = useRef(false);
  const trashRef = useRef(false);
  const imagesChangedRef = useRef(false);
  const prevHash = useRef(null);
  const ignoreTopRef = useRef(false);

  const centerModal = () => {
    requestAnimationFrame(() => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;

      const topPos = (viewportHeight - modalHeight) / 3;

      modalRef.current.style.transform = "none";
      modalRef.current.style.left = `${(viewportWidth - modalWidth) / 2}px`;
      if (!ignoreTopRef.current) {
        modalRef.current.style.top = `${topPos > 30 ? topPos : 30}px`;
      }
    });
  };

  const positionModal = () => {
    if (initialStyle) {
      const rect = initialStyle.element.getBoundingClientRect();
      modalRef.current.style.display = "flex";
      modalRef.current.style.left = `${rect.left}px`;
      modalRef.current.style.top = `${rect.top}px`;
      const scale = `scale(${rect.width / modalRef.current.offsetWidth}, ${
        rect.height / modalRef.current.offsetHeight
      } )`;
      modalRef.current.style.transform = scale;
    } else {
      modalRef.current.style.display = "flex";
      modalRef.current.style.left = `50%`;
      modalRef.current.style.top = `30%`;
      modalRef.current.style.transform = "translate(50%, 30%)";
    }
  };

  const reset = () => {
    setLocalNote(null);
    setLocalPinned(null);
    setRedoStack([]);
    setUndoStack([]);
  };

  const closeModal = () => {
    const overlay = document.getElementById("n-overlay");
    modalRef.current.removeAttribute("style");
    overlay.removeAttribute("style");

    reset();

    const { ref: _, ...cleanLocalNote } = localNote;
    const { ref: __, ...cleanNote } = note;

    if (JSON.stringify(cleanLocalNote) !== JSON.stringify(cleanNote)) {
      dispatchNotes({ type: "SET_NOTE", note: localNote });
      console.log("change");
    }

    if (localPinned !== note?.isPinned) {
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
    } else if (trashRef.current) {
      setTimeout(() => {
        handleTrash();
      }, 20);
    }
    if ((!archiveRef.current || !trashRef.current) && initialStyle) {
      initialStyle.element.style.opacity = "1";
    }

    archiveRef.current = false;
    trashRef.current = false;
    setInitialStyle(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("resize", centerModal);
    return () => window.removeEventListener("resize", centerModal);
  }, [isOpen]);

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash.toLowerCase().startsWith("note/")) {
        prevHash.current = window.location.hash.replace("#", "");
      }
    };

    handler();

    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  useEffect(() => {
    if (!modalRef.current) return;
    const overlay = document.getElementById("n-overlay");

    if (isOpen) {
      window.location.hash = `NOTE/${note?.uuid}`;
      ignoreKeysRef.current = true;
      archiveRef.current = false;
      trashRef.current = false;
      setLocalNote(note);
      setLocalPinned(note?.isPinned);
      titleTextRef.current = note?.title;
      contentTextRef.current = note?.content;

      if (contentRef?.current) {
        contentRef.current.textContent = note?.content;
      }
      if (titleRef?.current) {
        titleRef.current.innerText = note?.title;
      }

      positionModal();

      overlay.style.display = "block";
      overlay.offsetHeight;
      overlay.style.opacity = "1";

      modalRef.current.offsetHeight;

      modalRef.current.style.transition =
        "all 0.22s cubic-bezier(0.35, 0.9, 0.25, 1), opacity 0.13s";

      const handler = (e) => {
        if (e.propertyName === "top") {
          modalRef.current.removeEventListener("transitionend", handler);
          modalRef.current.style.transition =
            "top .13s, opacity 0.13s, background-color 0.25s ease-in-out";
        }
      };

      modalRef.current.addEventListener("transitionend", handler);

      centerModal();

      return () =>
        modalRef?.current?.removeEventListener("transitionend", handler);
    } else {
      ignoreKeysRef.current = false;
      if (!prevHash.current) {
        window.location.hash = current.toLowerCase();
      } else {
        window.location.hash = prevHash.current;
      }

      modalRef.current.style.transition =
        "all 0.22s cubic-bezier(0.35, 0.9, 0.25, 1), opacity 0.13s";
      modalRef.current.offsetHeight;
      overlay.style.opacity = "0";
      checkForChanges();
      if (initialStyle) {
        setTimeout(() => {
          positionModal();
        }, 10);
      }
      const handleModalClose = (e) => {
        if (e.propertyName === "top") {
          modalRef.current.removeEventListener(
            "transitionend",
            handleModalClose
          );

          closeModal();
        }
      };

      if (initialStyle) {
        modalRef.current.removeEventListener("transitionend", handleModalClose); // Remove before adding
        modalRef.current.addEventListener("transitionend", handleModalClose);
      } else {
        modalRef.current.style.transition = "opacity 0.09s";
        modalRef.current.style.opacity = 0;
        setTimeout(() => {
          closeModal();
        }, 90);
      }

      return () =>
        modalRef.current?.removeEventListener(
          "transitionend",
          handleModalClose
        );
    }
  }, [isOpen]);

  useEffect(() => {
    const nav = document.querySelector("nav");
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      // modalRef.current.style.marginLeft = `${0}px`;
      if (nav) nav.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = ""; // Remove padding
      // if (modalRef.current)
      // modalRef.current.style.marginLeft = `${
      // scrollbarWidth === 0 ? 0 : scrollbarWidth - 5
      // }px`;
      if (nav) nav.style.paddingRight = "0px";
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.id === "n-overlay") {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

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
          : localPinned
          ? "Note unpinned and archived"
          : "Note Archived"
      }`,
      snackOnUndo: undoArchive,
    });
    const first = initialStyle.index === 0;
    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction({
      type: "isArchived",
      value: !note.isArchived,
      noteUUIDs: [note.uuid],
      first: first,
    });
    window.dispatchEvent(new Event("loadingEnd"));

    archiveRef.current = false;
  };

  const handleTrash = () => {
    dispatchNotes({
      type: "TRASH_NOTE",
      note: note,
    });

    const undoTrash = async () => {
      dispatchNotes({
        type: "UNDO_TRASH",
        note: note,
        initialIndex: initialStyle?.index,
      });
    };

    const onClose = async () => {
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction({
        type: "isTrash",
        value: true,
        noteUUIDs: [note.uuid],
      });
      window.dispatchEvent(new Event("loadingEnd"));
    };

    if (!note.isTrash) {
      openSnackFunction({
        snackMessage: `${
          localPinned ? "Note unpinned and trashed" : "Note trashed"
        }`,
        snackOnUndo: undoTrash,
        snackOnClose: onClose,
        unloadWarn: true,
      });
    }
    trashRef.current = false;
  };

  const handlePinClick = async () => {
    setLocalPinned((prev) => !prev);
    window.dispatchEvent(new Event("loadingStart"));
    try {
      await NoteUpdateAction({
        type: "isPinned",
        value: !localPinned,
        noteUUIDs: [note.uuid],
      });
    } finally {
      window.dispatchEvent(new Event("loadingEnd"));
    }
  };

  const noteImageDelete = useCallback(
    async (imageUUID, imageURL) => {
      const imageObject = { url: imageURL, uuid: imageUUID };
      let imageIndex;

      // setLocalImages((prev) => {
      //   const filteredImages = prev.reduce((acc, image, index) => {
      //     if (image.uuid === imageUUID) {
      //       imageIndex = index;
      //       return acc;
      //     }
      //     acc.push(image);
      //     return acc;
      //   }, []);
      //   return filteredImages;
      // });

      setLocalNote((prev) => ({
        ...prev,
        images: prev.images.reduce((acc, image, index) => {
          if (image.uuid === imageUUID) {
            imageIndex = index;
            return acc;
          }
          acc.push(image);
          return acc;
        }, []),
      }));

      imagesChangedRef.current = true;

      const undo = async () => {
        // setLocalImages((prev) => {
        //   const updatedImages = [...prev];
        //   updatedImages.splice(imageIndex, 0, imageObject);
        //   return updatedImages;
        // });

        setLocalNote((prev) => {
          const updatedImages = [...prev.images];
          updatedImages.splice(imageIndex, 0, imageObject);
          return { ...prev, images: updatedImages };
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

  const titleDebouncedSetUndo = useCallback(
    debounce((data) => {
      setUndoStack((prev) => [...prev, data]);
    }, 120),
    []
  );

  const contentDebouncedSetUndo = useCallback(
    debounce((data) => {
      setUndoStack((prev) => [...prev, data]);
    }, 100),
    []
  );

  const handleUndo = async () => {
    if (undoStack.length === 1) {
      setRedoStack((prev) => [...prev, undoStack[0]]);
      setUndoStack([]);
      titleRef.current.innerText = note?.title;
      contentRef.current.innerText = note?.content;
      titleTextRef.current = note?.title;
      contentTextRef.current = note?.content;
      window.dispatchEvent(new Event("loadingStart"));
      await NoteTextUpdateAction(
        { title: note?.title, content: note?.content },
        note?.uuid
      );
      window.dispatchEvent(new Event("loadingEnd"));
    } else {
      const redoItem = undoStack[undoStack.length - 1];
      setRedoStack((prev) => [...prev, redoItem]);
      const updatedStack = undoStack.slice(0, -1);
      setUndoStack(updatedStack);
      const undoItem = updatedStack[updatedStack.length - 1];

      titleRef.current.innerText = undoItem.title;
      contentRef.current.innerText = undoItem.content;
      titleTextRef.current = undoItem.title;
      contentTextRef.current = undoItem.content;
      window.dispatchEvent(new Event("loadingStart"));
      await NoteTextUpdateAction(
        { title: undoItem.title, content: undoItem.content },
        note?.uuid
      );
      window.dispatchEvent(new Event("loadingEnd"));
    }
  };

  const handleRedo = async () => {
    const undoItem = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, undoItem]);
    setRedoStack((prev) => prev.slice(0, -1));
    const redoItem = redoStack[redoStack.length - 1];

    titleRef.current.innerText = redoItem.title;
    contentRef.current.innerText = redoItem.content;
    titleTextRef.current = redoItem.title;
    contentTextRef.current = redoItem.content;

    window.dispatchEvent(new Event("loadingStart"));
    await NoteTextUpdateAction(
      { title: redoItem.title, content: redoItem.content },
      note?.uuid
    );
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const handleTitleInput = useCallback(
    (e) => {
      const text = e.target.innerText;
      const t = text === "\n" ? "" : text;
      titleDebouncedSetUndo({ title: t, content: contentTextRef.current });

      titleTextRef.current = t;

      updateTextDebounced({ title: t, content: contentTextRef.current });

      if (text === "\n") {
        e.target.innerText = "";
      }
    },
    [note?.content, note?.title, undoStack]
  );

  const handleContentInput = useCallback(
    (e) => {
      const text = e.target.innerText;
      const t = text === "\n" ? "" : text;

      contentDebouncedSetUndo({ title: titleTextRef.current, content: t });

      contentTextRef.current = t;

      updateTextDebounced({ title: titleTextRef.current, content: t });

      if (text === "\n") {
        e.target.innerText = "";
      }
    },
    [note?.content, note?.title, undoStack]
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
        newImages: localNote?.images,
      });
    }
    const labelsChange =
      JSON.stringify(localNote?.labels) === JSON.stringify(note?.labels);
    if (!labelsChange) {
      dispatchNotes({
        type: "UPDATE_NOTE_LABELS",
        note: note,
        newLabels: localNote?.labels,
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
    const newLabels = localNote?.labels.filter(
      (noteLabelUUID) => noteLabelUUID !== labelUUID
    );
    setLocalNote((prev) => ({ ...prev, labels: newLabels }));
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
          localNote?.color,
          isOpen && "modal-shadow",
          localNote?.color === "Default"
            ? "default-border"
            : "transparent-border",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ minHeight: "180px" }}
      >
        <div
          style={{ overflowY: !isOpen && "hidden" }}
          className={`modal-inputs-container ${
            "n-bg-" + localNote?.background
          }`}
        >
          {localNote?.images.length === 0 && (
            <div className={isOpen ? `modal-corner` : `corner`} />
          )}
          <div style={{ opacity: !isOpen && "0" }} className="modal-pin">
            <Button onClick={handlePinClick} disabled={!isOpen}>
              <PinIcon
                isPinned={localPinned}
                opacity={0.8}
                rotation={localPinned ? "-45deg" : "-5deg"}
                images={localNote?.images.length !== 0}
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
              images={localNote?.images}
              // isLoadingImages={isLoadingImages}
              deleteSource="note"
              noteImageDelete={noteImageDelete}
              modalOpen={isOpen}
            />
            {/* {isLoading && <div className="linear-loader" />} */}
          </div>
          {!isOpen &&
            localNote?.images.length === 0 &&
            !titleTextRef.current?.trim() &&
            !contentTextRef.current?.trim() &&
            (localNote?.checkboxes.length === 0 ||
              !localNote?.showCheckboxes) && (
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

          <ListItemsLayout
            localNote={localNote}
            setLocalNote={setLocalNote}
            ignoreTopRef={ignoreTopRef}
            dispatchNotes={dispatchNotes}
            isOpen={isOpen}
          />

          {localNote?.labels.length > 0 && (
            <div
              style={{ paddingBottom: "0.8rem" }}
              className="note-labels-container"
            >
              {localNote?.labels
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
          trashRef={trashRef}
          setLocalNote={setLocalNote}
          localNote={localNote}
          setTooltipAnchor={setTooltipAnchor}
          openSnackFunction={openSnackFunction}
          note={note}
          noteActions={noteActions}
          dispatchNotes={dispatchNotes}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          setModalStyle={setModalStyle}
          imagesChangedRef={imagesChangedRef}
          undoStack={undoStack}
          redoStack={redoStack}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
        />
      </div>
    </>,
    document.getElementById("modal-portal")
  );
};

export default memo(Modal);
