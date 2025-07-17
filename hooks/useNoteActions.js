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

export function useNoteActions({
  dispatchNotes,
  setVisibleItems,
  setFadingNotes,
  openSnackFunction,
  setLoadingImages,
  labelObj,
  currentSection,
  fadeNote,
}) {
  const { filters } = useSearch();
  const noteActions = useCallback(
    async (data) => {
      if (data.type === "archive") {
        const initialIndex = data.index;

        const redo = async () => {
          if (fadeNote) {
            setFadingNotes((prev) => new Set(prev).add(data.note.uuid));
            setVisibleItems((prev) => new Set(prev).add(data.note.uuid));
          }
          setTimeout(
            () => {
              dispatchNotes({
                type: "ARCHIVE_NOTE",
                note: data.note,
              });
              if (fadeNote) {
                setFadingNotes((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(data.note.uuid);
                  return newSet;
                });
                setVisibleItems((prev) => {
                  const updated = new Set(prev);
                  updated.delete(data.note.uuid);
                  return updated;
                });
              }
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
          if (fadeNote) {
            setVisibleItems((prev) => {
              const updated = new Set(prev);
              updated.add(data.note.uuid);
              return updated;
            });
          }
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
            setVisibleItems((prev) => {
              const updated = new Set(prev);
              updated.delete(data.note.uuid);
              return updated;
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
          setVisibleItems((prev) => {
            const updated = new Set(prev);
            updated.add(data.note.uuid);
            return updated;
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
            setVisibleItems((prev) => {
              const updated = new Set(prev);
              updated.delete(data.note.uuid);
              return updated;
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
          setVisibleItems((prev) => {
            const updated = new Set(prev);
            updated.add(data.note.uuid);
            return updated;
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
          setVisibleItems((prev) => {
            const updated = new Set(prev);
            updated.delete(data.note.uuid);
            return updated;
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
                type: "PIN_NOTE",
                note: data.note,
              });

              if (fadeNote) {
                setFadingNotes((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(data.note.uuid);
                  return newSet;
                });
                setVisibleItems((prev) => {
                  const updated = new Set(prev);
                  updated.delete(data.note.uuid);
                  return updated;
                });
              }
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
          setVisibleItems((prev) => {
            const updated = new Set(prev);
            updated.add(data.note.uuid);
            return updated;
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
          textUpdatedAt: new Date(),
          images: newImages,
        };

        const redo = async () => {
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

          window.dispatchEvent(new Event("loadingStart"));
          const received = await copyNoteAction({
            originalNoteUUID: note.uuid,
            newNoteUUID: newUUID,
            newImages: newImages,
            note: { ...newNote, images: data.note.images },
          });
          const receivedNote = received.note;
          window.dispatchEvent(new Event("loadingEnd"));

          setLoadingImages((prev) => {
            const newSet = new Set(prev);
            newImages.forEach(({ uuid }) => newSet.delete(uuid));
            return newSet;
          });

          dispatchNotes({ type: "SET_NOTE", note: receivedNote });
        };

        redo();

        const undoCopy = async () => {
          setFadingNotes((prev) => new Set(prev).add(newUUID));

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
            setVisibleItems((prev) => {
              const updated = new Set(prev);
              updated.delete(newUUID);
              return updated;
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
          snackRedo: redo,
        });
        data.setMoreMenuOpen(false);
      } else if (data.type === "REMOVE_LABEL") {
        const fadeNote =
          filters.label === data.labelUUID || labelObj?.uuid === data.labelUUID;

        fadeNote && setFadingNotes((prev) => new Set(prev).add(data.note.uuid));

        setTimeout(
          () => {
            dispatchNotes({
              type: "REMOVE_LABEL",
              note: data.note,
              labelUUID: data.labelUUID,
            });

            setFadingNotes((prev) => {
              const newSet = new Set(prev);
              newSet.delete(data.note.uuid);
              return newSet;
            });

            fadeNote &&
              setVisibleItems((prev) => {
                const updated = new Set(prev);
                updated.delete(data.note.uuid);
                return updated;
              });
          },
          fadeNote ? 250 : 0
        );
        window.dispatchEvent(new Event("loadingStart"));
        await removeLabelAction({
          noteUUID: data.note.uuid,
          labelUUID: data.labelUUID,
        });
        window.dispatchEvent(new Event("loadingEnd"));
      } else if (data.type === "COLOR") {
        if (data.note.color === data.newColor) return;

        const fadeNote = filters.color;
        const isUseEffectCall = data.isUseEffectCall;

        if (!isUseEffectCall && fadeNote) return;

        fadeNote && setFadingNotes((prev) => new Set(prev).add(data.note.uuid));

        setTimeout(
          () => {
            dispatchNotes({
              type: "UPDATE_COLOR",
              note: data.note,
              newColor: data.newColor,
            });
            setFadingNotes((prev) => {
              const newSet = new Set(prev);
              newSet.delete(data.note.uuid);
              return newSet;
            });
            fadeNote &&
              setVisibleItems((prev) => {
                const updated = new Set(prev);
                updated.delete(data.note.uuid);
                return updated;
              });
          },
          fadeNote ? 250 : 0
        );
      } else if (data.type === "REMOVE_FILTERED_LABEL") {
        setFadingNotes((prev) => {
          const updated = new Set(prev);
          updated.add(data.note.uuid);
          return updated;
        });
        setTimeout(() => {
          dispatchNotes({
            type: "REMOVE_LABEL",
            note: data.note,
            labelUUID: data.labelUUID,
          });
          setFadingNotes((prev) => {
            const updated = new Set(prev);
            updated.delete(data.note.uuid);
            return updated;
          });
          setVisibleItems((prev) => {
            const updated = new Set(prev);
            updated.delete(data.note.uuid);
            return updated;
          });
        }, 250);
      }
    },
    [currentSection, labelObj, filters]
  );
  return { noteActions };
}
