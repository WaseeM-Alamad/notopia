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
  copyNoteAction,
  deleteLabelAction,
  DeleteNoteAction,
  fetchNotes,
  NoteUpdateAction,
  undoAction,
} from "@/utils/actions";
import React, {
  createRef,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useAppContext } from "@/context/AppContext";
import TopMenu from "@/components/others/topMenu/TopMenu";
import SelectionBox from "@/components/others/SelectionBox";
import { v4 as uuid } from "uuid";
import Search from "@/components/pages/Search";
import { useSearch } from "@/context/SearchContext";
import DynamicLabel from "@/components/pages/DynamicLabel";

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
        notes: new Map(state.notes).set(action.newNote.uuid, {
          ...action.newNote,
          ref: createRef(),
        }),
        order: [action.newNote.uuid, ...state.order],
      };

    case "BATCH_COPY_NOTE": {
      const updatedNotes = new Map(state.notes);
      const updatedOrder = [...state.order];

      action.newNotes.forEach((note) => {
        updatedNotes.set(note.uuid, { ...note, ref: createRef() });
        updatedOrder.unshift(note.uuid);
      });

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }

    case "UNDO_BATCH_COPY": {
      const updatedNotes = new Map(state.notes);
      [...updatedNotes].filter((n) => !action.notesToDel.includes(n.uuid));
      const updatedOrder = state.order.slice(action.length);

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }

    case "SET_NOTE": {
      const updatedNotes = new Map(state.notes).set(action.note.uuid, {
        ...action.note,
        ref: createRef(),
      });
      return {
        ...state,
        notes: updatedNotes,
      };
    }

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

    case "BATCH_ARCHIVE/TRASH": {
      const sortedNotes = action.selectedNotes.sort(
        (a, b) => b.index - a.index
      );
      let sortedUUIDS = [];
      const updatedNotes = new Map(state.notes);

      sortedNotes.forEach((noteData) => {
        const newNote = {
          ...updatedNotes.get(noteData.uuid),
          [action.property]: !action.val,
          isPinned: false,
        };
        updatedNotes.set(noteData.uuid, newNote);
        sortedUUIDS.push(noteData.uuid);
      });

      const updatedOrder = state.order.filter(
        (uuid) => !sortedUUIDS.includes(uuid)
      );

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
      let sortedUUIDS = [];

      sortedNotes.forEach((noteData) => {
        const newNote = {
          ...updatedNotes.get(noteData.uuid),
          isPinned: !action.isPinned,
          isArchived: false,
        };
        updatedNotes.set(noteData.uuid, newNote);
        sortedUUIDS.push(noteData.uuid);
      });

      const updatedOrder = state.order.filter(
        (uuid) => !sortedUUIDS.includes(uuid)
      );

      updatedOrder.unshift(...sortedUUIDS);

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }

    case "BATCH_DELETE_NOTES": {
      const updatedNotes = new Map();
      const updatedOrder = [];

      for (const noteUUID of state.order) {
        const note = state.notes.get(noteUUID);
        if (!action.deletedUUIDs.includes(noteUUID)) {
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

    case "UNDO_BATCH_ARCHIVE/TRASH": {
      const sortedNotes = action.selectedNotes.sort(
        (a, b) => a.index - b.index
      );
      const updatedNotes = new Map(state.notes);
      const updatedOrder = state.order.slice(action.length);

      sortedNotes.forEach((noteData) => {
        const newNote = {
          ...updatedNotes.get(noteData.uuid),
          [action.property]: action.val,
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

    case "BATCH_REMOVE_LABEL": {
      const updatedNotes = new Map(state.notes);

      action.selectedNotesIDs.forEach(({ uuid: noteUUID }) => {
        const note = updatedNotes.get(noteUUID);

        const updatedLabels = note.labels.filter(
          (labelUUID) => labelUUID !== action.uuid
        );

        updatedNotes.set(noteUUID, { ...note, labels: updatedLabels });
      });

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "BATCH_ADD_LABEL": {
      if (action.case === "shared") {
        const updatedNotes = new Map(state.notes);
        action.selectedNotesIDs.forEach(({ uuid: noteUUID }) => {
          const note = updatedNotes.get(noteUUID);

          const updatedLabels = [action.uuid, ...note.labels];

          updatedNotes.set(noteUUID, { ...note, labels: updatedLabels });
        });

        return {
          ...state,
          notes: updatedNotes,
        };
      } else {
        return {
          ...state,
          notes: action.updatedNotes,
        };
      }
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

    case "ADD_CHECKBOX": {
      const updatedNotes = new Map(state.notes);
      const note = updatedNotes.get(action.noteUUID);
      updatedNotes.set(action.noteUUID, {
        ...note,
        checkboxes: [...note.checkboxes, action.checkbox],
      });

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "CHECKBOX_VIS": {
      const updatedNotes = new Map(state.notes);
      const note = updatedNotes.get(action.noteUUID);
      updatedNotes.set(action.noteUUID, {
        ...note,
        showCheckboxes: !note.showCheckboxes,
      });

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "CHECKBOX_STATE": {
      const updatedNotes = new Map(state.notes);
      const note = updatedNotes.get(action.noteUUID);
      const newCheckboxArr = note.checkboxes.map((checkbox) => {
        if (checkbox.uuid !== action.checkboxUUID) return checkbox;
        return { ...checkbox, isCompleted: action.value };
      });
      updatedNotes.set(action.noteUUID, {
        ...note,
        checkboxes: newCheckboxArr,
      });

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "DELETE_CHECKBOX": {
      const updatedNotes = new Map(state.notes);
      const note = updatedNotes.get(action.noteUUID);
      const newCheckboxArr = note.checkboxes.filter(
        (checkbox) => checkbox.uuid !== action.checkboxUUID
      );
      updatedNotes.set(action.noteUUID, {
        ...note,
        checkboxes: newCheckboxArr,
      });

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "DELETE_CHECKED": {
      const updatedNotes = new Map(state.notes);
      const note = updatedNotes.get(action.noteUUID);
      const newCheckboxArr = note.checkboxes.filter(
        (checkbox) => !checkbox.isCompleted
      );
      updatedNotes.set(action.noteUUID, {
        ...note,
        checkboxes: newCheckboxArr,
      });

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "UNCHECK_ALL": {
      const updatedNotes = new Map(state.notes);
      const note = updatedNotes.get(action.noteUUID);
      const newCheckboxArr = note.checkboxes.map((checkbox) => {
        if (!checkbox.isCompleted) return checkbox;
        return { ...checkbox, isCompleted: false };
      });
      updatedNotes.set(action.noteUUID, {
        ...note,
        checkboxes: newCheckboxArr,
      });

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "EXPAND_ITEMS": {
      const updatedNotes = new Map(state.notes);
      const note = updatedNotes.get(action.noteUUID);
      updatedNotes.set(action.noteUUID, {
        ...note,
        expandCompleted: !note.expandCompleted,
      });

      return {
        ...state,
        notes: updatedNotes,
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
  const {
    searchTerm,
    setSearchTerm,
    searchRef,
    skipHashChangeRef,
    filters,
    setFilters,
  } = useSearch();
  const { batchNoteCount, removeLabel, labelsRef, labelsReady, ignoreKeysRef } =
    useAppContext();
  const [current, setCurrent] = useState("Home");
  const [tooltipAnchor, setTooltipAnchor] = useState(null);
  const [notesState, dispatchNotes] = useReducer(notesReducer, initialStates);
  const notesStateRef = useRef(notesState);
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
  const undoFunction = useRef(null);
  const redoFunction = useRef(null);
  const allowUndoRef = useRef(true);
  const allowRedoRef = useRef(null);
  const onCloseFunction = useRef(() => {});
  const firstRun = useRef(true);
  const closeRef = useRef(null);
  const keyThrottleRef = useRef(false);
  const emptySearchRef = useRef(false);
  const areNotesSelectedRef = useRef(false);
  const ctrlDownRef = useRef(false);
  const batchArchiveRef = useRef(() => {});
  const batchPinRef = useRef(() => {});
  const batchDeleteRef = useRef(() => {});
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const isMouseDown = useRef(false);
  const selectionBoxRef = useRef(null);
  const selectedNotesRef = useRef(new Set());
  const rootContainerRef = useRef(null);
  const prevSelectedRef = useRef(null);

  const fadeNote = current !== "DynamicLabel" && current !== "Search";

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
          allowUndoRef.current = true;
          allowRedoRef.current = false;
          undoFunction.current = data.snackOnUndo;
        }
        if (data.snackRedo !== undefined) {
          redoFunction.current = data.snackRedo;
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
      window.dispatchEvent(new Event("loadLabels"));
      const fetchedNotes = await fetchNotes();
      window.dispatchEvent(new Event("loadingEnd"));

      const notesMap = new Map(
        fetchedNotes.data.map((note) => [
          note.uuid,
          { ...note, ref: createRef() },
        ])
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

  const noteActions = useCallback(
    async (data) => {
      if (data.type === "archive") {
        const initialIndex = data.index;

        const redo = async () => {
          if (fadeNote) {
            setFadingNotes((prev) => new Set(prev).add(data.note.uuid));
          }
          setTimeout(
            () => {
              dispatchNotes({
                type: "ARCHIVE_NOTE",
                note: data.note,
              });
              setFadingNotes((prev) => {
                const newSet = new Set(prev);
                newSet.delete(data.note.uuid);
                return newSet;
              });
            },
            fadeNote ? 250 : 0
          );

          const first = data.index === 0;
          window.dispatchEvent(new Event("loadingStart"));
          await NoteUpdateAction({
            type: "isArchived",
            value: !data.note.isArchived,
            noteUUIDs: [data.note.uuid],
            first: first,
          });
          window.dispatchEvent(new Event("loadingEnd"));
        };

        redo();

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
          snackRedo: redo,
        });
      } else if (data.type === "RESTORE_NOTE") {
        const initialIndex = data.index;

        const redo = async () => {
          setFadingNotes((prev) => new Set(prev).add(data.note.uuid));

          setTimeout(() => {
            dispatchNotes({
              type: "TRASH_NOTE",
              note: data.note,
            });
            setFadingNotes((prev) => {
              const newSet = new Set(prev);
              newSet.delete(data.note.uuid);
              return newSet;
            });
          }, 250);

          window.dispatchEvent(new Event("loadingStart"));
          await NoteUpdateAction({
            type: "isTrash",
            value: false,
            noteUUIDs: [data.note.uuid],
          });
          window.dispatchEvent(new Event("loadingEnd"));
        };

        redo();

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
          snackRedo: redo,
        });
      } else if (data.type === "TRASH_NOTE") {
        const initialIndex = data.index;

        const redo = async () => {
          setFadingNotes((prev) => new Set(prev).add(data.note.uuid));

          setTimeout(() => {
            dispatchNotes({
              type: "TRASH_NOTE",
              note: data.note,
            });
            setFadingNotes((prev) => {
              const newSet = new Set(prev);
              newSet.delete(data.note.uuid);
              return newSet;
            });
          }, 250);
        };

        redo();

        const undoTrash = async () => {
          dispatchNotes({
            type: "UNDO_TRASH",
            note: data.note,
            initialIndex: initialIndex,
          });
        };

        const onClose = async () => {
          window.dispatchEvent(new Event("loadingStart"));
          await NoteUpdateAction({
            type: "isTrash",
            value: true,
            noteUUIDs: [data.note.uuid],
          });
          window.dispatchEvent(new Event("loadingEnd"));
        };

        if (!data.note.isTrash) {
          openSnackFunction({
            snackMessage: `${
              data.note.isPinned ? "Note unpinned and trashed" : "Note trashed"
            }`,
            snackOnUndo: undoTrash,
            snackOnClose: onClose,
            snackRedo: redo,
            unloadWarn: true,
          });
        }
        data.setIsOpen(false);
      } else if (data.type === "DELETE_NOTE") {
        batchNoteCount(data.note.labels);
        setFadingNotes((prev) => new Set(prev).add(data.note.uuid));

        setTimeout(() => {
          dispatchNotes({
            type: "DELETE_NOTE",
            note: data.note,
          });
          setFadingNotes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.note.uuid);
            return newSet;
          });
        }, 250);

        window.dispatchEvent(new Event("loadingStart"));
        await DeleteNoteAction(data.note.uuid);
        window.dispatchEvent(new Event("loadingEnd"));
      } else if (data.type === "PIN_ARCHIVED_NOTE") {
        const initialIndex = data.index;

        const redo = async () => {
          if (fadeNote) {
            setFadingNotes((prev) => new Set(prev).add(data.note.uuid));
          }

          setTimeout(
            () => {
              dispatchNotes({
                type: "PIN_ARCHIVED_NOTE",
                note: data.note,
              });

              setFadingNotes((prev) => {
                const newSet = new Set(prev);
                newSet.delete(data.note.uuid);
                return newSet;
              });
            },
            fadeNote ? 250 : 0
          );

          window.dispatchEvent(new Event("loadingStart"));
          await NoteUpdateAction({
            type: "pinArchived",
            value: true,
            noteUUIDs: [data.note.uuid],
          });
          window.dispatchEvent(new Event("loadingEnd"));
        };

        redo();

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
          snackRedo: redo,
        });
      } else if (data.type === "UPDATE_COLOR") {
        if (data.newColor === data.selectedColor) return;
        data.setSelectedColor(data.newColor);

        dispatchNotes({
          type: "UPDATE_COLOR",
          note: data.note,
          newColor: data.newColor,
        });

        window.dispatchEvent(new Event("loadingStart"));
        await NoteUpdateAction({
          type: "color",
          value: data.newColor,
          noteUUIDs: [data.note.uuid],
        });
        window.dispatchEvent(new Event("loadingEnd"));
      } else if (data.type === "COPY_NOTE") {
        const newUUID = uuid();
        const note = data.note;
        const newImages = [];
        const newCheckboxes = [];
        const oldToNewCBMap = new Map();

        if (note.images.length > 0) {
          note.images.forEach((image) => {
            const newUUID = uuid();
            const newImage = { uuid: newUUID, url: image.url };
            newImages.push(newImage);
          });
        }

        if (note.checkboxes.length > 0) {
          const copiedCheckboxes = note.checkboxes.map((checkbox) => {
            const newUUID = uuid();
            oldToNewCBMap.set(checkbox.uuid, newUUID);
            const newCheckbox = {
              ...checkbox,
              uuid: newUUID,
            };
            return newCheckbox;
          });

          copiedCheckboxes.forEach((checkbox) => {
            const newChildren = checkbox.children.map((childUUID) =>
              oldToNewCBMap.get(childUUID)
            );
            const finalCheckbox = {
              ...checkbox,
              children: newChildren,
            };
            newCheckboxes.push(finalCheckbox);
          });
        }

        const newNote = {
          uuid: newUUID,
          title: note.title,
          content: note.content,
          color: note.color,
          background: note.background,
          labels: note.labels,
          checkboxes: newCheckboxes,
          showCheckboxes: true,
          expandCompleted: note.expandCompleted,
          isPinned: false,
          isArchived: false,
          isTrash: note.isTrash,
          createdAt: new Date(),
          updatedAt: new Date(),
          images: newImages,
        };

        const labelsUUIDs = [];

        note.labels.forEach((labelUUID) => {
          labelsUUIDs.push(labelUUID);
        });

        batchNoteCount(labelsUUIDs, "inc");

        dispatchNotes({
          type: "ADD_NOTE",
          newNote: newNote,
        });

        const undoCopy = async () => {
          setFadingNotes((prev) => new Set(prev).add(newUUID));
          batchNoteCount(labelsUUIDs);
          setTimeout(async () => {
            dispatchNotes({
              type: "UNDO_COPY",
              noteUUID: newNote.uuid,
            });
            setFadingNotes((prev) => {
              const newSet = new Set(prev);
              newSet.delete(newUUID);
              return newSet;
            });
            window.dispatchEvent(new Event("loadingStart"));
            await undoAction({
              type: "UNDO_COPY",
              noteUUID: newNote.uuid,
              isImages: note.images.length,
            });
            window.dispatchEvent(new Event("loadingEnd"));
          }, 250);
        };
        openSnackFunction({
          snackMessage: "Note created",
          snackOnUndo: undoCopy,
        });
        data.setMoreMenuOpen(false);

        window.dispatchEvent(new Event("loadingStart"));
        const received = await copyNoteAction({
          originalNoteUUID: note.uuid,
          newNoteUUID: newUUID,
          newImages: newImages,
          note: newNote,
        });
        const receivedNote = received.note;
        window.dispatchEvent(new Event("loadingEnd"));

        dispatchNotes({ type: "SET_NOTE", note: receivedNote });
      }
    },
    [current]
  );

  const tripleEncode = (str) => {
    return encodeURIComponent(encodeURIComponent(encodeURIComponent(str)));
  };

  const doubleEncode = (str) => {
    return encodeURIComponent(encodeURIComponent(str));
  };

  const tripleDecode = (str) => {
    return decodeURIComponent(decodeURIComponent(decodeURIComponent(str)));
  };

  const doubleDecode = (str) => {
    return decodeURIComponent(decodeURIComponent(str));
  };

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    if (emptySearchRef.current && !searchTerm.trim()) {
      emptySearchRef.current = false;
      return;
    } else {
      emptySearchRef.current = false;
    }

    const hash = window.location.hash.replace("#", "");
    let encodedNewHash = "";
    let filteredRest = [];
    if (hash.startsWith("search/")) {
      const decodedHash = doubleDecode(hash.replace("search/", ""));
      const filters = decodedHash.split("&");

      filters.forEach((filter) => {
        if (filter.startsWith("text")) {
          return;
        }
        filteredRest.push(decodeURIComponent(filter));
      });

      if (!searchTerm.trim()) {
        if (filteredRest.length === 0) {
          encodedNewHash = "search";
        } else {
          //searchTerm  not-encoded
          //filteredRest not-encoded
          const and = doubleEncode("&");
          const eq = doubleEncode("=");
          const encodedFilters = filteredRest.map((filter) => {
            const parts = filter.split(/=(.+)/);

            let updatedFilter = "";

            if (parts[0] === "image") {
              updatedFilter = parts[0];
            } else {
              updatedFilter = parts[0] + eq + tripleEncode(parts[1]);
            }

            return updatedFilter;
          });

          const joinedFilters = encodedFilters.join(and);
          encodedNewHash = "search/" + joinedFilters;
        }
      } else {
        const encodedTerm = tripleEncode(searchTerm.toLowerCase().trim());

        if (filteredRest.length === 0) {
          encodedNewHash = "search/" + doubleEncode("text=") + encodedTerm;
        } else {
          const and = doubleEncode("&");
          const eq = doubleEncode("=");

          const encodedFilters = filteredRest.map((filter) => {
            const parts = filter.split(/=(.+)/);

            let updatedFilter = "";

            if (parts[0] === "image") {
              updatedFilter = parts[0];
            } else {
              updatedFilter = parts[0] + eq + tripleEncode(parts[1]);
            }

            return updatedFilter;
          });

          const joinedFilters = encodedFilters.join(and);
          encodedNewHash =
            "search/" +
            doubleEncode("text=") +
            encodedTerm +
            and +
            joinedFilters;
        }
      }
    } else {
      const encodedTerm = tripleEncode(searchTerm.toLowerCase().trim());

      encodedNewHash = "search/" + doubleEncode("text=") + encodedTerm;
    }

    window.location.hash = encodedNewHash;
  }, [searchTerm]);

  const handleHashChange = useCallback(() => {
    setSelectedNotesIDs([]);
    setTooltipAnchor(null);
    openSnackFunction({ close: true });
    undoFunction.current = null;
    allowUndoRef.current = true;
    allowRedoRef.current = false;

    const hash = window.location.hash.replace("#", "");
    if (hash.trim() === "") {
      setCurrent("Home");
    } else if (hash.startsWith("search")) {
      setCurrent("Search");
    }

    if (hash.toLocaleLowerCase().startsWith("note")) {
      const parts = hash.split("/");
      const noteUUID = parts[1];
      const note = notesStateRef.current.notes.get(noteUUID);
      setSelectedNote(note);
      if (note !== undefined) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(false);
    }

    if (skipHashChangeRef.current) {
      skipHashChangeRef.current = false;
      return;
    }

    const decodedHash = doubleDecode(hash.replace("search/", ""));
    if (hash.startsWith("search/")) {
      let dataObj = {};
      const filters = decodedHash.split("&");
      filters.forEach((filter) => {
        if (filter.startsWith("color")) {
          const color = decodeURIComponent(filter);
          let decodedColor = color.split(/=(.+)/)[1];
          dataObj.color =
            decodedColor?.charAt(0)?.toUpperCase() + decodedColor?.slice(1);
        } else if (filter.startsWith("text")) {
          const text = decodeURIComponent(filter);
          const decodedText = text.split(/=(.+)/)[1];
          dataObj.text = decodedText;
        } else if (filter.startsWith("label")) {
          if (!labelsReady) return;
          const label = decodeURIComponent(filter);
          const decodedLabel = label.split(/=(.+)/)[1];
          let labelUUID = "";
          for (const [key, object] of labelsRef.current) {
            if (object.label.toLowerCase() === decodedLabel) {
              labelUUID = key;
            }
          }
          dataObj.label = labelUUID;
        } else if (filter === "image") {
          dataObj.image = true;
        }
      });

      setFilters((prev) => ({
        ...prev,
        color: dataObj.color ?? null,
        label: dataObj.label ?? null,
        image: dataObj.image ?? null,
      }));
      const text = dataObj.text ?? "";
      setSearchTerm(text);
      requestAnimationFrame(() => {
        searchRef.current.value = text;
      });
    }
    if (hash === "search") {
      emptySearchRef.current = true;
      setFilters({
        color: null,
        label: null,
        image: null,
      });
      setSearchTerm("");
      requestAnimationFrame(() => {
        searchRef.current.value = "";
      });
    }
  }, [labelsReady]);

  useEffect(() => {
    handleHashChange();

    window.removeEventListener("hashchange", handleHashChange);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [labelsReady]);

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
      if (!e.detail?.hash) return;
      requestAnimationFrame(() => {
        const selected = e.detail.hash;
        const captialized = (hash) =>
          hash.charAt(0).toUpperCase() + hash.slice(1);

        if (selected === "search") {
          const colorSet = new Set();
          const labelSet = new Set();
          const typeSet = new Set();
          notesStateRef.current.order.forEach((order) => {
            const note = notesStateRef.current.notes.get(order);
            if (note.isTrash) return;
            colorSet.add(note.color);
            note.labels.forEach((label) => labelSet.add(label));
            note.images.length > 0 && typeSet.add("images");
          });
          let filtersNum = 0;

          if (colorSet.size > 0) {
            ++filtersNum;
          }

          if (labelSet.size > 0) {
            ++filtersNum;
          }

          if (typeSet.size > 0) {
            ++filtersNum;
          }

          if (filtersNum > 2) {
            window.location.hash = "search";
            setCurrent(captialized(selected));
          } else if (
            colorSet.size > 1 ||
            labelSet.size > 1 ||
            typeSet.size > 1
          ) {
            window.location.hash = "search";
            setCurrent(captialized(selected));
          }
        } else if (selected.startsWith("label/")) {
          console.log("labell man");
          setCurrent("DynamicLabel");
        } else {
          setCurrent(captialized(selected));
        }
      });
    };

    window.addEventListener("sectionChange", handler);
    return () => window.removeEventListener("sectionChange", handler);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() !== "" && current !== "Search") {
      setCurrent("Search");
    }
  }, [searchTerm]);

  const components = {
    Home,
    Labels,
    Reminders,
    Archive,
    Trash,
    Search,
    DynamicLabel,
  };

  const Page = components[current];

  useEffect(() => {
    notesStateRef.current = notesState;
    requestAnimationFrame(() => {
      if (notesState.order.length === 0 && current === "Trash") {
        const btn = document.body.querySelector("#add-btn");
        if (btn) {
          btn.disabled = true;
        }
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

  const handleDeleteLabel = useCallback((data) => {
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
        window.dispatchEvent(new Event("refreshPinnedLabels"));
      }
    };

    data.labelRef.current.addEventListener("transitionend", handler);
  }, []);

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
      text: prev?.text,
    }));
    data.setSelected((prev) => !prev);

    if (data.selected) {
      data.setSelected(false);
      setSelectedNotesIDs((prev) =>
        prev.filter((noteData) => noteData.uuid !== data.uuid)
      );
      selectedNotesRef.current.delete(data.uuid);
    } else {
      data.setSelected(true);
      setSelectedNotesIDs((prev) => [
        ...prev,
        { uuid: data.uuid, index: data.index, isPinned: data.isPinned },
      ]);

      selectedNotesRef.current.add(data.uuid);
    }
  }, []);

  useEffect(() => {
    const length = selectedNotesIDs.length;

    if (length === 0) {
      areNotesSelectedRef.current = false;
      selectedNotesRef.current = new Set();
    } else {
      areNotesSelectedRef.current = true;
    }
  }, [selectedNotesIDs.length]);

  const matchesFilters = (note) => {
    if (note.isTrash) return false;

    if (filters.color && note.color !== filters.color) {
      return false;
    }

    if (
      searchTerm &&
      !(
        note.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
    ) {
      return false;
    }

    if (filters.label && !note.labels.includes(filters.label)) {
      return false;
    }

    if (filters.image && note.images.length === 0) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        if (selectedNotesRef.current.size > 0) {
          setSelectedNotesIDs([]);
          window.dispatchEvent(new Event("topMenuClose"));
        }
      }

      const target = event.target;

      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isTyping) return;

      if (event.ctrlKey && !ctrlDownRef.current) {
        ctrlDownRef.current = true;
      }

      if (event.ctrlKey && event.code === "KeyA") {
        if (ignoreKeysRef.current) {
          return;
        }
        event.preventDefault();
        const selectedNotes = [];

        const filter = (note) => {
          switch (current) {
            case "Home": {
              if (note.isTrash || note.isArchived) return false;
              break;
            }
            case "Reminders": {
              return false;
              break;
            }
            case "Archive": {
              if (!note.isArchived || note.isTrash) return false;
              break;
            }
            case "Trash": {
              if (!note.isTrash) return false;
              break;
            }
            case "Search": {
              return matchesFilters(note);
              break;
            }
            case "DynamicLabel": {
              const hash = window.location.hash.replace("#label/", "");
              const decodedHash = decodeURIComponent(hash);
              let targetedLabel = null;
              labelsRef.current.forEach((labelData) => {
                if (
                  labelData.label.toLowerCase() === decodedHash.toLowerCase()
                ) {
                  targetedLabel = labelData;
                }
              });

              if (!note.labels.includes(targetedLabel?.uuid) || note.isTrash)
                return false;
              break;
            }
          }

          return true;
        };

        notesStateRef.current.order.forEach((uuid, index) => {
          const note = notesStateRef.current.notes.get(uuid);
          if (!filter(note)) return;

          const noteData = {
            uuid: note.uuid,
            index: index,
            isPinned: note.isPinned,
          };
          selectedNotes.push(noteData);
          selectedNotesRef.current.add(note.uuid);
        });
        setSelectedNotesIDs(selectedNotes);
        window.dispatchEvent(new Event("selectAllNotes"));
      }

      if (event.code === "KeyE") {
        if (ignoreKeysRef.current) {
          return;
        }
        const hash = window.location.hash.replace("#", "");
        if (selectedNotesRef.current.size > 0 && !hash.startsWith("trash")) {
          batchArchiveRef.current();
        }
      }

      if (event.key.toLowerCase() === "delete" || event.key === "#") {
        if (ignoreKeysRef.current) {
          return;
        }
        const hash = window.location.hash.replace("#", "");
        if (selectedNotesRef.current.size > 0 && !hash.startsWith("trash")) {
          batchDeleteRef.current();
        }
      }

      if (event.code === "KeyF") {
        if (ignoreKeysRef.current) {
          return;
        }
        const hash = window.location.hash.replace("#", "");
        if (selectedNotesRef.current.size > 0 && !hash.startsWith("trash")) {
          batchPinRef.current();
        }
      }

      if (event.ctrlKey && event.code === "KeyZ" && !keyThrottleRef.current) {
        if (!event.shiftKey) {
          // UNDO
          if (
            ignoreKeysRef.current ||
            !allowUndoRef.current ||
            !undoFunction.current
          )
            return;

          keyThrottleRef.current = true;
          undoFunction.current();
          allowRedoRef.current = true;
          allowUndoRef.current = false;

          setSnackbarState((prev) => ({ ...prev, snackOpen: false }));
          setTimeout(() => {
            setSnackbarState({
              message: "Action undone",
              showUndo: false,
              snackOpen: true,
            });
          }, 80);

          // Release throttle
          setTimeout(() => {
            keyThrottleRef.current = false;
          }, 300);
        } else {
          // REDO
          if (
            ignoreKeysRef.current ||
            !allowRedoRef.current ||
            !redoFunction.current
          )
            return;

          keyThrottleRef.current = true;
          redoFunction.current();
          allowUndoRef.current = true;
          allowRedoRef.current = false;

          setSnackbarState((prev) => ({ ...prev, snackOpen: false }));
          setTimeout(() => {
            setSnackbarState({
              message: "Action redone",
              showUndo: false,
              snackOpen: true,
            });
          }, 80);

          // Release throttle
          setTimeout(() => {
            keyThrottleRef.current = false;
          }, 300);
        }
      }

      if (event.code === "Slash") {
        event.preventDefault();
        searchRef.current.click();
        searchRef.current.focus();
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "Control") {
        ctrlDownRef.current = false;
      }
    };

    // Add event listener on mount
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [searchTerm, filters, current]);

  const handleMouseMove = (e) => {
    if (isMouseDown.current) {
      const pageX = e.pageX;
      const pageY = e.pageY;
      const start = dragStartRef.current;

      if (Math.abs(pageX - start.x) < 15 && Math.abs(pageY - start.y) < 15) {
        return;
      }

      isDraggingRef.current = true;
      document.body.style.userSelect = "none";

      const box = selectionBoxRef.current;
      box.style.display = "block";

      const newX = Math.min(pageX, start.x);
      const newY = Math.min(pageY, start.y);
      const width = Math.abs(pageX - start.x);
      const height = Math.abs(pageY - start.y);

      box.style.left = newX + "px";
      box.style.top = newY + "px";
      box.style.width = width + "px";
      box.style.height = height + "px";

      notesStateRef.current.order.forEach((noteUUID) => {
        const note = notesStateRef.current.notes.get(noteUUID);
        const noteRef = note?.ref;
        if (noteRef?.current) {
          const noteRect = noteRef.current.getBoundingClientRect();
          const noteLeft = noteRect.left + window.scrollX;
          const noteTop = noteRect.top + window.scrollY;
          const noteRight = noteLeft + noteRect.width;
          const noteBottom = noteTop + noteRect.height;

          if (
            noteRight > newX &&
            noteLeft < newX + width &&
            noteBottom > newY &&
            noteTop < newY + height
          ) {
            if (selectedNotesRef.current.has(note.uuid)) return;
            selectedNotesRef.current.add(note.uuid);
            const event = new CustomEvent("selectNote", {
              detail: { uuid: note.uuid },
            });
            window.dispatchEvent(event);
          } else {
            if (!ctrlDownRef.current) {
              if (!selectedNotesRef.current.has(note.uuid)) return;
              selectedNotesRef.current.delete(note.uuid);
              const event = new CustomEvent("deselectNote", {
                detail: { uuid: note.uuid },
              });
              window.dispatchEvent(event);
            } else {
              if (prevSelectedRef.current.has(note.uuid)) return;
              selectedNotesRef.current.delete(note.uuid);
              const event = new CustomEvent("deselectNote", {
                detail: { uuid: note.uuid },
              });
              window.dispatchEvent(event);
            }
          }
        }
      });
    }
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) {
      return;
    }

    const parent = rootContainerRef.current;
    const container =
      rootContainerRef.current?.querySelector(".section-container");
    const target = e.target;
    const nav = document.body.querySelector("nav");
    const aside = document.body.querySelector("aside");
    const menu = document.getElementById("menu");
    const modal = document.getElementById("modal-portal");
    const tooltip = document.querySelector("[role='tooltip']");

    if (
      (parent?.contains(target) && target !== parent && target !== container) ||
      nav?.contains(target) ||
      aside?.contains(target) ||
      menu?.contains(target) ||
      modal?.contains(target) ||
      tooltip?.contains(target)
    ) {
      return;
    }
    isMouseDown.current = true;
    prevSelectedRef.current = new Set(selectedNotesRef.current);
    dragStartRef.current = {
      x: e.pageX,
      y: e.pageY,
    };
    const box = selectionBoxRef.current;
    box.style.left = e.pageX + "px";
    box.style.top = e.pageY + "px";
  };

  const handleMouseUp = () => {
    isMouseDown.current = false;
    document.body.style.removeProperty("user-select");
    const box = selectionBoxRef.current;
    box.removeAttribute("style");
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 10);

    // selectedNotesRef.current = new Set();
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
        noteActions={noteActions}
        setNote={setSelectedNote}
        dispatchNotes={dispatchNotes}
        initialStyle={modalStyle}
        setInitialStyle={setModalStyle}
        onClose={() => setSelectedNote(null)}
        setTooltipAnchor={setTooltipAnchor}
        closeRef={closeRef}
        current={current}
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
        functionRefs={{ batchArchiveRef, batchPinRef, batchDeleteRef }}
        dispatchNotes={dispatchNotes}
        openSnackFunction={openSnackFunction}
        setFadingNotes={setFadingNotes}
        selectedNotesIDs={selectedNotesIDs}
        setSelectedNotesIDs={setSelectedNotesIDs}
        setTooltipAnchor={setTooltipAnchor}
        isDraggingRef={isDraggingRef}
        rootContainerRef={rootContainerRef}
      />

      <Page
        dispatchNotes={dispatchNotes}
        notes={notesState.notes}
        notesStateRef={notesStateRef}
        order={notesState.order}
        setFilters={setFilters}
        filters={filters}
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
        rootContainerRef={rootContainerRef}
      />

      <SelectionBox ref={selectionBoxRef} />
    </>
  );
};

export default page;
