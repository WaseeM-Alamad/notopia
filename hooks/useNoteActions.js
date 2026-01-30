"use client";

import { useCallback } from "react";
import {
  NoteUpdateAction,
  undoAction,
  copyNoteAction,
  removeLabelAction,
  DeleteNoteAction,
} from "@/utils/actions";
import { v4 as uuid } from "uuid";
import { useSearch } from "@/context/SearchContext";
import { useAppContext } from "@/context/AppContext";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";

export function useNoteActions({
  dispatchNotes,
  setVisibleItems,
  setLoadingImages,
  labelObj,
  currentSection,
}) {
  const { user, clientID, openSnackRef, notesStateRef } = useAppContext();
  const userID = user?.id;
  const { filters } = useSearch();
  const noteActions = useCallback(
    async (data) => {
      if (data.type === "archive") {
        const initialIndex = data.index;

        const redo = async () => {
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "ARCHIVE_NOTE",
            note: data.note,
          });
          dispatchNotes({
            type: "ARCHIVE_NOTE",
            note: data.note,
          });

          const first = data.index === 0;
          handleServerCall(
            [
              () =>
                NoteUpdateAction({
                  type: "isArchived",
                  value: !data.note?.isArchived,
                  noteUUIDs: [data.note?.uuid],
                  first: first,
                  clientID: clientID,
                }),
            ],
            openSnackRef.current,
          );
        };

        redo();

        const undoArchive = async () => {
          setVisibleItems((prev) => {
            const updated = new Set(prev);
            updated.add(data.note?.uuid);
            return updated;
          });
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "UNDO_ARCHIVE",
            note: data.note,
            initialIndex: initialIndex,
          });
          dispatchNotes({
            type: "UNDO_ARCHIVE",
            note: data.note,
            initialIndex: initialIndex,
          });

          handleServerCall(
            [
              () =>
                undoAction({
                  type: "UNDO_ARCHIVE",
                  noteUUID: data.note?.uuid,
                  value: data.note?.isArchived,
                  pin: data.note?.isPinned,
                  initialIndex: initialIndex,
                  endIndex: 0,
                  clientID: clientID,
                }),
            ],
            openSnackRef.current,
          );
        };
        openSnackRef.current({
          snackMessage: `${
            data.note?.isArchived
              ? "Note unarchived"
              : data.note?.isPinned
                ? "Note unpinned and archived"
                : "Note Archived"
          }`,
          snackOnUndo: undoArchive,
          snackRedo: redo,
        });
      } else if (data.type === "RESTORE_NOTE") {
        const initialIndex = data.index;

        const redo = async () => {
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "TRASH_NOTE",
            note: data.note,
          });
          dispatchNotes({
            type: "TRASH_NOTE",
            note: data.note,
          });

          handleServerCall(
            [
              () =>
                NoteUpdateAction({
                  type: "isTrash",
                  value: false,
                  noteUUIDs: [data.note?.uuid],
                  clientID: clientID,
                }),
            ],
            openSnackRef.current,
          );
        };

        redo();

        const undoTrash = async () => {
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "UNDO_TRASH",
            note: data.note,
            initialIndex: initialIndex,
          });
          dispatchNotes({
            type: "UNDO_TRASH",
            note: data.note,
            initialIndex: initialIndex,
          });
          setVisibleItems((prev) => {
            const updated = new Set(prev);
            updated.add(data.note?.uuid);
            return updated;
          });

          handleServerCall(
            [
              () =>
                undoAction({
                  type: "UNDO_TRASH",
                  noteUUID: data.note?.uuid,
                  value: true,
                  initialIndex: data.initialIndex,
                  endIndex: 0,
                  clientID: clientID,
                }),
            ],
            openSnackRef.current,
          );
        };

        openSnackRef.current({
          snackMessage: "Note restored",
          snackOnUndo: undoTrash,
          snackRedo: redo,
        });
      } else if (data.type === "TRASH_NOTE") {
        const initialIndex = data.index;

        const redo = async () => {
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "TRASH_NOTE",
            note: data.note,
          });
          dispatchNotes({
            type: "TRASH_NOTE",
            note: data.note,
          });
        };

        redo();

        const undoTrash = async () => {
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "UNDO_TRASH",
            note: data.note,
            initialIndex: initialIndex,
          });
          dispatchNotes({
            type: "UNDO_TRASH",
            note: data.note,
            initialIndex: initialIndex,
          });
          setVisibleItems((prev) => {
            const updated = new Set(prev);
            updated.add(data.note?.uuid);
            return updated;
          });
        };

        const onClose = async () => {
          handleServerCall(
            [
              () =>
                NoteUpdateAction({
                  type: "isTrash",
                  value: true,
                  noteUUIDs: [data.note?.uuid],
                  clientID: clientID,
                }),
            ],
            openSnackRef.current,
          );
        };

        if (!data.note?.isTrash) {
          openSnackRef.current({
            snackMessage: `${
              data.note?.isPinned ? "Note unpinned and trashed" : "Note trashed"
            }`,
            snackOnUndo: undoTrash,
            snackOnClose: onClose,
            snackRedo: redo,
            unloadWarn: true,
          });
        }
        data.setIsOpen(false);
      } else if (data.type === "DELETE_NOTE") {
        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "DELETE_NOTE",
          note: data.note,
        });
        dispatchNotes({
          type: "DELETE_NOTE",
          note: data.note,
        });
        handleServerCall(
          [() => DeleteNoteAction(data.note?.uuid, data.note?.creator?._id)],
          openSnackRef.current,
        );
      } else if (data.type === "PIN_ARCHIVED_NOTE") {
        const initialIndex = data.index;

        const redo = async () => {
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "PIN_NOTE",
            note: data.note,
          });

          dispatchNotes({
            type: "PIN_NOTE",
            note: data.note,
          });

          handleServerCall(
            [
              () =>
                NoteUpdateAction({
                  type: "pinArchived",
                  value: true,
                  noteUUIDs: [data.note?.uuid],
                  clientID: clientID,
                }),
            ],
            openSnackRef.current,
          );
        };

        redo();

        const undoPinArchived = async () => {
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "UNDO_PIN_ARCHIVED",
            note: data.note,
            initialIndex: initialIndex,
          });
          dispatchNotes({
            type: "UNDO_PIN_ARCHIVED",
            note: data.note,
            initialIndex: initialIndex,
          });
          setVisibleItems((prev) => {
            const updated = new Set(prev);
            updated.add(data.note?.uuid);
            return updated;
          });

          handleServerCall(
            [
              () =>
                undoAction({
                  type: "UNDO_PIN_ARCHIVED",
                  noteUUID: data.note?.uuid,
                  initialIndex: initialIndex,
                  endIndex: 0,
                  clientID: clientID,
                }),
            ],
            openSnackRef.current,
          );
        };

        openSnackRef.current({
          snackMessage: "Note unarchived and pinned",
          snackOnUndo: undoPinArchived,
          snackRedo: redo,
        });
      } else if (data.type === "COPY_NOTE") {
        const newUUID = uuid();
        const note = data.note;
        const newImages = [];
        const newCheckboxes = [];
        const oldToNewCBMap = new Map();

        if (note?.images.length > 0) {
          note?.images.forEach((image) => {
            const newUUID = uuid();
            const newImage = { uuid: newUUID, url: image.url };
            newImages.push(newImage);
          });
        }

        if (note?.checkboxes.length > 0) {
          const copiedCheckboxes = note?.checkboxes.map((checkbox) => {
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
              oldToNewCBMap.get(childUUID),
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
          creator: {
            _id: userID,
            displayName: user.displayName,
            username: user.username,
            image: user.image,
          },
          title: note?.title,
          content: note?.content,
          color: note?.color,
          background: note?.background,
          labels: note?.labels,
          checkboxes: newCheckboxes,
          showCheckboxes: true,
          expandCompleted: note?.expandCompleted,
          isPinned: false,
          isArchived: false,
          isTrash: note?.isTrash,
          createdAt: new Date(),
          updatedAt: new Date(),
          images: newImages,
        };

        const redo = async () => {
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "ADD_NOTE",
            newNote: newNote,
          });
          dispatchNotes({
            type: "ADD_NOTE",
            newNote: newNote,
          });

          setVisibleItems((prev) => new Set([...prev, newUUID]));

          setLoadingImages((prev) => {
            const newSet = new Set(prev);
            newImages.forEach(({ uuid }) => newSet.add(uuid));
            return newSet;
          });

          const received = await handleServerCall(
            [
              () =>
                copyNoteAction({
                  originalNoteUUID: note?.uuid,
                  creatorID: note?.creator?._id,
                  newNoteUUID: newUUID,
                  newImages: newImages,
                  note: { ...newNote, images: data.note?.images },
                  clientID: clientID,
                }),
            ],
            openSnackRef.current,
          );
          const receivedNote = {
            ...received.note,
            creator: {
              _id: userID,
              displayName: user.displayName,
              username: user.username,
              image: user.image,
            },
          };

          setLoadingImages((prev) => {
            const newSet = new Set(prev);
            newImages.forEach(({ uuid }) => newSet.delete(uuid));
            return newSet;
          });

          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "SET_NOTE",
            note: receivedNote,
          });

          dispatchNotes({ type: "SET_NOTE", note: receivedNote });
        };

        redo();

        const undoCopy = async () => {
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "UNDO_COPY",
            noteUUID: newNote.uuid,
          });
          dispatchNotes({
            type: "UNDO_COPY",
            noteUUID: newNote.uuid,
          });
          handleServerCall(
            [
              () =>
                undoAction({
                  type: "UNDO_COPY",
                  noteUUID: newNote.uuid,
                  isImages: note?.images.length,
                  clientID: clientID,
                }),
            ],
            openSnackRef.current,
          );
        };
        openSnackRef.current({
          snackMessage: "Note created",
          snackOnUndo: undoCopy,
          snackRedo: redo,
        });
        data.setMoreMenuOpen(false);
      } else if (data.type === "REMOVE_LABEL") {
        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "REMOVE_LABEL",
          note: data.note,
          labelUUID: data.labelUUID,
        });
        dispatchNotes({
          type: "REMOVE_LABEL",
          note: data.note,
          labelUUID: data.labelUUID,
        });

        handleServerCall(
          [
            () =>
              removeLabelAction({
                noteUUID: data.note?.uuid,
                labelUUID: data.labelUUID,
                clientID: clientID,
              }),
          ],
          openSnackRef.current,
        );
      } else if (data.type === "COLOR") {
        if (data.note?.color === data.newColor) return;

        const isUseEffectCall = data.isUseEffectCall;

        if (!isUseEffectCall) return;

        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "UPDATE_COLOR",
          note: data.note,
          newColor: data.newColor,
        });

        dispatchNotes({
          type: "UPDATE_COLOR",
          note: data.note,
          newColor: data.newColor,
        });
      } else if (data.type === "REMOVE_FILTERED_LABEL") {
        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "REMOVE_LABEL",
          note: data.note,
          labelUUID: data.labelUUID,
        });
        dispatchNotes({
          type: "REMOVE_LABEL",
          note: data.note,
          labelUUID: data.labelUUID,
        });
      }
    },
    [currentSection, labelObj, filters],
  );
  return { noteActions };
}
