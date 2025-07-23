"use client";

import { useAppContext } from "@/context/AppContext";
import { useSearch } from "@/context/SearchContext";
import { NoteUpdateAction } from "@/utils/actions";
import { useEffect } from "react";

export function useKeyBindings({
  selectedNotesRef,
  setSelectedNotesIDs,
  notesStateRef,
  batchArchiveRef,
  batchPinRef,
  batchDeleteRef,
  ctrlDownRef,
  keyThrottleRef,
  undoFunction,
  allowUndoRef,
  noteActions,
  allowRedoRef,
  redoFunction,
  setSnackbarState,
  matchesFilters,
  setIsModalOpen,
  dispatchNotes,
  handleSelectNote,
}) {
  const {
    labelsRef,
    currentSection,
    ignoreKeysRef,
    layout,
    setLayout,
    focusedNoteRef,
    addButtonRef,
  } = useAppContext();
  const { filters, searchRef } = useSearch();
  useEffect(() => {
    const handleKeyDown = async (event) => {
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

      if (
        event.ctrlKey &&
        event.code === "KeyA" &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        if (ignoreKeysRef.current) {
          return;
        }

        if (currentSection.toLowerCase() === "labels") {
          event.preventDefault();
          return;
        }

        event.preventDefault();
        const selectedNotes = [];

        const filter = (note) => {
          switch (currentSection) {
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

      if (
        event.code === "KeyC" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        addButtonRef.current.click();
      }

      if (
        event.code === "KeyE" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        if (ignoreKeysRef.current) {
          return;
        }
        const section = currentSection.toLowerCase();
        if (selectedNotesRef.current.size > 0) {
          section !== "trash" && batchArchiveRef.current();
        } else {
          if (!focusedNoteRef.current) return;
          const { index, selected, setSelected, ...note } =
            focusedNoteRef.current;
          noteActions({
            type: "archive",
            index: index,
            note: note,
            noteRef: note.ref,
          });
        }
      }

      if (event.key.toLowerCase() === "delete" || event.key === "#") {
        if (ignoreKeysRef.current) {
          return;
        }
        const section = currentSection.toLowerCase();
        if (selectedNotesRef.current.size > 0) {
          section !== "trash" && batchDeleteRef.current();
        } else {
          if (!focusedNoteRef.current) return;
          const { index, selected, setSelected, ...note } =
            focusedNoteRef.current;
          noteActions({
            type: "TRASH_NOTE",
            note: note,
            index: index,
            noteRef: note.ref,
            setIsOpen: () => {},
          });
        }
      }

      if (
        event.code === "KeyF" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        if (ignoreKeysRef.current) {
          return;
        }
        const section = currentSection.toLowerCase();
        if (selectedNotesRef.current.size > 0) {
          section !== "trash" && batchPinRef.current();
        } else {
          if (!focusedNoteRef.current) return;
          const { index, selected, setSelected, ...note } =
            focusedNoteRef.current;
          dispatchNotes({
            type: "PIN_NOTE",
            note: note,
          });
        }
      }

      if (
        event.code === "KeyX" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        if (ignoreKeysRef.current || !focusedNoteRef.current) {
          return;
        }
        const { index, selected, setSelected, ...note } =
          focusedNoteRef.current;
        handleSelectNote({
          source: "keybind",
          e: null,
          selected: selected,
          setSelected: setSelected,
          uuid: note.uuid,
          index: note.index,
          isPinned: note.isPinned,
        });
      }

      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.code === "Digit8" &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (ignoreKeysRef.current || !focusedNoteRef.current) {
          return;
        }
        const { index, selected, setSelected, ...note } =
          focusedNoteRef.current;
        if (note.checkboxes.length === 0) return;
        dispatchNotes({
          type: "CHECKBOX_VIS",
          noteUUID: note.uuid,
        });
        window.dispatchEvent(new Event("loadingStart"));
        await NoteUpdateAction({
          type: "showCheckboxes",
          value: !note.showCheckboxes,
          noteUUIDs: [note.uuid],
        });
        window.dispatchEvent(new Event("loadingEnd"));
      }

      if (
        event.code === "KeyG" &&
        event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        const width = window.innerWidth;
        if (width < 605) return;
        if (layout === "grid") {
          localStorage.setItem("layout", "list");
          setLayout("list");
        } else {
          localStorage.setItem("layout", "grid");
          setLayout("grid");
        }
      }

      if (
        event.ctrlKey &&
        event.code === "KeyZ" &&
        !event.shiftKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (
          ignoreKeysRef.current ||
          !allowUndoRef.current ||
          !undoFunction.current
        )
          return;
        event.preventDefault();
        keyThrottleRef.current = true;
        requestAnimationFrame(() => {
          undoFunction.current();
        });
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
      }

      if (
        (event.ctrlKey &&
          event.code === "KeyZ" &&
          event.shiftKey &&
          !event.metaKey &&
          !event.altKey) ||
        (event.ctrlKey &&
          event.code === "KeyY" &&
          !event.metaKey &&
          !event.altKey &&
          !event.shiftKey)
      ) {
        if (
          ignoreKeysRef.current ||
          !allowRedoRef.current ||
          !redoFunction.current
        )
          return;

        event.preventDefault();
        keyThrottleRef.current = true;
        requestAnimationFrame(() => {
          redoFunction.current();
        });
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

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    currentSection,
    filters,
    layout,
    notesStateRef,
    selectedNotesRef,
    undoFunction,
    redoFunction,
  ]);
}
