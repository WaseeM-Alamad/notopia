import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  NoteUpdateAction,
  removeSelfAction,
  undoAction,
  updateCollabsAction,
} from "@/utils/actions";
import { useAppContext } from "@/context/AppContext";
import { useSearch } from "@/context/SearchContext";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";
import NoteEditor from "./NoteEditor";
import CollabLayout from "./CollabLayout";
import { useGlobalContext } from "@/context/GlobalContext";
import { debounce, throttle } from "lodash";

const NoteModal = ({
  localNote,
  setLocalNote,
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
    setDialogInfoRef,
    notesStateRef,
  } = useAppContext();
  const { skipHashChangeRef, searchTerm, filters } = useSearch();
  const { lockScroll } = useGlobalContext();
  const [isMounted, setIsMounted] = useState(false);
  const [localIsPinned, setLocalIsPinned] = useState(null);
  const note = initialStyle?.initialNote;
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isCollabOpen, setIsCollabOpen] = useState(false);

  const noteEditorRef = useRef(null);
  const collabRef = useRef(null);
  const skipCenterRef = useRef(false);

  const collabTimeoutRef = useRef(null);
  const skipUpdateDbRef = useRef(true);

  const userID = user?.id;
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const modalRef = useRef(null);
  const archiveRef = useRef(false);
  const trashRef = useRef(false);
  const removeSelfRef = useRef(false);
  const prevHash = useRef(null);
  const modalOpenRef = useRef(false);
  const isFirstRenderRef = useRef(true);

  const timeoutRef = useRef(null);

  const includesTitle = localNote?.title
    ?.toLowerCase()
    ?.includes(searchTerm.toLowerCase().trim());

  const includesContent = localNote?.content
    ?.toLowerCase()
    ?.includes(searchTerm.toLowerCase().trim());

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

  const positionModal = () => {
    if (!modalRef.current) return;
    const modal = modalRef.current;
    if (initialStyle?.initialNote?.ref?.current && initialStyle?.element) {
      const rect = initialStyle.element.getBoundingClientRect();

      modal.style.left = `${rect.left}px`;
      modal.style.top = `${rect.top}px`;
      modal.style.transformOrigin = "top left";

      const scaleX = rect.width / modal.offsetWidth;
      const scaleY = rect.height / modal.offsetHeight;

      modal.style.transform = `translate(0px, 0px) scale(${scaleX}, ${scaleY})`;
    } else {
      if (modal) {
        const modalHeight = modal.offsetHeight;
        modal.style.marginTop = modalHeight / 4 + "px";
        requestAnimationFrame(() => {
          center();

          requestAnimationFrame(() => modal.style.removeProperty("margin-top"));
        });
      }
    }
  };

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

        modal.style.transform = `translate(${translateX}px, ${translateY}px) scale(1, 1)`;
      }, 10);
    });
  };

  const center = () => {
    const modal = modalRef.current;
    modal.style.transform = "none";
    if (window.innerWidth < 605) {
      modal.style.top = "0";
      modal.style.left = "0";
      return;
    }
    const modalWidth = modal.offsetWidth;
    const modalHeight = modal.offsetHeight;
    const centerLeft = (window.innerWidth - modalWidth) / 2;
    const centerTop = (window.innerHeight - modalHeight) / 3;

    modal.style.left = `${centerLeft}px`;
    modal.style.top = `${centerTop}px`;
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

  const resetCollab = () => {
    setIsCollabOpen(false);
    const editorBox = noteEditorRef?.current;
    editorBox.removeAttribute("style");
  };

  const reset = () => {
    resetCollab();
    setLocalNote(null);
    setLocalIsPinned(null);
    setRedoStack([]);
    setUndoStack([]);
  };

  const updateLocalDbNote = useCallback(
    debounce((newNote, pinned) => {
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "SET_NOTE",
        note: { ...newNote, isPinned: pinned },
      });
    }, 200),
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (skipUpdateDbRef.current) {
      skipUpdateDbRef.current = false;
      return;
    }
    updateLocalDbNote(localNote, localIsPinned);
  }, [localNote, localIsPinned]);

  const updateNote = () => {
    const { ref: _, ...cleanLocalNote } = localNote;
    const { ref: __, ...cleanNote } = note;

    if (JSON.stringify(cleanLocalNote) !== JSON.stringify(cleanNote)) {
      dispatchNotes({ type: "SET_NOTE", note: localNote });
    }
  };

  const closeModal = () => {
    const overlay = document.getElementById("n-overlay");
    modalRef.current.removeAttribute("style");
    overlay.removeAttribute("style");

    if (removeSelfRef.current) {
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "DELETE_NOTE",
        note: note,
      });
      dispatchNotes({
        type: "DELETE_NOTE",
        note: note,
      });
    } else if (archiveRef.current) {
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

    requestAnimationFrame(() => {
      skipHashChangeRef.current = false;
      archiveRef.current = false;
      trashRef.current = false;
      removeSelfRef.current = false;
      setInitialStyle(null);
      reset();
      setLocalNote(null);
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

  function updateWithCursor(ref, newText) {
    if (!ref?.current) return;

    const el = ref.current;
    const selection = window.getSelection();
    const isFocused = document.activeElement === el;

    let startOffset = null;
    let endOffset = null;

    if (isFocused && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      startOffset = range.startOffset;
      endOffset = range.endOffset;
    }

    if (el.textContent !== newText) {
      el.textContent = newText || "";
    }

    if (isFocused && startOffset !== null) {
      const node = el.firstChild || el;

      const length = node.textContent?.length || 0;
      const safeStart = Math.min(startOffset, length);
      const safeEnd = Math.min(endOffset, length);

      const range = document.createRange();
      range.setStart(node, safeStart);
      range.setEnd(node, safeEnd);

      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  const onOpen = () => {
    setLocalIsPinned(note?.isPinned);
    updateWithCursor(contentRef, note?.content);
    updateWithCursor(titleRef, note?.title);
  };

  const openWithCollab = () => {
    setIsCollabOpen(true);
    requestAnimationFrame(() => {
      const modal = modalRef?.current;
      const collabBox = collabRef?.current;
      const editorBox = noteEditorRef?.current;
      if (!editorBox || !collabBox || !modal) return;
      skipCenterRef.current = true;
      editorBox.style.display = "none";
      collabBox.style.display = "flex";

      modal.style.backgroundColor = "var(--bg2)";
      editorBox.style.opacity = "0";
      collabBox.style.transition = "opacity 0.19s ease-in";
      requestAnimationFrame(() => {
        collabBox.style.opacity = 1;
        setTimeout(() => {
          collabBox.style.removeProperty("transition");
        }, 200);
      });

      collabBox.style.position = "relative";
      setTimeout(() => {
        if (skipCenterRef?.current) {
          skipCenterRef.current = false;
        }
      }, 40);
    });
  };

  useEffect(() => {
    onOpen();
  }, [initialStyle?.initialNote]);

  useEffect(() => {
    if (!modalRef.current || !initialStyle) return;

    const overlay = document.getElementById("n-overlay");

    if (isOpen) {
      window.location.hash = `NOTE/${localNote?.uuid}`;

      onOpen();

      ignoreKeysRef.current = true;
      archiveRef.current = false;
      trashRef.current = false;

      modalRef.current.style.display = "flex";

      const willOpenCollab = initialStyle?.collab;
      if (willOpenCollab) {
        requestAnimationFrame(() => {
          openWithCollab();
          requestAnimationFrame(() => requestAnimationFrame(() => center()));
        });
        setInitialStyle((prev) => ({ ...prev, collab: false }));
      }

      const editorBox = noteEditorRef.current;

      if (editorBox) {
        editorBox.style.opacity = 0;
        editorBox.style.transition = "opacity 0.19s ease-in";
      }

      if (editorBox) {
        requestAnimationFrame(() => {
          editorBox.style.opacity = 1;
          setTimeout(() => {
            editorBox.style.removeProperty("transition");
          }, 200);
        });
      }

      positionModal();

      overlay.style.display = "block";
      overlay.offsetHeight;
      overlay.style.opacity = "1";

      modalRef.current.offsetHeight;

      modalRef.current.style.transition =
        "all 0.22s cubic-bezier(0.35, 0.9, 0.25, 1), opacity 0.13s, background-color 0s";

      timeoutRef.current = setTimeout(() => {
        modalRef.current.style.transition =
          "top 0s, opacity 0.13s, background-color 0.25s ease-in-out, height 0.19s ease-in, margin 0.15s ease";
        modalOpenRef.current = true;
        center();

        setTimeout(() => {
          requestAnimationFrame(() => {
            modalRef.current.style.transition =
              "top 0.22s ease, opacity 0.13s, background-color 0.25s ease-in-out, height 0.19s ease-in, margin 0.15s ease";
          });
        }, 30);
      }, 220);

      if (initialStyle?.initialNote?.ref?.current) {
        centerModal();
      } else {
        center();
      }
    } else {
      const editorBox = noteEditorRef.current;
      editorBox && (editorBox.style.opacity = 0.3);

      const collabBox = collabRef.current;
      if (collabBox) {
        const modal = modalRef.current;
        collabBox.style.opacity = 0.2;
        if (localNote?.color) {
          modal.style.removeProperty("background-color");
        }
      }

      clearTimeout(collabTimeoutRef.current);
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
      modalOpenRef.current = false;
      if (initialStyle?.initialNote?.ref?.current) {
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
      } else {
        updateNote();
      }

      if (initialStyle?.element && initialStyle?.initialNote?.ref?.current) {
        skipUpdateDbRef.current = true;
        setTimeout(() => {
          closeModal();
        }, 220);
      } else {
        skipUpdateDbRef.current = true;
        modalRef.current.style.transition =
          "all 0.22s cubic-bezier(0.35, 0.9, 0.25, 1), opacity 0.09s, margin 0.22s cubic-bezier(0.5, 0.2, 0.3, 1)";
        modalRef.current.style.opacity = 0;
        modalRef.current.style.marginTop =
          modalRef.current.offsetHeight / 5 + "px";
        setTimeout(() => {
          closeModal();
        }, 90);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (isOpen) {
      lockScroll(isOpen);
    } else {
      setTimeout(() => {
        lockScroll(isOpen);
      }, 200);
    }
  }, [isOpen]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleArchive = async () => {
    const passedNote =
      localIsPinned && localNote?.isArchived
        ? { ...note, isArchived: !note?.isArchived }
        : note;
    const undoArchive = async () => {
      const initialIndex = initialStyle.index;
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "UNDO_ARCHIVE",
        note: passedNote,
        initialIndex: initialIndex,
      });
      dispatchNotes({
        type: "UNDO_ARCHIVE",
        note: passedNote,
        initialIndex: initialIndex,
      });

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
        openSnackRef.current,
      );
    };

    const first = initialStyle.index === 0;

    const redo = async () => {
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "ARCHIVE_NOTE",
        note: passedNote,
      });

      dispatchNotes({
        type: "ARCHIVE_NOTE",
        note: passedNote,
      });

      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "isArchived",
              value: !passedNote.isArchived,
              noteUUIDs: [note?.uuid],
              first: first,
              clientID: clientID,
            }),
        ],
        openSnackRef.current,
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
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "TRASH_NOTE",
        note: note,
      });
      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "isTrash",
              value: true,
              noteUUIDs: [note?.uuid],
              clientID: clientID,
            }),
        ],
        openSnackRef.current,
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
    if (!isOpen || isCollabOpen) return;

    const observer = new ResizeObserver(() => {
      if (!modalOpenRef.current || skipCenterRef?.current) return;
      center();
    });
    if (modalRef.current) observer.observe(modalRef.current);

    return () => observer.disconnect();
  }, [isOpen, isCollabOpen]);

  const openCollab = () => {
    setIsCollabOpen(true);
    requestAnimationFrame(() => {
      const modal = modalRef?.current;
      const collabBox = collabRef?.current;
      const editorBox = noteEditorRef?.current;
      if (!editorBox || !collabBox || !modal) return;
      clearTimeout(collabTimeoutRef.current);
      const editorScrollableDiv = editorBox.querySelector(
        ".modal-inputs-container",
      );
      const scrollableHeight = editorScrollableDiv.scrollHeight;
      const modalHeight = modal.offsetHeight;
      if (scrollableHeight < modalHeight) {
        editorScrollableDiv.style.overflow = "hidden";
      }

      editorBox.style.pointerEvents = "none";
      skipCenterRef.current = true;
      collabBox.style.display = "flex";

      const width = window.innerWidth;
      if (width < 605) {
        collabBox.style.transform = "translateY(70%)";
      }
      modal.style.height = modalHeight + "px";

      requestAnimationFrame(() => {
        collabBox.style.transition =
          "opacity .12s ease-in-out, transform 0.45s cubic-bezier(0.5, 0.2, 0.3, 1)";
        if (width >= 605) {
          const collabHeight = collabBox.offsetHeight;
          modal.style.height = collabHeight + "px";
        } else {
          collabBox.style.removeProperty("transform");
          // collabBox.style.padding = "0";
        }
        modal.style.backgroundColor = "var(--bg2)";
        editorBox.style.opacity = "0";
      });
      if (width < 605) {
        setTimeout(() => {
          collabBox.style.opacity = "1";
        }, 180);
      }
      collabTimeoutRef.current = setTimeout(() => {
        if (width >= 605) {
          collabBox.style.opacity = "1";
        }
        collabBox.style.position = "relative";
        modal.style.removeProperty("height");
        editorBox.style.display = "none";
        setTimeout(() => {
          if (skipCenterRef?.current) {
            skipCenterRef.current = false;
          }
        }, 40);
      }, 240);
    });
  };

  const removeSelfCollab = () => {
    setIsOpen(false);
    handleServerCall(
      [() => removeSelfAction(note?.uuid, clientID)],
      openSnackRef.current,
    );
  };

  const closeCollab = () => {
    requestAnimationFrame(() => {
      const width = window.innerWidth;
      const modal = modalRef?.current;
      const collabBox = collabRef?.current;
      const editorBox = noteEditorRef?.current;
      if (!editorBox || !collabBox || !modal) return;

      clearTimeout(collabTimeoutRef.current);
      skipCenterRef.current = true;

      if (width < 650) {
        collabBox.style.transform = "translateY(70%)";
      }
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
        setIsCollabOpen(false);
        if (skipCenterRef?.current) {
          skipCenterRef.current = false;
        }
        center();
      }, 240);
    });
  };

  const saveCollabFun = async (collabOpsMap, collaborators) => {
    if (collabOpsMap.size === 0) {
      closeCollab();
      return;
    }
    if (removeSelfRef.current) {
      setDialogInfoRef.current({
        func: removeSelfCollab,
        title: "Remove note",
        message: "This note will no longer be shared with you.",
        btnMsg: "Remove",
      });
      return;
    }

    if (note?.creator?._id !== userID) {
      openSnackRef.current({
        snackMessage: "Only creator can manage collaborators",
        showUndo: false,
      });
      closeCollab();
      return;
    }

    handleServerCall(
      [
        () =>
          updateCollabsAction({
            collabOpsMap,
            noteUUID: note?.uuid,
            creatorID: note?.creator?._id,
            clientID,
          }),
      ],
      openSnackRef.current,
    );

    const noEmailCollabs = collaborators.map((collab) => {
      if (collab?.data?.email) {
        return {
          ...collab,
          data: {
            displayName: collab?.data?.displayName,
            username: collab?.data?.username,
            image: collab?.data?.image,
          },
        };
      }
      return collab;
    });

    setLocalNote((prev) => ({ ...prev, collaborators: noEmailCollabs }));
    requestAnimationFrame(() => {
      closeCollab();
    });
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
        style={{
          borderColor: isCollabOpen
            ? "var(--border) !important"
            : "transparent",
        }}
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
          titleRef={titleRef}
          contentRef={contentRef}
          labelsRef={labelsRef}
          archiveRef={archiveRef}
          trashRef={trashRef}
          openSnackRef={openSnackRef}
          noteActions={noteActions}
          dispatchNotes={dispatchNotes}
          notesStateRef={notesStateRef}
          initialStyle={initialStyle}
          setInitialStyle={setInitialStyle}
          openCollab={openCollab}
        />

        {isCollabOpen && (
          <CollabLayout
            note={localNote}
            closeCollab={closeCollab}
            collabRef={collabRef}
            saveCollabFun={saveCollabFun}
            removeSelfRef={removeSelfRef}
            setIsOpen={setIsOpen}
          />
        )}
      </div>
    </>,
    document.getElementById("modal-portal"),
  );
};

export default memo(NoteModal);
