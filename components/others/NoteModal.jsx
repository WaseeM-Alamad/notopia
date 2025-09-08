import React, { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NoteUpdateAction, undoAction } from "@/utils/actions";
import { useAppContext } from "@/context/AppContext";
import { useSearch } from "@/context/SearchContext";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";
import NoteEditor from "./NoteEditor";
import CollabLayout from "./CollabLayout";

const NoteModal = ({
  localNote,
  setLocalNote,
  setFadingNotes,
  noteActions,
  initialStyle,
  setInitialStyle,
  isOpen,
  setIsOpen,
  rootContainerRef,
  dispatchNotes,
  setModalStyle,
  currentSection,
  setVisibleItems,
  labelObj,
  skipSetLabelObjRef,
}) => {
  const {
    labelsRef,
    ignoreKeysRef,
    user,
    clientID,
    openSnackRef,
    notesStateRef,
  } = useAppContext();
  const { skipHashChangeRef, searchTerm, filters } = useSearch();
  const [isMounted, setIsMounted] = useState(false);
  const [localIsPinned, setLocalIsPinned] = useState(null);
  const note = initialStyle?.initialNote;
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const userID = user?.id;
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const modalRef = useRef(null);
  const archiveRef = useRef(false);
  const trashRef = useRef(false);
  const delayLabelDispatchRef = useRef(false);
  const delayImageDispatchRef = useRef(false);
  const prevHash = useRef(null);
  const inputsContainerRef = useRef(null);
  const modalOpenRef = useRef(false);

  const timeoutRef = useRef(null);

  const includesTitle = localNote?.title
    .toLowerCase()
    .includes(searchTerm.toLowerCase().trim());

  const includesContent = localNote?.content
    .toLowerCase()
    .includes(searchTerm.toLowerCase().trim());

  const noTextMatch = searchTerm.trim() && !includesTitle && !includesContent;
  const noImageMatch = filters.image && localNote?.images?.length === 0;
  const noColorMatch = filters.color && localNote?.color !== filters.color;
  const noLabelMatch =
    filters.label && !localNote?.labels?.includes(filters.label);

  const noFilterMatch =
    currentSection.toLowerCase() === "search" &&
    (noImageMatch || noTextMatch || noColorMatch || noLabelMatch);

  const dynamicLabelNoMatch =
    currentSection.toLowerCase() === "dynamiclabel" &&
    !localNote?.labels?.includes(labelObj?.uuid);

  const isArchivePinned =
    currentSection.toLowerCase() === "archive" && localIsPinned;

  const centerModal = () => {
    if (!modalRef.current || !initialStyle.element) return;
    requestAnimationFrame(() => {
      setTimeout(() => {
        const modal = modalRef.current;
        const rect = initialStyle.element.getBoundingClientRect();
        const modalWidth = modal.offsetWidth;
        const modalHeight = modal.offsetHeight;

        const centerX = (window.innerWidth - modalWidth) / 2;
        const centerY = (window.innerHeight - modalHeight) / 3;

        const translateX = centerX - rect.left;
        const translateY = centerY - rect.top;

        // Animate transform only (no left/top changes now)
        modal.style.transform = `translate(${translateX}px, ${translateY}px) scale(1, 1)`;
      }, 10);
    });
  };

  const positionModal = () => {
    if (!modalRef.current) return;
    const modal = modalRef.current;
    if (initialStyle.element) {
      const rect = initialStyle.element.getBoundingClientRect();

      modal.style.left = `${rect.left}px`;
      modal.style.top = `${rect.top}px`;
      modal.style.transformOrigin = "top left";

      const scaleX = rect.width / modal.offsetWidth;
      const scaleY = rect.height / modal.offsetHeight;

      // Set starting scale + no translation (start at note)
      modal.style.transform = `translate(0px, 0px) scale(${scaleX}, ${scaleY})`;
    } else {
      modal.style.right = `10%`;
      modal.style.top = `30%`;
    }
  };

  const center = () => {
    modalRef.current.style.transform = "none";
    const modalWidth = modalRef.current.offsetWidth;
    const modalHeight = modalRef.current.offsetHeight;
    const centerLeft = (window.innerWidth - modalWidth) / 2;
    const centerTop = (window.innerHeight - modalHeight) / 3;

    modalRef.current.style.left = `${centerLeft}px`;
    modalRef.current.style.top = `${centerTop}px`;
  };

  const reverseModalToNote = () => {
    if (!modalRef.current || !initialStyle.element) return;

    const modal = modalRef.current;
    const rect = initialStyle.element.getBoundingClientRect();

    const modalWidth = modal.offsetWidth;
    const modalHeight = modal.offsetHeight;

    const centerLeft = parseFloat(modal.style.left);
    const centerTop = parseFloat(modal.style.top);

    const translateX = rect.left - centerLeft;
    const translateY = rect.top - centerTop;

    const scaleX = rect.width / modalWidth;
    const scaleY = rect.height / modalHeight;

    modal.style.transformOrigin = "top left";

    requestAnimationFrame(() => {
      modal.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
    });
  };

  const reset = () => {
    setLocalNote(null);
    setLocalIsPinned(null);
    setRedoStack([]);
    setUndoStack([]);
  };

  const updateNote = () => {
    const { ref: _, ...cleanLocalNote } = localNote;
    const { ref: __, ...cleanNote } = note;

    if (JSON.stringify(cleanLocalNote) !== JSON.stringify(cleanNote)) {
      dispatchNotes({ type: "SET_NOTE", note: localNote });
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "SET_NOTE",
        note: localNote,
      });
    }
  };

  const closeModal = () => {
    const overlay = document.getElementById("n-overlay");
    modalRef.current.removeAttribute("style");
    overlay.removeAttribute("style");

    if (archiveRef.current) {
      setTimeout(() => {
        handleArchive();
      }, 20);
    } else if (trashRef.current) {
      setTimeout(() => {
        handleTrash();
      }, 20);
    } else if (localIsPinned !== note?.isPinned) {
      setTimeout(() => {
        dispatchNotes({
          type: "PIN_NOTE",
          note: note,
        });
        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "PIN_NOTE",
          note: note,
        });
      }, 20);
    }

    if ((!archiveRef.current || !trashRef.current) && initialStyle.element) {
      initialStyle.element.style.opacity = "1";
    }

    if (noFilterMatch || dynamicLabelNoMatch || isArchivePinned) {
      setVisibleItems((prev) => {
        const updated = new Set(prev);
        updated.delete(localNote?.uuid);
        return updated;
      });
    }

    requestAnimationFrame(() => {
      skipHashChangeRef.current = false;
      archiveRef.current = false;
      trashRef.current = false;
      setInitialStyle(null);
      reset();
    });
  };

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
    if (!modalRef.current || !initialStyle) return;

    const overlay = document.getElementById("n-overlay");

    if (isOpen) {
      window.location.hash = `NOTE/${localNote?.uuid}`;
      // history.pushState(null, null, `#NOTE/${note?.uuid}`);
      // window.dispatchEvent(new HashChangeEvent("hashchange"));

      if (currentSection === "DynamicLabel") {
        delayLabelDispatchRef.current = true;
      }

      Object.entries(filters).forEach((filter) => {
        const title = filter[0];
        const content = filter[1];

        if (content) {
          if (title === "label") {
            const matchingLabel = note.labels.find(
              (labelUUID) => labelUUID === content
            );
            if (matchingLabel === content) {
              delayLabelDispatchRef.current = true;
            }
          } else if (title === "image") {
            delayImageDispatchRef.current = content;
          }
        }
      });

      setLocalIsPinned(note?.isPinned);
      ignoreKeysRef.current = true;
      archiveRef.current = false;
      trashRef.current = false;

      if (contentRef?.current) {
        contentRef.current.textContent = note?.content;
      }
      if (titleRef?.current) {
        titleRef.current.innerText = note?.title;
      }

      modalRef.current.style.display = "flex";

      positionModal();

      overlay.style.display = "block";
      overlay.offsetHeight;
      overlay.style.opacity = "1";

      modalRef.current.offsetHeight;
      inputsContainerRef.current.style.opacity = "1";

      modalRef.current.style.transition =
        "all 0.22s cubic-bezier(0.35, 0.9, 0.25, 1), opacity 0.13s, background-color 0s";

      timeoutRef.current = setTimeout(() => {
        modalRef.current.style.transition =
          "top 0s, opacity 0.13s, background-color 0.25s ease-in-out, height 0.19s ease-in";
        modalOpenRef.current = true;
        center();

        setTimeout(() => {
          requestAnimationFrame(() => {
            modalRef.current.style.transition =
              "top 0.22s ease, opacity 0.13s, background-color 0.25s ease-in-out, height 0.19s ease-in";
          });
        }, 30);
      }, 220);

      if (initialStyle.element) {
        // console.log("center modal");
        centerModal();
      } else {
        center();
      }
    } else {
      clearTimeout(timeoutRef.current);
      skipHashChangeRef.current = true;
      ignoreKeysRef.current = false;
      skipSetLabelObjRef.current = true;
      if (!prevHash.current) {
        // history.pushState(null, null, `#${currentSection.toLowerCase()}`);
        window.location.hash = `${currentSection.toLowerCase()}`;
      } else {
        window.location.hash = `${prevHash.current}`;
      }

      // window.location.hash = `${prevHash.current}`;

      // window.dispatchEvent(new HashChangeEvent("hashchange"));

      rootContainerRef?.current?.classList?.remove("modal-open");

      modalRef.current.style.transition =
        "all 0.22s cubic-bezier(0.35, 0.9, 0.25, 1), opacity 0.5s";
      modalRef.current.offsetHeight;
      overlay.style.opacity = "0";
      inputsContainerRef.current.style.opacity = "0.15";
      modalOpenRef.current = false;
      if (initialStyle.element) {
        if (noFilterMatch || dynamicLabelNoMatch) {
          setTimeout(() => {
            updateNote();
          }, 220);
        } else {
          updateNote();
        }

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            reverseModalToNote();
          });
        });
      }

      if (initialStyle.element) {
        setTimeout(() => {
          delayLabelDispatchRef.current = false;
          delayImageDispatchRef.current = false;
          closeModal();
        }, 220);
      } else {
        modalRef.current.style.transition =
          "opacity 0.09s, 0.22s cubic-bezier(0.35, 0.9, 0.25, 1)";
        modalRef.current.style.opacity = 0;
        setTimeout(() => {
          delayLabelDispatchRef.current = false;
          delayImageDispatchRef.current = false;
          closeModal();
        }, 90);
      }
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
    setIsMounted(true);
  }, []);

  const handleArchive = async () => {
    const passedNote =
      localIsPinned && localNote?.isArchived
        ? { ...note, isArchived: !note.isArchived }
        : note;
    const undoArchive = async () => {
      if (localIsPinned && localNote?.isArchived) {
        setFadingNotes((prev) => new Set(prev).add(localNote?.uuid));
      }
      const initialIndex = initialStyle.index;
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "UNDO_ARCHIVE",
        note: passedNote,
        initialIndex: initialIndex,
      });
      setTimeout(
        () => {
          dispatchNotes({
            type: "UNDO_ARCHIVE",
            note: passedNote,
            initialIndex: initialIndex,
          });
          setFadingNotes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(localNote?.uuid);
            return newSet;
          });
        },
        localIsPinned && localNote?.isArchived ? 250 : 0
      );

      handleServerCall(
        [
          () =>
            undoAction({
              type: "UNDO_ARCHIVE",
              noteUUID: passedNote.uuid,
              value: passedNote.isArchived,
              pin: passedNote.isPinned,
              initialIndex: initialIndex,
              endIndex: 0,
              clientID: clientID,
            }),
        ],
        openSnackRef.current
      );
    };

    const first = initialStyle.index === 0;

    const redo = async (fadeNote) => {
      const fade =
        fadeNote &&
        ((localNote?.isArchived && !localIsPinned) || !localNote?.isArchived);
      if (fade) {
        setFadingNotes((prev) => new Set(prev).add(localNote?.uuid));
      }

      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "ARCHIVE_NOTE",
        note: passedNote,
      });

      setTimeout(
        () => {
          dispatchNotes({
            type: "ARCHIVE_NOTE",
            note: passedNote,
          });

          setFadingNotes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(localNote?.uuid);
            return newSet;
          });
        },
        fade ? 250 : 0
      );

      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "isArchived",
              value: !passedNote.isArchived,
              noteUUIDs: [note.uuid],
              first: first,
              clientID: clientID,
            }),
        ],
        openSnackRef.current
      );
    };

    redo(false);

    archiveRef.current = false;
    openSnackRef.current({
      snackMessage: `${
        passedNote.isArchived
          ? "Note unarchived"
          : localIsPinned
            ? "Note unpinned and archived"
            : "Note Archived"
      }`,
      snackOnUndo: undoArchive,
      snackRedo: () => redo(true),
    });
  };

  const handleTrash = () => {
    localDbReducer({
      notes: notesStateRef.current.notes,
      order: notesStateRef.current.order,
      userID: userID,
      type: "TRASH_NOTE",
      note: note,
    });
    dispatchNotes({
      type: "TRASH_NOTE",
      note: note,
    });

    const undoTrash = async () => {
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "UNDO_TRASH",
        note: note,
        initialIndex: initialStyle?.index,
      });
      dispatchNotes({
        type: "UNDO_TRASH",
        note: note,
        initialIndex: initialStyle?.index,
      });
    };

    const onClose = async () => {
      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "isTrash",
              value: true,
              noteUUIDs: [note.uuid],
              clientID: clientID,
            }),
        ],
        openSnackRef.current
      );
    };

    if (!localNote?.isTrash) {
      openSnackRef.current({
        snackMessage: `${
          localIsPinned ? "Note unpinned and trashed" : "Note trashed"
        }`,
        snackOnClose: onClose,
        snackOnUndo: undoTrash,
        unloadWarn: true,
      });
    }
    trashRef.current = false;
  };

  useEffect(() => {
    if (!isOpen) return;

    const onResize = () => {
      if (!modalOpenRef.current) return;
      center();
    };

    window.addEventListener("resize", onResize);

    onResize();

    return () => window.removeEventListener("resize", onResize);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const observer = new ResizeObserver(() => {
      if (!modalOpenRef.current || skipCenterRef?.current) return;
      center();
    });
    if (modalRef.current) observer.observe(modalRef.current);

    return () => observer.disconnect();
  }, [isOpen]);

  const noteEditorRef = useRef(null);
  const collabRef = useRef(null);
  const skipCenterRef = useRef(false);

  const collabTimeoutRef = useRef(null);

  const openCollab = () => {
    const modal = modalRef?.current;
    const collabBox = collabRef?.current;
    const editorBox = noteEditorRef?.current;
    if (!editorBox || !collabBox || !modal) return;
    clearTimeout(collabTimeoutRef.current);
    skipCenterRef.current = true;
    collabBox.style.display = "flex";
    const collabHeight = collabBox.offsetHeight;
    const modalHeight = modal.offsetHeight;
    modal.style.height = modalHeight + "px";
    requestAnimationFrame(() => {
      modal.style.height = collabHeight + "px";
      modal.style.backgroundColor = "#ffffff";
      editorBox.style.opacity = "0";
    });
    collabTimeoutRef.current = setTimeout(() => {
      collabBox.style.opacity = "1";
      collabBox.style.position = "relative";
      modal.style.removeProperty("height");
      editorBox.style.display = "none";
      setTimeout(() => {
        if (skipCenterRef?.current) {
          skipCenterRef.current = false;
        }
      }, 40);
      // center();
    }, 240);
  };

  const closeCollab = () => {
    const modal = modalRef?.current;
    const collabBox = collabRef?.current;
    const editorBox = noteEditorRef?.current;
    if (!editorBox || !collabBox || !modal) return;
    clearTimeout(collabTimeoutRef.current);

    skipCenterRef.current = true;
    editorBox.style.display = "flex";
    editorBox.style.position = "absolute";
    modal.style.removeProperty("background-color");
    const modalHeight = modal.offsetHeight;
    const editorHeight = editorBox.offsetHeight;
    modal.style.height = modalHeight + "px";
    requestAnimationFrame(() => {
      modal.style.height = editorHeight + "px";
      collabBox.style.opacity = "0";
    });
    collabTimeoutRef.current = setTimeout(() => {
      modal.style.removeProperty("height");
      editorBox.style.position = "relative";
      editorBox.removeAttribute("style");
      collabBox.removeAttribute("style");
      
      if (skipCenterRef?.current) {
        skipCenterRef.current = false;
      }
      center();
    }, 240);
  };

  if (!isMounted) return;

  return createPortal(
    <>
      <div
        ref={modalRef}
        className={[
          "note-modal-wrapper",
          localNote?.color,
          isOpen && "modal-shadow",
          localNote?.color === "Default"
            ? "default-border"
            : "transparent-border",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <NoteEditor
          noteEditorRef={noteEditorRef}
          note={note}
          localNote={localNote}
          setLocalNote={setLocalNote}
          localIsPinned={localIsPinned}
          setLocalIsPinned={setLocalIsPinned}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          setModalStyle={setModalStyle}
          undoStack={undoStack}
          setUndoStack={setUndoStack}
          redoStack={redoStack}
          setRedoStack={setRedoStack}
          modalRef={modalRef}
          modalOpenRef={modalOpenRef}
          inputsContainerRef={inputsContainerRef}
          titleRef={titleRef}
          contentRef={contentRef}
          labelsRef={labelsRef}
          archiveRef={archiveRef}
          trashRef={trashRef}
          delayLabelDispatchRef={delayLabelDispatchRef}
          openSnackRef={openSnackRef}
          noteActions={noteActions}
          dispatchNotes={dispatchNotes}
          notesStateRef={notesStateRef}
          initialStyle={initialStyle}
          setInitialStyle={setInitialStyle}
          openCollab={openCollab}
        />
        <CollabLayout
          closeCollab={closeCollab}
          collabRef={collabRef}
          setInitialStyle={setInitialStyle}
        />
      </div>
    </>,
    document.getElementById("modal-portal")
  );
};

export default memo(NoteModal);
