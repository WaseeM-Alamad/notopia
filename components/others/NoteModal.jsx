import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../Tools/Button";
import PinIcon from "../icons/PinIcon";
import { getNoteFormattedDate } from "@/utils/noteDateFormatter";
import { debounce, filter } from "lodash";
import {
  NoteImageDeleteAction,
  NoteTextUpdateAction,
  NoteUpdateAction,
  removeLabelAction,
  undoAction,
} from "@/utils/actions";
import NoteModalTools from "./NoteModalTools";
import NoteImagesLayout from "../Tools/NoteImagesLayout";
import { useSession } from "next-auth/react";
import { useAppContext } from "@/context/AppContext";
import { v4 as uuid } from "uuid";
import ListItemsLayout from "./ListitemsLayout";
import { useSearch } from "@/context/SearchContext";
import { AnimatePresence } from "framer-motion";
import ImageDropZone from "../Tools/ImageDropZone";
import TextLabelMenu from "./TextLabelMenu";

const NoteModal = ({
  localNote,
  setLocalNote,
  filters,
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
    showTooltip,
    hideTooltip,
    closeToolTip,
    openSnackRef,
    setTooltipRef,
  } = useAppContext();
  const { skipHashChangeRef, searchTerm } = useSearch();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [localIsPinned, setLocalIsPinned] = useState(null);
  const note = initialStyle?.initialNote;
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [labelAnchor, setLabelAnchor] = useState(null);
  const [labelSearch, setLabelSearch] = useState("");
  const formattedEditedDate = isOpen
    ? getNoteFormattedDate(localNote?.textUpdatedAt)
    : null;

  const formattedCreatedAtDate = isOpen
    ? getNoteFormattedDate(note?.createdAt)
    : null;

  const userID = user?.id;
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const modalRef = useRef(null);
  const archiveRef = useRef(false);
  const trashRef = useRef(false);
  const delayLabelDispatchRef = useRef(false);
  const delayImageDispatchRef = useRef(false);
  const prevHash = useRef(null);
  const ignoreTopRef = useRef(false);
  const inputsContainerRef = useRef(null);
  const modalOpenRef = useRef(false);
  const inputRef = useRef(null);
  const dragCounter = useRef(0);

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
          "top 0s, opacity 0.13s, background-color 0.25s ease-in-out";
        modalOpenRef.current = true;
        center();

        setTimeout(() => {
          requestAnimationFrame(() => {
            modalRef.current.style.transition =
              "top 0.13s, opacity 0.13s, background-color 0.25s ease-in-out";
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

      rootContainerRef.current.classList.remove("modal-open");

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
        modalRef.current.style.transition = "opacity 0.09s";
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

      window.dispatchEvent(new Event("loadingStart"));
      await undoAction({
        type: "UNDO_ARCHIVE",
        noteUUID: passedNote.uuid,
        value: passedNote.isArchived,
        pin: passedNote.isPinned,
        initialIndex: initialIndex,
        endIndex: 0,
      });
      window.dispatchEvent(new Event("loadingEnd"));
    };

    const first = initialStyle.index === 0;

    const redo = async (fadeNote) => {
      const fade =
        fadeNote &&
        ((localNote?.isArchived && !localIsPinned) || !localNote?.isArchived);
      if (fade) {
        setFadingNotes((prev) => new Set(prev).add(localNote?.uuid));
      }

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

      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction({
        type: "isArchived",
        value: !passedNote.isArchived,
        noteUUIDs: [note.uuid],
        first: first,
      });
      window.dispatchEvent(new Event("loadingEnd"));
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

  const handlePinClick = async () => {
    if (localNote?.isTrash) return;
    setLocalIsPinned((prev) => !prev);
    window.dispatchEvent(new Event("loadingStart"));
    try {
      if (!localNote?.isArchived) {
        await NoteUpdateAction({
          type: "isPinned",
          value: !localIsPinned,
          noteUUIDs: [note.uuid],
        });
      } else {
        const redo = async () => {
          if (!localIsPinned) {
            await NoteUpdateAction({
              type: "pinArchived",
              value: true,
              noteUUIDs: [note.uuid],
            });
          } else {
            await undoAction({
              type: "UNDO_PIN_ARCHIVED",
              noteUUID: note.uuid,
              initialIndex: initialStyle.index,
              endIndex: 0,
            });
          }
        };
        redo();
        const undo = async () => {
          setLocalIsPinned(false);
          dispatchNotes({
            type: "UNDO_PIN_ARCHIVED",
            note: note,
            initialIndex: initialStyle.index,
          });

          window.dispatchEvent(new Event("loadingStart"));
          await undoAction({
            type: "UNDO_PIN_ARCHIVED",
            noteUUID: note.uuid,
            initialIndex: initialStyle.index,
            endIndex: 0,
          });
          window.dispatchEvent(new Event("loadingEnd"));
        };

        openSnackRef.current({
          snackMessage: "Note unarchived and pinned",
          snackOnUndo: undo,
          snackRedo: redo,
        });
      }
    } finally {
      window.dispatchEvent(new Event("loadingEnd"));
    }
  };

  const noteImageDelete = useCallback(
    async (imageUUID, imageURL) => {
      const imageObject = { url: imageURL, uuid: imageUUID };
      let imageIndex;

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

      const undo = async () => {
        setLocalNote((prev) => {
          const updatedImages = [...prev.images];
          updatedImages.splice(imageIndex, 0, imageObject);
          return { ...prev, images: updatedImages };
        });
      };

      const onClose = async () => {
        const filePath = `${userID}/${note.uuid}/${imageUUID}`;
        window.dispatchEvent(new Event("loadingStart"));
        await NoteImageDeleteAction(filePath, note.uuid, imageUUID);
        window.dispatchEvent(new Event("loadingEnd"));
      };

      openSnackRef.current({
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

  const titleDebouncedSetUndo = debounce((data) => {
    setUndoStack((prev) => [...prev, data]);
  }, 120);

  const contentDebouncedSetUndo = debounce((data) => {
    setUndoStack((prev) => [...prev, data]);
  }, 100);

  const handleUndo = async () => {
    if (undoStack.length === 1) {
      setRedoStack((prev) => [...prev, undoStack[0]]);
      setUndoStack([]);
      titleRef.current.innerText = note?.title;
      contentRef.current.innerText = note?.content;
      setLocalNote((prev) => ({
        ...prev,
        title: note?.title,
        content: note?.content,
      }));
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
      setLocalNote((prev) => ({
        ...prev,
        title: undoItem.title,
        content: undoItem.content,
      }));
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
    setLocalNote((prev) => ({
      ...prev,
      title: redoItem.title,
      content: redoItem.content,
    }));
    window.dispatchEvent(new Event("loadingStart"));
    await NoteTextUpdateAction(
      { title: redoItem.title, content: redoItem.content },
      note?.uuid
    );
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const getCaretCharacterOffsetWithin = (element) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return 0;

    const range = selection.getRangeAt(0);
    const preRange = range.cloneRange();

    preRange.selectNodeContents(element);
    preRange.setEnd(range.endContainer, range.endOffset);

    return preRange.toString().length;
  };

  function getVirtualAnchorAtHash(container, hashIndex) {
    const textNode = container.firstChild;
    if (!textNode || textNode.nodeType !== 3) return null;

    const range = document.createRange();
    range.setStart(textNode, hashIndex);
    range.setEnd(textNode, hashIndex);

    const rect = range.getClientRects()[0];
    if (!rect) return null;

    return {
      getBoundingClientRect: () => new DOMRect(rect.left, rect.top, 0, 0),
      contextElement: container,
    };
  }

  const handleLabelMenu = (container, text) => {
    const caretPos = getCaretCharacterOffsetWithin(container);

    const textBeforeCaret = text.slice(0, caretPos);
    const hashIndex = textBeforeCaret.lastIndexOf("#");

    if (hashIndex === -1) {
      setLabelAnchor(false);
      setLabelSearch("");
      return;
    }

    const afterHash = text.slice(hashIndex);
    const match = afterHash.match(/#(\w*)$/);
    const hashEnd = hashIndex + (match ? match[0].length : 1);

    if (caretPos >= hashIndex && caretPos <= hashEnd) {
      setLabelSearch(match ? match[1] : "");
      const virtualAnchor = getVirtualAnchorAtHash(container, hashIndex);
      setLabelAnchor(virtualAnchor);
    } else {
      setLabelAnchor(false);
      setLabelSearch("");
    }
  };

  const handleTitleInput = useCallback(
    (e) => {
      if (localNote?.isTrash) return;
      const text = e.target.innerText;
      const t = text === "\n" ? "" : text;
      titleDebouncedSetUndo({ title: t, content: localNote?.content });

      const container = e.currentTarget;

      handleLabelMenu(container, t);

      setLocalNote((prev) => ({
        ...prev,
        title: t,
        textUpdatedAt: new Date(),
      }));

      updateTextDebounced({ title: t, content: localNote?.content });

      if (text === "\n") {
        e.target.innerText = "";
      }
    },
    [note?.content, note?.title, localNote?.isTrash, undoStack]
  );

  const handleContentInput = useCallback(
    (e) => {
      if (localNote?.isTrash) return;
      const text = e.target.innerText;
      const t = text === "\n" ? "" : text;

      contentDebouncedSetUndo({ title: localNote?.title, content: t });
      setLocalNote((prev) => ({
        ...prev,
        content: t,
        textUpdatedAt: new Date(),
      }));

      updateTextDebounced({ title: localNote?.title, content: t });

      if (text === "\n") {
        e.target.innerText = "";
      }
    },
    [note?.content, note?.title, localNote?.isTrash, undoStack]
  );

  const removeLabel = async (labelUUID) => {
    const newLabels = localNote?.labels.filter(
      (noteLabelUUID) => noteLabelUUID !== labelUUID
    );
    setLocalNote((prev) => ({ ...prev, labels: newLabels }));
    window.dispatchEvent(new Event("loadingStart"));
    await removeLabelAction({
      noteUUID: note.uuid,
      labelUUID: labelUUID,
    });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const handleLabelClick = (e, label) => {
    e.stopPropagation();
    const encodedLabel = encodeURIComponent(label);
    window.location.hash = `label/${encodedLabel.toLowerCase()}`;
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
      if (!modalOpenRef.current) return;
      center();
    });
    if (modalRef.current) observer.observe(modalRef.current);

    return () => observer.disconnect();
  }, [isOpen]);

  const inputsContainerClick = () => {
    if (!localNote?.isTrash) return;

    const undo = async () => {
      setLocalNote((prev) => ({ ...prev, isTrash: true }));
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction({
        type: "isTrash",
        value: true,
        noteUUIDs: [localNote?.uuid],
      });
      window.dispatchEvent(new Event("loadingEnd"));
    };

    const restore = async () => {
      setLocalNote((prev) => ({ ...prev, isTrash: false }));
      window.dispatchEvent(new Event("loadingStart"));
      openSnackRef.current({
        snackMessage: "Note restored",
        snackOnUndo: undo,
        snackRedo: restore,
      });
      await NoteUpdateAction({
        type: "isTrash",
        value: false,
        noteUUIDs: [localNote?.uuid],
      });
      window.dispatchEvent(new Event("loadingEnd"));
    };

    openSnackRef.current({
      snackMessage: "Can't edit in Trash",
      snackOnUndo: restore,
      noActionUndone: true,
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleNoteMouseLeave = (e) => {
    setIsDragOver(false);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
  };

  const handleOnDrop = (e) => {
    e.preventDefault();
    if (!inputRef.current) return;
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);

    if (files.length > 0) {
      const dt = new DataTransfer();
      files.forEach((file) => dt.items.add(file));
      inputRef.current.files = dt.files;
      const event = new Event("change", { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }
  };

  if (!isMounted) return;

  return createPortal(
    <>
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleOnDrop}
        onMouseLeave={handleNoteMouseLeave}
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
      >
        <div
          onClick={inputsContainerClick}
          ref={inputsContainerRef}
          style={{
            overflowY: !isOpen && "hidden",
            opacity: "0.15",
          }}
          className={`modal-inputs-container ${
            "n-bg-" + localNote?.background
          }`}
        >
          {localNote?.images.length === 0 && (
            <div className={isOpen ? `modal-corner` : `corner`} />
          )}
          {!localNote?.isTrash && (
            <div style={{ opacity: !isOpen && "0" }} className="modal-pin">
              <Button onClick={handlePinClick} disabled={!isOpen}>
                <PinIcon
                  isPinned={localIsPinned}
                  opacity={0.8}
                  rotation={localIsPinned ? "-45deg" : "-5deg"}
                  images={localNote?.images.length !== 0}
                />
              </Button>
            </div>
          )}
          <NoteImagesLayout
            images={localNote?.images}
            // isLoadingImages={isLoadingImages}
            isTrash={localNote?.isTrash}
            deleteSource="note"
            noteImageDelete={noteImageDelete}
            modalOpen={isOpen}
          />
          {/* {isLoading && <div className="linear-loader" />} */}
          {!isOpen &&
            localNote?.images.length === 0 &&
            !localNote?.title?.trim() &&
            !localNote?.content?.trim() &&
            (localNote?.checkboxes?.length === 0 ||
              !localNote?.showCheckboxes) && (
              <div className="empty-note" aria-label="Empty note" />
            )}
          <div
            style={{
              opacity: isOpen
                ? "1"
                : localNote?.content && !localNote?.title
                  ? "0"
                  : !localNote?.title && !localNote?.content
                    ? "0"
                    : "1",
            }}
            contentEditable={!localNote?.isTrash}
            dir="auto"
            suppressContentEditableWarning
            onInput={handleTitleInput}
            onPaste={handlePaste}
            ref={titleRef}
            className="
               modal-title-input modal-editable-title"
            role="textbox"
            tabIndex="0"
            aria-multiline="true"
            aria-label={!localNote?.isTrash ? "Title" : ""}
            spellCheck="false"
          />
          <div
            style={{
              opacity: isOpen
                ? "1"
                : !localNote?.content && localNote?.title
                  ? "0"
                  : !localNote?.title && !localNote?.content
                    ? "0"
                    : "1",
              minHeight: "30px",
              transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
            }}
            contentEditable={!localNote?.isTrash}
            dir="auto"
            suppressContentEditableWarning
            onInput={handleContentInput}
            onPaste={handlePaste}
            ref={contentRef}
            className={`${"modal-content-input"} modal-editable-content`}
            role="textbox"
            tabIndex="0"
            aria-multiline="true"
            aria-label={!localNote?.isTrash ? "Take a note..." : ""}
            spellCheck="false"
          />
          {localNote?.checkboxes && (
            <ListItemsLayout
              localNote={localNote}
              setLocalNote={setLocalNote}
              ignoreTopRef={ignoreTopRef}
              dispatchNotes={dispatchNotes}
              isOpen={isOpen}
            />
          )}

          {localNote?.labels?.length > 0 && (
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
                      onClick={(e) => handleLabelClick(e, label)}
                      key={labelUUID}
                      className={[
                        "label-wrapper",
                        !localNote?.isTrash && "label-wrapper-h",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <label className="note-label">{label}</label>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          closeToolTip();
                          removeLabel(labelUUID);
                        }}
                        onMouseEnter={(e) => showTooltip(e, "Remove label")}
                        onMouseLeave={hideTooltip}
                        className="remove-label"
                      />
                    </div>
                  );
                })}
            </div>
          )}

          <div
            style={{ opacity: !isOpen && "0" }}
            className="modal-date-section"
          >
            <div onClick={(e) => e.stopPropagation()} className="edited">
              {localNote?.isTrash
                ? "Note in Trash  •  "
                : localNote?.isArchived
                  ? "Note in Archive  •  "
                  : ""}
              <span
                onMouseEnter={(e) =>
                  showTooltip(e, "Created " + formattedCreatedAtDate)
                }
                onMouseLeave={hideTooltip}
              >
                Edited
                {" " + formattedEditedDate}
              </span>
            </div>
          </div>
        </div>
        <NoteModalTools
          modalOpenRef={modalOpenRef}
          filters={filters}
          delayLabelDispatchRef={delayLabelDispatchRef}
          archiveRef={archiveRef}
          trashRef={trashRef}
          setLocalNote={setLocalNote}
          localNote={localNote}
          note={note}
          noteActions={noteActions}
          dispatchNotes={dispatchNotes}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          setModalStyle={setModalStyle}
          undoStack={undoStack}
          redoStack={redoStack}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          inputRef={inputRef}
          inputsContainerRef={inputsContainerRef}
        />
        <AnimatePresence>{isDragOver && <ImageDropZone />}</AnimatePresence>
        <AnimatePresence>
          {labelAnchor && (
            <TextLabelMenu
              anchor={labelAnchor}
              setAnchor={setLabelAnchor}
              labelSearch={labelSearch}
              setLabelSearch={setLabelSearch}
            />
          )}
        </AnimatePresence>
      </div>
    </>,
    document.getElementById("modal-portal")
  );
};

export default memo(NoteModal);
