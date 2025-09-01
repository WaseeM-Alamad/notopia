"use client";

import { useAppContext } from "@/context/AppContext";
import { useSearch } from "@/context/SearchContext";
import { NoteUpdateAction, updateOrderAction } from "@/utils/actions";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";
import { useEffect, useRef } from "react";

export function useKeyBindings({
  selectedNotesRef,
  setSelectedNotesIDs,
  notesState,
  notesStateRef,
  batchArchiveRef,
  batchPinRef,
  batchDeleteRef,
  ctrlDownRef,
  undoFunction,
  allowUndoRef,
  noteActions,
  allowRedoRef,
  redoFunction,
  setSnackbarState,
  matchesFilters,
  setIsModalOpen,
  dispatchNotes,
}) {
  const {
    user,
    clientID,
    labelsRef,
    currentSection,
    ignoreKeysRef,
    layout,
    setLayout,
    focusedIndex,
    addButtonRef,
    labelObjRef,
    setBindsOpenRef,
    openSnackRef,
  } = useAppContext();
  const userID = user?.id;
  const { filters, searchRef } = useSearch();
  const actionThrottle = useRef(false);
  const dndThrottle = useRef(false);

  const checkInSection = (note) => {
    switch (currentSection?.toLowerCase()) {
      case "home":
        return !note.isArchived && !note.isTrash;
      case "archive":
        return note.isArchived && !note.isTrash;
      case "trash":
        return note.isTrash;
      case "search":
        return matchesFilters(note);
      case "dynamiclabel":
        return (
          note?.labels?.includes(labelObjRef.current?.uuid) && !note.isTrash
        );
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      const notes = notesState.notes;
      const order = notesState.order;
      const currentUUID = order[focusedIndex.current];
      const currentNote = notes.get(currentUUID);
      if (!currentNote) return;
      if (checkInSection(currentNote)) return;
      const firstIndex = order.findIndex((uuid) => {
        const note = notes.get(uuid);
        return checkInSection(note);
      });
      focusedIndex.current = firstIndex;
    });
  }, [notesState]);

  useEffect(() => {
    const handleKeyDown = async (event) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        if (selectedNotesRef.current.size > 0) {
          setSelectedNotesIDs([]);
          window.dispatchEvent(new Event("topMenuClose"));
        }
      }

      const notes = notesStateRef.current.notes;
      const order = notesStateRef.current.order;

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
        event.code === "KeyK" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        const notes = notesStateRef.current.notes;
        const order = notesStateRef.current.order;

        const index = focusedIndex.current;

        let nextUUID = null;

        for (let i = index + 1; i < order.length; i++) {
          const tempUUID = order[i];
          const note = notes.get(tempUUID);
          if (!note) break;
          if (checkInSection(note)) {
            nextUUID = tempUUID;
            break;
          }
        }

        if (!nextUUID) return;

        const newNote = notes.get(nextUUID);

        if (!newNote?.ref?.current) return;

        newNote.ref.current.focus();
      }

      if (
        event.code === "KeyK" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        event.shiftKey
      ) {
        if (dndThrottle.current || currentSection.toLowerCase() !== "home")
          return;

        setTimeout(() => {
          dndThrottle.current = false;
        }, 100);

        dndThrottle.current = true;

        const notes = notesStateRef.current.notes;
        const order = notesStateRef.current.order;

        const initialIndex = focusedIndex.current;

        let finalIndex = null;

        for (let i = initialIndex + 1; i < order.length; i++) {
          const noteUUID = order[i];
          const note = notes.get(noteUUID);
          if (!note) break;
          if (checkInSection(note)) {
            finalIndex = i;
            break;
          }
        }

        const initialNote = notes.get(order[initialIndex]);
        const finalNote = notes.get(order[finalIndex]);

        if (
          finalIndex === null ||
          initialNote?.isPinned !== finalNote?.isPinned ||
          initialNote?.isArchived !== finalNote?.isArchived
        )
          return;
        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "DND",
          initialIndex,
          finalIndex,
        });
        dispatchNotes({
          type: "DND",
          initialIndex,
          finalIndex,
        });
        focusedIndex.current = finalIndex;

        handleServerCall(
          [
            () =>
              updateOrderAction({
                initialIndex,
                endIndex: finalIndex,
                clientID: clientID,
              }),
          ],
          openSnackRef.current
        );
      }

      if (
        event.code === "KeyJ" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        const notes = notesStateRef.current.notes;
        const order = notesStateRef.current.order;

        const index = focusedIndex.current;

        let nextUUID = null;

        for (let i = index - 1; i < order.length; i--) {
          const tempUUID = order[i];
          const note = notes.get(tempUUID);
          if (!note) break;
          if (checkInSection(note)) {
            nextUUID = tempUUID;
            break;
          }
        }

        if (!nextUUID) return;

        const newNote = notes.get(nextUUID);

        if (!newNote?.ref?.current) return;

        newNote.ref.current.focus();
      }

      if (
        event.code === "KeyJ" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        event.shiftKey
      ) {
        if (dndThrottle.current || currentSection.toLowerCase() !== "home")
          return;

        setTimeout(() => {
          dndThrottle.current = false;
        }, 100);

        dndThrottle.current = true;

        const notes = notesStateRef.current.notes;
        const order = notesStateRef.current.order;

        const initialIndex = focusedIndex.current;

        let finalIndex = null;

        for (let i = initialIndex - 1; i < order.length; i--) {
          const noteUUID = order[i];
          const note = notes.get(noteUUID);
          if (!note) break;
          if (checkInSection(note)) {
            finalIndex = i;
            break;
          }
        }

        const initialNote = notes.get(order[initialIndex]);
        const finalNote = notes.get(order[finalIndex]);

        if (
          finalIndex === null ||
          initialNote?.isPinned !== finalNote?.isPinned ||
          initialNote?.isArchived !== finalNote?.isArchived
        )
          return;
        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "DND",
          initialIndex,
          finalIndex,
        });
        dispatchNotes({
          type: "DND",
          initialIndex,
          finalIndex,
        });
        focusedIndex.current = finalIndex;

        handleServerCall(
          [
            () =>
              updateOrderAction({
                initialIndex,
                endIndex: finalIndex,
                clientID: clientID
              }),
          ],
          openSnackRef.current
        );
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
          if (
            focusedIndex.current === null ||
            focusedIndex.current === undefined ||
            actionThrottle.current
          )
            return;

          setTimeout(() => {
            actionThrottle.current = false;
          }, 400);

          actionThrottle.current = true;

          const index = focusedIndex.current;
          const uuid = order[index];

          if (!uuid) return;

          const note = notes.get(uuid);
          if (note.isTrash) return;
          noteActions({
            type: "archive",
            index: index,
            note: note,
            noteRef: note.ref,
          });
        }
      }

      if (
        event.key === "?" ||
        (event.ctrlKey &&
          event.key === "/" &&
          !event.metaKey &&
          !event.altKey &&
          !event.shiftKey)
      ) {
        setBindsOpenRef.current(true);
      }

      if (event.key.toLowerCase() === "delete" || event.key === "#") {
        if (ignoreKeysRef.current) {
          return;
        }
        const section = currentSection.toLowerCase();
        if (selectedNotesRef.current.size > 0) {
          section !== "trash" && batchDeleteRef.current();
        } else {
          if (
            focusedIndex.current === null ||
            focusedIndex.current === undefined ||
            actionThrottle.current
          )
            return;
          setTimeout(() => {
            actionThrottle.current = false;
          }, 400);

          actionThrottle.current = true;

          const index = focusedIndex.current;
          const uuid = order[index];
          if (!uuid) return;

          const note = notes.get(uuid);
          if (note.isTrash) return;
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
        if (ignoreKeysRef.current || actionThrottle.current) {
          return;
        }
        setTimeout(() => {
          actionThrottle.current = false;
        }, 400);

        actionThrottle.current = true;
        const section = currentSection.toLowerCase();
        if (selectedNotesRef.current.size > 0) {
          section !== "trash" && batchPinRef.current();
        } else {
          if (
            focusedIndex.current === null ||
            focusedIndex.current === undefined
          )
            return;
          const index = focusedIndex.current;
          const uuid = order[index];
          if (!uuid) return;

          const note = notes.get(uuid);

          if (note.isTrash) return;

          const section = currentSection.toLowerCase();

          if (section === "archive") {
            noteActions({
              type: "PIN_ARCHIVED_NOTE",
              note: note,
              noteRef: note.ref,
              index: index,
            });
          } else {
            localDbReducer({
              notes: notesStateRef.current.notes,
              order: notesStateRef.current.order,
              userID: userID,
              type: "PIN_NOTE",
              note: note,
            });
            dispatchNotes({
              type: "PIN_NOTE",
              note: note,
            });

            handleServerCall(
              [
                () =>
                  NoteUpdateAction({
                    type: "isPinned",
                    value: !note.isPinned,
                    noteUUIDs: [note.uuid],
                    clientID: clientID
                  }),
              ],
              openSnackRef.current
            );
          }
        }
      }

      if (
        event.code === "KeyX" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        if (ignoreKeysRef.current) {
          return;
        }
        if (focusedIndex.current === null || focusedIndex.current === undefined)
          return;
        const index = focusedIndex.current;
        const uuid = order[index];
        if (!uuid) return;

        const note = notes.get(uuid);

        window.dispatchEvent(
          new CustomEvent("batchSelection", {
            detail: {
              select: [note.uuid],
              deselect: [],
            },
          })
        );
      }

      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.code === "Digit8" &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (ignoreKeysRef.current) {
          return;
        }
        if (focusedIndex.current === null || focusedIndex.current === undefined)
          return;
        const index = focusedIndex.current;
        const uuid = order[index];
        if (!uuid) return;

        const note = notes.get(uuid);

        if (note.checkboxes.length === 0) return;
        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "CHECKBOX_VIS",
          noteUUID: note.uuid,
        });
        dispatchNotes({
          type: "CHECKBOX_VIS",
          noteUUID: note.uuid,
        });

        handleServerCall(
          [
            () =>
              NoteUpdateAction({
                type: "showCheckboxes",
                value: !note.showCheckboxes,
                noteUUIDs: [note.uuid],
                clientID: clientID
              }),
          ],
          openSnackRef.current
        );
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
      }

      if (
        event.code === "Slash" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
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
