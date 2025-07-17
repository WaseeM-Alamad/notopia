"use client";

import { useSearch } from "@/context/SearchContext";
import { useEffect } from "react";

export function useKeyBindings({
  selectedNotesRef,
  setSelectedNotesIDs,
  notesStateRef,
  searchRef,
  layout,
  currentSection,
  ignoreKeysRef,
  ctrlDownRef,
  keyThrottleRef,
  undoFunction,
  allowUndoRef,
  allowRedoRef,
  redoFunction,
  setSnackbarState,
  matchesFilters,
  setIsModalOpen,
}) {
  const { filters } = useSearch();
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

      if (event.ctrlKey && event.code === "KeyZ" && !event.shiftKey) {
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
        (event.ctrlKey && event.code === "KeyZ" && event.shiftKey) ||
        (event.ctrlKey && event.code === "KeyY")
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
