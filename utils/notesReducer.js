"use client";

import { createRef } from "react";

export const initialStates = {
  notes: new Map(),
  order: [],
};

export function notesReducer(state, action) {
  switch (action.type) {
    case "SET_INITIAL_DATA":
      return {
        ...state,
        notes: action?.notes ? action.notes : state.notes,
        order: action?.order ? action.order : state.order,
      };

    case "ADD_NOTE":
      return {
        ...state,
        notes: new Map(state.notes).set(action.newNote.uuid, {
          ...action.newNote,
          updatedAt: new Date(),
          ref: createRef(),
        }),
        order: [action.newNote.uuid, ...state.order],
      };

    case "ADD_NOTES": {
      const updatedNotes = new Map(state.notes);

      action.newNotes.forEach((note) => {
        const { ut, ...newNote } = note;
        updatedNotes.set(note?.uuid, {
          ...newNote,
          updatedAt: new Date(),
          ref: createRef(),
        });
      });

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "BATCH_COPY_NOTE": {
      const updatedNotes = new Map(state.notes);
      const updatedOrder = [...state.order];

      action.newNotes.forEach((note) => {
        updatedNotes.set(note?.uuid, {
          ...note,
          updatedAt: new Date(),
          ref: createRef(),
        });
        updatedOrder.unshift(note?.uuid);
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
      const updatedOrder = state.order.filter(
        (uuid) => !action.notesToDel.includes(uuid),
      );

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }

    case "SET_ORDER": {
      return {
        ...state,
        order: action.newOrder,
      };
    }

    case "SET_NOTE": {
      const updatedNotes = new Map(state.notes).set(action.note?.uuid, {
        ...action.note,
        updatedAt: new Date(),
        ref: createRef(),
      });
      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "SET_NOTES": {
      const updatedNotes = new Map(state.notes);
      action.notes.forEach((note) => {
        updatedNotes.set(note?.uuid, { ...note, ref: createRef() });
      });

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "PIN_NOTE": {
      const note = state.notes.get(action.note?.uuid);
      const newNote = {
        ...state.notes.get(action.note?.uuid),
        isPinned: !note?.isPinned,
        isArchived: false,
      };
      const updatedNotes = new Map(state.notes).set(action.note?.uuid, newNote);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.note?.uuid,
      );
      return {
        ...state,
        notes: updatedNotes,
        order: [action.note?.uuid, ...updatedOrder],
      };
    }

    case "ARCHIVE_NOTE": {
      const newNote = {
        ...state.notes.get(action.note?.uuid),
        isArchived: !action.note?.isArchived,
        isPinned: false,
      };
      const updatedNotes = new Map(state.notes).set(action.note?.uuid, newNote);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.note?.uuid,
      );
      return {
        ...state,
        notes: updatedNotes,
        order: [action.note?.uuid, ...updatedOrder],
      };
    }
    case "UNDO_ARCHIVE": {
      const newNote = {
        ...state.notes.get(action.note?.uuid),
        isArchived: action.note?.isArchived,
        isPinned: action.note?.isPinned,
      };
      const updatedNotes = new Map(state.notes).set(action.note?.uuid, newNote);
      let targetedNote = null;

      const updatedOrder = state.order.filter((uuid) => {
        if (uuid === newNote.uuid) {
          targetedNote = uuid;
          return false;
        }
        return true;
      });

      if (targetedNote !== null) {
        updatedOrder.splice(action.initialIndex, 0, targetedNote);
      }

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }

    case "BATCH_ARCHIVE/TRASH": {
      const sortedNotes = action.selectedNotes.sort(
        (a, b) => b.index - a.index,
      );
      let sortedUUIDS = [];
      const updatedNotes = new Map(state.notes);

      const sharedNotesSet = action?.sharedNotesSet || new Set();

      sortedNotes.forEach((noteData) => {
        const newNote = {
          ...updatedNotes.get(noteData.uuid),
          [action.property]: !action.val,
          ...(action.property === "isTrash" ? { collaborators: [] } : {}),
          isPinned: false,
        };
        if (action.property === "isTrash") {
          if (sharedNotesSet.has(noteData.uuid)) {
            updatedNotes.delete(noteData.uuid);
          } else {
            updatedNotes.set(noteData.uuid, newNote);
            sortedUUIDS.push(noteData.uuid);
          }
        } else {
          updatedNotes.set(noteData.uuid, newNote);
          sortedUUIDS.push(noteData.uuid);
        }
      });

      const updatedOrder = state.order.filter(
        (uuid) => !sortedUUIDS.includes(uuid),
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
        (a, b) => b.index - a.index,
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
        (uuid) => !sortedUUIDS.includes(uuid),
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

    case "DELETE_BY_ID": {
      const updatedNotes = new Map();

      for (const noteUUID of state.order) {
        const note = state.notes.get(noteUUID);
        if (action.deletedIDsSet.has(note?._id)) continue;
        updatedNotes.set(note?.uuid, note);
      }
      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "UNDO_BATCH_ARCHIVE/TRASH": {
      const sortedNotes = action.selectedNotes.sort(
        (a, b) => a.index - b.index,
      );
      const updatedNotes = new Map(state.notes);
      const updatedOrder = state.order.filter(
        (uuid) => !action.selectedUUIDs.includes(uuid),
      );

      sortedNotes.forEach((noteData) => {
        const newNote = {
          ...updatedNotes.get(noteData.uuid),
          [action.property]: action.val,
          isPinned: noteData.isPinned,
          isArchived: noteData?.isArchived,
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
        (a, b) => a.index - b.index,
      );
      const updatedNotes = new Map(state.notes);
      const updatedOrder = state.order.filter(
        (uuid) => !action.selectedUUIDs.includes(uuid),
      );

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
        ...state.notes.get(action.note?.uuid),
        isTrash: !action.note?.isTrash,
        isPinned: false,
      };
      const updatedNotes = new Map(state.notes).set(action.note?.uuid, newNote);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.note?.uuid,
      );
      return {
        ...state,
        notes: updatedNotes,
        order: [action.note?.uuid, ...updatedOrder],
      };
    }
    case "UNDO_TRASH": {
      const newNote = {
        ...state.notes.get(action.note?.uuid),
        isTrash: action.note?.isTrash,
        isPinned: action.note?.isPinned,
      };
      const updatedNotes = new Map(state.notes).set(action.note?.uuid, newNote);
      let targetedNote = null;

      const updatedOrder = state.order.filter((uuid) => {
        if (uuid === newNote.uuid) {
          targetedNote = uuid;
          return false;
        }
        return true;
      });
      if (targetedNote !== null) {
        updatedOrder.splice(action.initialIndex, 0, targetedNote);
      }

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }
    case "DELETE_NOTE": {
      const newNotes = new Map(state.notes);
      newNotes.delete(action.note?.uuid);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.note?.uuid,
      );
      return {
        ...state,
        notes: newNotes,
        order: updatedOrder,
      };
    }
    case "UNDO_PIN_ARCHIVED": {
      const newNote = {
        ...state.notes.get(action.note?.uuid),
        isPinned: false,
        isArchived: true,
      };

      const updatedNotes = new Map(state.notes).set(action.note?.uuid, newNote);

      let targetedNote = null;

      const updatedOrder = state.order.filter((uuid) => {
        if (uuid === newNote.uuid) {
          targetedNote = uuid;
          return false;
        }
        return true;
      });
      if (targetedNote !== null) {
        updatedOrder.splice(action.initialIndex, 0, targetedNote);
      }

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }
    case "UPDATE_COLOR": {
      const newNote = {
        ...state.notes.get(action.note?.uuid),
        color: action.newColor,
      };
      const updatedNotes = new Map(state.notes).set(action.note?.uuid, newNote);

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "BATCH_UPDATE_COLOR": {
      const updatedNotes = new Map(state.notes);
      action.selectedNotes.forEach((data) => {
        const newNote = {
          ...updatedNotes.get(data.uuid),
          color: action.color,
        };
        updatedNotes.set(data.uuid, newNote);
      });

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "UPDATE_BG": {
      const newNote = {
        ...state.notes.get(action.note?.uuid),
        background: action.newBG,
      };
      const updatedNotes = new Map(state.notes).set(action.note?.uuid, newNote);

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
    case "ADD_IMAGES": {
      const newNote = {
        ...state.notes.get(action.note?.uuid),
        updatedAt: new Date(),
        images: [...action.note?.images, ...action.newImages],
      };
      const updatedNotes = new Map(state.notes).set(action.note?.uuid, newNote);

      return {
        ...state,
        notes: updatedNotes,
      };
    }
    case "UPDATE_TEXT": {
      const newNote = {
        ...state.notes.get(action.note?.uuid),
        updatedAt: new Date(),
        title: action.newTitle,
        content: action.newContent,
      };
      const updatedNotes = new Map(state.notes).set(action.note?.uuid, newNote);
      return {
        ...state,
        notes: updatedNotes,
      };
    }
    case "UPDATE_IMAGES": {
      const note = state.notes.get(action.note?.uuid);
      const imagesMap = action.imagesMap;
      const newNote = {
        ...note,
        updatedAt: new Date(),
        images: note?.images.map((img) => {
          if (imagesMap.has(img.uuid)) return imagesMap.get(img.uuid);
          return img;
        }),
      };
      const updatedNotes = new Map(state.notes).set(action.note?.uuid, newNote);
      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "DELETE_IMAGES": {
      const note = state.notes.get(action.note?.uuid);
      const imagesSet = action.imagesSet;
      const newNote = {
        ...note,
        updatedAt: new Date(),
        images: note?.images.filter((img) => !imagesSet.has(img.uuid)),
      };
      const updatedNotes = new Map(state.notes).set(action.note?.uuid, newNote);
      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "UNDO_COPY": {
      const updatedNotes = new Map(state.notes);
      updatedNotes.delete(action.noteUUID);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.noteUUID,
      );

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }

    case "ADD_LABEL": {
      const newNote = {
        ...state.notes.get(action.note?.uuid),
        labels: [...action.note?.labels, action.labelUUID],
      };
      const updatedNotes = new Map(state.notes).set(action.note?.uuid, newNote);
      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "REMOVE_LABEL": {
      const targetedNote = {
        ...state.notes.get(action.note?.uuid),
      };

      const newNote = {
        ...targetedNote,
        labels: targetedNote.labels.filter(
          (noteLabelUUID) => noteLabelUUID !== action.labelUUID,
        ),
      };

      const updatedNotes = new Map(state.notes).set(action.note?.uuid, newNote);
      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "REMOVE_LABEL_FROM_NOTES": {
      const updatedNotes = new Map(state.notes);
      state.order.map((noteUUID) => {
        const note = state.notes.get(noteUUID);
        note.labels = note?.labels.filter(
          (noteLabelUUID) => noteLabelUUID !== action.labelUUID,
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
        ...state.notes.get(action.note?.uuid),
        labels: action.newLabels,
      };
      const updatedNotes = new Map(state.notes).set(action.note?.uuid, newNote);

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "BATCH_REMOVE_LABEL": {
      const updatedNotes = new Map(state.notes);

      action.selectedNotesIDs.forEach(({ uuid: noteUUID }) => {
        const note = updatedNotes.get(noteUUID);

        const updatedLabels = note?.labels.filter(
          (labelUUID) => labelUUID !== action.uuid,
        );

        updatedNotes.set(noteUUID, {
          ...note,
          labels: updatedLabels,
        });
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

          const updatedLabels = [action.uuid, ...note?.labels];

          updatedNotes.set(noteUUID, {
            ...note,
            labels: updatedLabels,
          });
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
        if (!note?.isTrash) {
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
        updatedAt: new Date(),
        checkboxes: [...note?.checkboxes, action.checkbox],
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
        showCheckboxes: !note?.showCheckboxes,
      });

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "CHECKBOX_STATE": {
      const updatedNotes = new Map(state.notes);
      const note = updatedNotes.get(action.noteUUID);
      const parentUUID = note?.checkboxes.find(
        (cb) => cb.uuid === action.checkboxUUID,
      )?.parent;
      const newCheckboxArr = note?.checkboxes.map((checkbox) => {
        if (
          checkbox.uuid === action.checkboxUUID ||
          checkbox.parent === action.checkboxUUID
        ) {
          return { ...checkbox, isCompleted: action.value };
        } else if (
          parentUUID &&
          checkbox.uuid === parentUUID &&
          action.value === false
        ) {
          return { ...checkbox, isCompleted: false };
        }
        return checkbox;
      });
      updatedNotes.set(action.noteUUID, {
        ...note,
        updatedAt: new Date(),
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
      const newCheckboxArr = note?.checkboxes.filter(
        (checkbox) => checkbox.uuid !== action.checkboxUUID,
      );
      updatedNotes.set(action.noteUUID, {
        ...note,
        updatedAt: new Date(),
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
      const newCheckboxArr = note?.checkboxes.filter(
        (checkbox) => !checkbox.isCompleted,
      );
      updatedNotes.set(action.noteUUID, {
        ...note,
        updatedAt: new Date(),
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
      const newCheckboxArr = note?.checkboxes.map((checkbox) => {
        if (!checkbox.isCompleted) return checkbox;
        return { ...checkbox, isCompleted: false };
      });
      updatedNotes.set(action.noteUUID, {
        ...note,
        updatedAt: new Date(),
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
        expandCompleted: !note?.expandCompleted,
      });

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "OPEN_NOTE": {
      const updatedNotes = new Map(state.notes);
      const note = updatedNotes.get(action.noteUUID);
      updatedNotes.set(action.noteUUID, {
        ...note,
        openNote: true,
      });

      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "DND": {
      const initialIndex = action.initialIndex;
      const finalIndex = action.finalIndex;
      if (initialIndex === null || finalIndex === null) return null;

      const updatedOrder = [...state.order];
      const [draggedNote] = updatedOrder.splice(initialIndex, 1);
      updatedOrder.splice(finalIndex, 0, draggedNote);
      return {
        ...state,
        order: updatedOrder,
      };
    }
  }
}
