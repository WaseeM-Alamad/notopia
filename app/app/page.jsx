"use client";
import Modal from "@/components/others/Modal";
import Archive from "@/components/pages/Archive";
import Labels from "@/components/pages/Labels";
import Home from "@/components/pages/Home";
import Reminders from "@/components/pages/Reminders";
import Trash from "@/components/pages/Trash";
import Snackbar from "@/components/Tools/Snackbar";
import Tooltip from "@/components/Tools/Tooltip";
import {
  deleteLabelAction,
  DeleteNoteAction,
  fetchNotes,
  NoteUpdateAction,
  undoAction,
} from "@/utils/actions";
import { AnimatePresence, motion } from "framer-motion";
import React, {
  memo,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useAppContext } from "@/context/AppContext";
import TopMenu from "@/components/others/topMenu/TopMenu";
import SelectionBox from "@/components/others/SelectionBox";

const initialStates = {
  notes: new Map(),
  order: [],
};

function notesReducer(state, action) {
  switch (action.type) {
    case "SET_INITIAL_DATA":
      return {
        ...state,
        notes: action.notes,
        order: action.order,
      };

    case "ADD_NOTE":
      return {
        ...state,
        notes: new Map(state.notes).set(action.newNote.uuid, action.newNote),
        order: [action.newNote.uuid, ...state.order],
      };

    case "PIN_NOTE": {
      const newNote = {
        ...state.notes.get(action.note.uuid),
        isPinned: !action.note.isPinned,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.note.uuid
      );
      return {
        ...state,
        notes: updatedNotes,
        order: [action.note.uuid, ...updatedOrder],
      };
    }

    case "ARCHIVE_NOTE": {
      const newNote = {
        ...state.notes.get(action.note.uuid),
        isArchived: !action.note.isArchived,
        isPinned: false,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.note.uuid
      );
      return {
        ...state,
        notes: updatedNotes,
        order: [action.note.uuid, ...updatedOrder],
      };
    }
    case "UNDO_ARCHIVE": {
      const newNote = {
        ...state.notes.get(action.note.uuid),
        isArchived: action.note.isArchived,
        isPinned: action.note.isPinned,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      const updatedOrder = [...state.order];
      const [targetedNote] = updatedOrder.splice(0, 1);
      updatedOrder.splice(action.initialIndex, 0, targetedNote);

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }

    case "BATCH_ARCHIVE": {
      const sortedNotes = action.selectedNotes.sort(
        (a, b) => b.index - a.index
      );
      let sortedUUIDS = [];
      const updatedNotes = new Map(state.notes);
      const updatedOrder = [...state.order];
      sortedNotes.forEach((noteData) => {
        const newNote = {
          ...updatedNotes.get(noteData.uuid),
          isArchived: !action.isArchived,
          isPinned: false,
        };
        updatedNotes.set(noteData.uuid, newNote);
        updatedOrder.splice(noteData.index, 1);
        sortedUUIDS.push(noteData.uuid);
      });

      updatedOrder.unshift(...sortedUUIDS);

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }

    case "BATCH_PIN": {
      const sortedNotes = action.selectedNotes.sort(
        (a, b) => b.index - a.index
      );
      const updatedNotes = new Map(state.notes);
      const updatedOrder = [...state.order];
      let sortedUUIDS = [];
      sortedNotes.forEach((noteData) => {
        const newNote = {
          ...updatedNotes.get(noteData.uuid),
          isPinned: !action.isPinned,
          isArchived: false,
        };
        updatedNotes.set(noteData.uuid, newNote);
        updatedOrder.splice(noteData.index, 1);
        sortedUUIDS.push(noteData.uuid);
      });

      updatedOrder.unshift(...sortedUUIDS);

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }

    case "UNDO_BATCH_ARCHIVE": {
      const sortedNotes = action.selectedNotes.sort(
        (a, b) => a.index - b.index
      );
      const updatedNotes = new Map(state.notes);
      const updatedOrder = state.order.slice(action.length);

      sortedNotes.forEach((noteData) => {
        const newNote = {
          ...updatedNotes.get(noteData.uuid),
          isArchived: action.isArchived,
          isPinned: noteData.isPinned,
        };
        updatedNotes.set(noteData.uuid, newNote);
        updatedOrder.splice(noteData.index, 0, noteData.uuid);
      });

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }

    case "UNDO_BATCH_PIN_ARCHIVED": {
      const sortedNotes = action.selectedNotes.sort(
        (a, b) => a.index - b.index
      );
      const updatedNotes = new Map(state.notes);
      const updatedOrder = state.order.slice(action.length);

      sortedNotes.forEach((noteData) => {
        const newNote = {
          ...updatedNotes.get(noteData.uuid),
          isArchived: true,
          isPinned: false,
        };
        updatedNotes.set(noteData.uuid, newNote);
        updatedOrder.splice(noteData.index, 0, noteData.uuid);
      });

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }

    case "TRASH_NOTE": {
      const newNote = {
        ...state.notes.get(action.note.uuid),
        isTrash: !action.note.isTrash,
        isPinned: false,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.note.uuid
      );
      return {
        ...state,
        notes: updatedNotes,
        order: [action.note.uuid, ...updatedOrder],
      };
    }
    case "UNDO_TRASH": {
      const newNote = {
        ...state.notes.get(action.note.uuid),
        isTrash: action.note.isTrash,
        isPinned: action.note.isPinned,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      const updatedOrder = [...state.order];
      const [targetedNote] = updatedOrder.splice(0, 1);
      updatedOrder.splice(action.initialIndex, 0, targetedNote);

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }
    case "DELETE_NOTE": {
      const newNotes = new Map(state.notes);
      newNotes.delete(action.note.uuid);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.note.uuid
      );
      return {
        ...state,
        notes: newNotes,
        order: updatedOrder,
      };
    }
    case "PIN_ARCHIVED_NOTE": {
      const newNote = {
        ...state.notes.get(action.note.uuid),
        isPinned: true,
        isArchived: false,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.note.uuid
      );
      return {
        ...state,
        notes: updatedNotes,
        order: [action.note.uuid, ...updatedOrder],
      };
    }
    case "UNDO_PIN_ARCHIVED": {
      const newNote = {
        ...state.notes.get(action.note.uuid),
        isPinned: false,
        isArchived: true,
      };

      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);

      const updatedOrder = [...state.order];
      const [targetedNote] = updatedOrder.splice(0, 1);
      updatedOrder.splice(action.initialIndex, 0, targetedNote);

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }
    case "UPDATE_COLOR": {
      const newNote = {
        ...state.notes.get(action.note.uuid),
        color: action.newColor,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "BATCH_UPDATE_COLOR": {
      const updatedNotes = new Map(state.notes);
      action.selectedNotes.forEach((data) => {
        const newNote = { ...updatedNotes.get(data.uuid), color: action.color };
        updatedNotes.set(data.uuid, newNote);
      });

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "UPDATE_BG": {
      const newNote = {
        ...state.notes.get(action.note.uuid),
        background: action.newBG,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);

      return {
        ...state,
        notes: updatedNotes,
      };
    }
    case "BATCH_UPDATE_BG": {
      const updatedNotes = new Map(state.notes);
      action.selectedNotes.forEach((data) => {
        const newNote = {
          ...updatedNotes.get(data.uuid),
          background: action.background,
        };
        updatedNotes.set(data.uuid, newNote);
      });

      return {
        ...state,
        notes: updatedNotes,
      };
    }
    case "ADD_IMAGE": {
      const newNote = {
        ...state.notes.get(action.note.uuid),
        images: [
          ...action.note.images,
          { url: action.imageURL, uuid: action.newImageUUID },
        ],
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);

      return {
        ...state,
        notes: updatedNotes,
      };
    }
    case "UPDATE_TEXT": {
      const newNote = {
        ...state.notes.get(action.note.uuid),
        title: action.newTitle,
        content: action.newContent,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      return {
        ...state,
        notes: updatedNotes,
      };
    }
    case "UPDATE_IMAGES": {
      const newNote = {
        ...state.notes.get(action.note.uuid),
        images: action.newImages,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "UNDO_COPY": {
      const updatedNotes = new Map(state.notes);
      updatedNotes.delete(action.noteUUID);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.noteUUID
      );

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }

    case "ADD_LABEL": {
      const newNote = {
        ...state.notes.get(action.note.uuid),
        labels: [...action.note.labels, action.labelUUID],
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "REMOVE_LABEL": {
      const targetedNote = {
        ...state.notes.get(action.note.uuid),
      };

      const newNote = {
        ...targetedNote,
        labels: targetedNote.labels.filter(
          (noteLabelUUID) => noteLabelUUID !== action.labelUUID
        ),
      };

      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "REMOVE_LABEL_FROM_NOTES": {
      const updatedNotes = new Map(state.notes);
      state.order.map((noteUUID) => {
        const note = state.notes.get(noteUUID);
        note.labels = note.labels.filter(
          (noteLabelUUID) => noteLabelUUID !== action.labelUUID
        );
        updatedNotes.set(noteUUID, note);
      });
      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "UPDATE_NOTE_LABELS": {
      const newNote = {
        ...state.notes.get(action.note.uuid),
        labels: action.newLabels,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "EMPTY_TRASH": {
      const updatedNotes = new Map();
      const updatedOrder = [];

      for (const noteUUID of state.order) {
        const note = state.notes.get(noteUUID);
        if (!note.isTrash) {
          updatedNotes.set(noteUUID, note);
          updatedOrder.push(noteUUID);
        }
      }

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }

    case "DND": {
      return {
        ...state,
        order: action.updatedOrder,
      };
    }
  }
}

const page = () => {
  const { batchDecNoteCount, removeLabel } = useAppContext();
  const [current, setCurrent] = useState("Home");
  const [tooltipAnchor, setTooltipAnchor] = useState(null);
  const [notesState, dispatchNotes] = useReducer(notesReducer, initialStates);
  const [modalStyle, setModalStyle] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notesReady, setNotesReady] = useState(false);
  const [selectedNotesIDs, setSelectedNotesIDs] = useState([]);
  const [fadingNotes, setFadingNotes] = useState(new Set());
  const [snackbarState, setSnackbarState] = useState({
    snackOpen: false,
    showUndo: true,
    message: "",
  });
  const [unloadWarn, setUnloadWarn] = useState(false);
  const undoFunction = useRef(() => {});
  const onCloseFunction = useRef(() => {});
  const closeRef = useRef(null);

  const openSnackFunction = useCallback((data) => {
    const showUndo = data.showUndo ?? true;
    if (data.close) {
      setSnackbarState((prev) => ({
        ...prev,
        snackOpen: false,
      }));
      onCloseFunction.current();
    } else {
      setSnackbarState((prev) => ({
        ...prev,
        snackOpen: false,
      }));
      onCloseFunction.current();

      setTimeout(() => {
        setSnackbarState({
          message: data.snackMessage,
          showUndo: showUndo,
          snackOpen: true,
        });
        if (data.snackOnUndo !== undefined) {
          undoFunction.current = data.snackOnUndo;
        }
        if (data.snackOnClose !== undefined) {
          onCloseFunction.current = data.snackOnClose;
        }
        if (data.unloadWarn) {
          setUnloadWarn(true);
        }
      }, 80);
    }
  }, []);

  const closeSnackbar = () => {
    setSnackbarState((prev) => ({
      ...prev,
      snackOpen: false,
    }));
    onCloseFunction.current();
  };

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (unloadWarn) {
        const message =
          "Your request is still in progress. Are you sure you want to leave?";
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [unloadWarn]);

  const getNotes = async () => {
    requestAnimationFrame(async () => {
      window.dispatchEvent(new Event("loadingStart"));
      window.dispatchEvent(new Event("loadLables"));
      const fetchedNotes = await fetchNotes();
      window.dispatchEvent(new Event("loadingEnd"));

      const notesMap = new Map(
        fetchedNotes.data.map((note) => [note.uuid, note])
      );
      dispatchNotes({
        type: "SET_INITIAL_DATA",
        notes: notesMap,
        order: fetchedNotes.order,
      });
      setNotesReady(true);
    });
  };

  useEffect(() => {
    getNotes();
    window.addEventListener("refresh", getNotes);

    return () => window.removeEventListener("refresh", getNotes);
  }, []);

  const handleNoteClick = useCallback((e, note, index) => {
    if (
      e.target.closest("button") ||
      !e.currentTarget.classList.contains("grid-item")
    )
      return;
    const element = e.currentTarget;

    requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      setModalStyle({
        index: index,
        element: element,
        rect: rect,
      });

      setSelectedNote(note);
      setIsModalOpen(true);
      element.style.opacity = "0";
    });
  }, []);

  const noteActions = useCallback(async (data) => {
    if (data.type === "archive") {
      const initialIndex = data.index;

      const timeOut = setTimeout(() => {
        dispatchNotes({
          type: "ARCHIVE_NOTE",
          note: data.note,
        });
      }, 210);

      const handler = (e) => {
        if (e.propertyName === "opacity") {
          data.noteRef.current.removeEventListener("transitionend", handler);

          clearTimeout(timeOut);

          dispatchNotes({
            type: "ARCHIVE_NOTE",
            note: data.note,
          });
        }
      };

      data.noteRef.current.addEventListener("transitionend", handler);
      data.noteRef.current.offsetHeight;
      data.noteRef.current.classList.add("fade-out");

      const undoArchive = async () => {
        dispatchNotes({
          type: "UNDO_ARCHIVE",
          note: data.note,
          initialIndex: initialIndex,
        });
        window.dispatchEvent(new Event("loadingStart"));
        await undoAction({
          type: "UNDO_ARCHIVE",
          noteUUID: data.note.uuid,
          value: data.note.isArchived,
          pin: data.note.isPinned,
          initialIndex: initialIndex,
          endIndex: 0,
        });
        window.dispatchEvent(new Event("loadingEnd"));
      };
      openSnackFunction({
        snackMessage: `${
          data.note.isArchived
            ? "Note unarchived"
            : data.note.isPinned
            ? "Note unpinned and archived"
            : "Note Archived"
        }`,
        snackOnUndo: undoArchive,
      });
      const first = data.index === 0;
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction(
        "isArchived",
        !data.note.isArchived,
        [data.note.uuid],
        first
      );
      window.dispatchEvent(new Event("loadingEnd"));
    } else if (data.type === "TRASH_NOTE") {
      const timeOut = setTimeout(() => {
        dispatchNotes({
          type: "TRASH_NOTE",
          note: data.note,
        });
      }, 210);

      const handler = (e) => {
        if (e.propertyName === "opacity") {
          data.noteRef.current.removeEventListener("transitionend", handler);
          clearTimeout(timeOut);
          dispatchNotes({
            type: "TRASH_NOTE",
            note: data.note,
          });
        }
      };

      data.noteRef.current.addEventListener("transitionend", handler);
      data.noteRef.current.classList.add("fade-out");

      const initialIndex = data.index;
      const undoTrash = async () => {
        dispatchNotes({
          type: "UNDO_TRASH",
          note: data.note,
          initialIndex: initialIndex,
        });

        window.dispatchEvent(new Event("loadingStart"));
        await undoAction({
          type: "UNDO_TRASH",
          noteUUID: data.note.uuid,
          value: true,
          initialIndex: data.initialIndex,
          endIndex: 0,
        });
        window.dispatchEvent(new Event("loadingEnd"));
      };

      openSnackFunction({
        snackMessage: "Note restored",
        snackOnUndo: undoTrash,
      });

      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction("isTrash", false, [data.note.uuid]);
      window.dispatchEvent(new Event("loadingEnd"));
    } else if (data.type === "RESTORE_NOTE") {
      const timeOut = setTimeout(() => {
        dispatchNotes({
          type: "TRASH_NOTE",
          note: data.note,
        });
      }, 210);

      const handler = (e) => {
        if (e.propertyName === "opacity") {
          data.noteRef.current.removeEventListener("transitionend", handler);
          clearTimeout(timeOut);
          dispatchNotes({
            type: "TRASH_NOTE",
            note: data.note,
          });
        }
      };

      data.noteRef.current.addEventListener("transitionend", handler);
      data.noteRef.current.classList.add("fade-out");

      const initialIndex = data.index;
      const undoTrash = async () => {
        dispatchNotes({
          type: "UNDO_TRASH",
          note: data.note,
          initialIndex: initialIndex,
        });
      };

      const onClose = async () => {
        window.dispatchEvent(new Event("loadingStart"));
        await NoteUpdateAction("isTrash", true, [data.note.uuid]);
        window.dispatchEvent(new Event("loadingEnd"));
      };

      if (!data.note.isTrash) {
        openSnackFunction({
          snackMessage: `${
            data.note.isPinned ? "Note unpinned and trashed" : "Note trashed"
          }`,
          snackOnUndo: undoTrash,
          snackOnClose: onClose,
          unloadWarn: true,
        });
      }
      data.setIsOpen(false);
    } else if (data.type === "DELETE_NOTE") {
      batchDecNoteCount(data.note.labels);

      const timeOut = setTimeout(() => {
        dispatchNotes({
          type: "DELETE_NOTE",
          note: data.note,
        });
      }, 210);

      const handler = (e) => {
        if (e.propertyName === "opacity") {
          data.noteRef.current.removeEventListener("transitionend", handler);
          clearTimeout(timeOut);
          dispatchNotes({
            type: "DELETE_NOTE",
            note: data.note,
          });
        }
      };

      data.noteRef.current.addEventListener("transitionend", handler);
      data.noteRef.current.classList.add("fade-out");

      window.dispatchEvent(new Event("loadingStart"));
      await DeleteNoteAction(data.note.uuid);
      window.dispatchEvent(new Event("loadingEnd"));
    } else if (data.type === "PIN_ARCHIVED_NOTE") {
      const timeOut = setTimeout(() => {
        dispatchNotes({
          type: "PIN_ARCHIVED_NOTE",
          note: data.note,
        });
      }, 210);
      const handler = (e) => {
        if (e.propertyName === "opacity") {
          data.noteRef.current.removeEventListener("transitionend", handler);
          clearTimeout(timeOut);
          dispatchNotes({
            type: "PIN_ARCHIVED_NOTE",
            note: data.note,
          });
        }
      };

      data.noteRef.current.addEventListener("transitionend", handler);
      data.noteRef.current.classList.add("fade-out");

      window.dispatchEvent(new Event("loadingStart"));
      const initialIndex = data.index;

      const undoPinArchived = async () => {
        dispatchNotes({
          type: "UNDO_PIN_ARCHIVED",
          note: data.note,
          initialIndex: initialIndex,
        });

        window.dispatchEvent(new Event("loadingStart"));
        await undoAction({
          type: "UNDO_PIN_ARCHIVED",
          noteUUID: data.note.uuid,
          initialIndex: initialIndex,
          endIndex: 0,
        });
        window.dispatchEvent(new Event("loadingEnd"));
      };

      openSnackFunction({
        snackMessage: "Note unarchived and pinned",
        snackOnUndo: undoPinArchived,
      });

      try {
        await NoteUpdateAction("pinArchived", true, [data.note.uuid]);
      } finally {
        window.dispatchEvent(new Event("loadingEnd"));
      }
    } else if (data.type === "UPDATE_COLOR") {
      if (data.newColor === data.selectedColor) return;
      data.setSelectedColor(data.newColor);

      dispatchNotes({
        type: "UPDATE_COLOR",
        note: data.note,
        newColor: data.newColor,
      });

      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction("color", data.newColor, [data.note.uuid]);
      window.dispatchEvent(new Event("loadingEnd"));
    }
  }, []);

  useEffect(() => {
    const handleHashChange = (e) => {
      setSelectedNotesIDs([]);
      setTooltipAnchor(null);
    };

    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash.startsWith("NOTE")) {
      const noteUUID = hash.slice(5);
      const note = notesState.notes.get(noteUUID);

      setSelectedNote(note);
      if (note !== undefined) {
        setIsModalOpen(true);
      }
    }
  }, [notesReady]);

  useEffect(() => {
    const handler = (e) => {
      requestAnimationFrame(() => {
        const selected = e.detail.hash;
        const captialized = (hash) =>
          hash.charAt(0).toUpperCase() + hash.slice(1);
        setCurrent(captialized(selected));
        openSnackFunction({ close: true });
      });
    };

    window.addEventListener("sectionChange", handler);
    return () => window.removeEventListener("sectionChange", handler);
  }, []);

  const components = {
    Home,
    Labels,
    Reminders,
    Archive,
    Trash,
  };

  const Page = components[current];

  useEffect(() => {
    requestAnimationFrame(() => {
      if (notesState.order.length === 0 && current === "Trash") {
        const btn = document.body.querySelector("#add-btn");
        btn.disabled = true;
        return;
      }
      if (current === "Trash") {
        const trashNotes = notesState.order.some(
          (uuid) => notesState.notes.get(uuid).isTrash
        );
        if (!trashNotes) {
          const btn = document.body.querySelector("#add-btn");
          btn.disabled = true;
        } else {
          const btn = document.body.querySelector("#add-btn");
          btn.disabled = false;
        }
      } else {
        const btn = document.body.querySelector("#add-btn");
        btn.disabled = false;
      }
    });
  }, [current, notesState.order, notesState.notes]);

  const handleDeleteLabel = (data) => {
    window.dispatchEvent(new Event("loadingStart"));
    deleteLabelAction({ labelUUID: data.labelData.uuid }).then(() => {
      window.dispatchEvent(new Event("loadingEnd"));
    });
    data.labelRef.current.style.opacity = "0";

    const timeOut = setTimeout(() => {
      console.log("timeout");
      dispatchNotes({
        type: "REMOVE_LABEL_FROM_NOTES",
        labelUUID: data.labelData.uuid,
      });
      removeLabel(data.labelData.uuid, data.labelData.label);
    }, 270);

    const handler = (e) => {
      if (e.propertyName === "opacity" && !data.isOpen) {
        clearTimeout(timeOut);
        dispatchNotes({
          type: "REMOVE_LABEL_FROM_NOTES",
          labelUUID: data.labelData.uuid,
        });
        removeLabel(data.labelData.uuid, data.labelData.label);
        data.triggerReRender((prev) => !prev);
        data.labelRef.current.removeEventListener("transitionend", handler);
      }
    };

    data.labelRef.current.addEventListener("transitionend", handler);
  };

  const handleSelectNote = useCallback((data) => {
    if (data.source === "note" && !areNotesSelectedRef.current) {
      return;
    }
    if (data.clear) {
      setSelectedNotesIDs([]);
      window.dispatchEvent(new Event("topMenuClose"));
      return;
    }
    data.e.stopPropagation();

    setTooltipAnchor((prev) => ({
      anchor: null,
      text: prev.text,
    }));
    data.setSelected((prev) => !prev);

    if (data.selected) {
      data.setSelected(false);
      setSelectedNotesIDs((prev) =>
        prev.filter((noteData) => noteData.uuid !== data.uuid)
      );
    } else {
      data.setSelected(true);
      setSelectedNotesIDs((prev) => [
        ...prev,
        { uuid: data.uuid, index: data.index, isPinned: data.isPinned },
      ]);
    }
  }, []);

  const areNotesSelectedRef = useRef(false);

  useEffect(() => {
    const length = selectedNotesIDs.length;

    if (length === 0) {
      areNotesSelectedRef.current = false;
    } else {
      areNotesSelectedRef.current = true;
    }
  }, [selectedNotesIDs.length]);

  const dragStart = useRef({ x: 0, y: 0 });
  const isMouseDown = useRef(false);
  const selectionBoxRef = useRef(null);

  const handleMouseMove = (e) => {
    if (isMouseDown.current) {
      const box = selectionBoxRef.current;
      box.style.display = "block";

      const newX = Math.min(e.clientX, dragStart.current.x);
      const newY = Math.min(e.clientY, dragStart.current.y);
      const width = Math.abs(e.clientX - dragStart.current.x);
      const height = Math.abs(e.clientY - dragStart.current.y);

      box.style.left = newX + scrollX + "px";
      box.style.top = newY + scrollY + "px";
      box.style.width = width + "px";
      box.style.height = height + "px";
    }
  };

  const handleMouseDown = (e) => {
    isMouseDown.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
    };
    const box = selectionBoxRef.current;
    box.style.left = e.clientX + "px";
    box.style.top = e.clientY + "px";
  };

  const handleMouseUp = (e) => {
    isMouseDown.current = false;
    const box = selectionBoxRef.current;
    box.removeAttribute("style");
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <>
      <div id="n-overlay" className="note-overlay" />

      <Modal
        note={selectedNote}
        setNote={setSelectedNote}
        dispatchNotes={dispatchNotes}
        initialStyle={modalStyle}
        onClose={() => setSelectedNote(null)}
        setTooltipAnchor={setTooltipAnchor}
        closeRef={closeRef}
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        openSnackFunction={openSnackFunction}
        closeSnackbar={closeSnackbar}
        setModalStyle={setModalStyle}
      />
      {tooltipAnchor?.display && <Tooltip anchorEl={tooltipAnchor} />}
      <Snackbar
        snackbarState={snackbarState}
        setSnackbarState={setSnackbarState}
        setTooltipAnchor={setTooltipAnchor}
        undo={undoFunction}
        unloadWarn={unloadWarn}
        setUnloadWarn={setUnloadWarn}
        onClose={onCloseFunction}
      />
      <div className="starting-div-header" />

      <TopMenu
        notes={notesState.notes}
        dispatchNotes={dispatchNotes}
        openSnackFunction={openSnackFunction}
        setFadingNotes={setFadingNotes}
        selectedNotesIDs={selectedNotesIDs}
        setSelectedNotesIDs={setSelectedNotesIDs}
        setTooltipAnchor={setTooltipAnchor}
      />

      <Page
        dispatchNotes={dispatchNotes}
        notes={notesState.notes}
        order={notesState.order}
        setTooltipAnchor={setTooltipAnchor}
        openSnackFunction={openSnackFunction}
        handleNoteClick={handleNoteClick}
        handleSelectNote={handleSelectNote}
        handleDeleteLabel={handleDeleteLabel}
        selectedNotesIDs={selectedNotesIDs}
        fadingNotes={fadingNotes}
        setFadingNotes={setFadingNotes}
        setSelectedNotesIDs={setSelectedNotesIDs}
        noteActions={noteActions}
        notesReady={notesReady}
      />

      <SelectionBox ref={selectionBoxRef} />
    </>
  );
};

export default page;
