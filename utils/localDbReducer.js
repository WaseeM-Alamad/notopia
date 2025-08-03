import { createRef, useMemo } from "react";
import {
  deleteLocalNotesAndUpdateOrder,
  saveOrderArray,
  updateLocalNotesAndOrder,
} from "./localDb";
import { debounce } from "lodash";

const syncOrderToLocalDB = debounce(async (orderArray, userID) => {
  await saveOrderArray(orderArray, userID);
}, 350);

const localDbReducer = (payload) => {
  switch (payload.type) {
    case "ADD_NOTE": {
      const newNote = {
        ...payload.newNote,
        ref: createRef(),
      };
      const updatedOrder = [payload.newNote.uuid, ...payload.order];
      updateLocalNotesAndOrder([newNote], updatedOrder, payload.userID);
      break;
    }

    case "BATCH_COPY_NOTE": {
      const updatedOrder = [...payload.order];

      payload.newNotes.forEach((note) => {
        updatedOrder.unshift(note.uuid);
      });
      updateLocalNotesAndOrder(payload.newNotes, updatedOrder, payload.userID);
      break;
    }

    case "UNDO_BATCH_COPY": {
      const updatedOrder = payload.order.filter(
        (uuid) => !payload.notesToDel.includes(uuid)
      );
      deleteLocalNotesAndUpdateOrder(
        payload.notesToDel,
        updatedOrder,
        payload.userID
      );
      break;
    }

    case "SET_NOTE": {
      const newNote = payload.note;
      updateLocalNotesAndOrder([newNote], null, payload.userID);
      break;
    }

    case "PIN_NOTE": {
      const note = payload.notes.get(payload.note.uuid);
      const newNote = {
        ...payload.notes.get(payload.note.uuid),
        isPinned: !note.isPinned,
        isArchived: false,
      };
      const updatedOrder = [...payload.order].filter(
        (uuid) => uuid !== payload.note.uuid
      );
      updateLocalNotesAndOrder(
        [newNote],
        [newNote.uuid, ...updatedOrder],
        payload.userID
      );
      break;
    }

    case "ARCHIVE_NOTE": {
      const newNote = {
        ...payload.notes.get(payload.note.uuid),
        isArchived: !payload.note.isArchived,
        isPinned: false,
      };
      const updatedOrder = [...payload.order].filter(
        (uuid) => uuid !== payload.note.uuid
      );
      updateLocalNotesAndOrder(
        [newNote],
        [newNote.uuid, ...updatedOrder],
        payload.userID
      );
      break;
    }
    case "UNDO_ARCHIVE": {
      const newNote = {
        ...payload.notes.get(payload.note.uuid),
        isArchived: payload.note.isArchived,
        isPinned: payload.note.isPinned,
      };

      let targetedNote = null;

      const updatedOrder = payload.order.filter((uuid) => {
        if (uuid === newNote.uuid) {
          targetedNote = uuid;
          return false;
        }
        return true;
      });
      if (targetedNote !== null) {
        updatedOrder.splice(payload.initialIndex, 0, targetedNote);
      }

      updateLocalNotesAndOrder([newNote], updatedOrder, payload.userID);
      break;
    }

    case "BATCH_ARCHIVE/TRASH": {
      const sortedNotes = payload.selectedNotes.sort(
        (a, b) => b.index - a.index
      );
      let sortedUUIDS = [];
      const newNotes = [];

      sortedNotes.forEach((noteData) => {
        const newNote = {
          ...payload.notes.get(noteData.uuid),
          [payload.property]: !payload.val,
          isPinned: false,
        };
        newNotes.push(newNote);
        sortedUUIDS.push(noteData.uuid);
      });

      const updatedOrder = payload.order.filter(
        (uuid) => !sortedUUIDS.includes(uuid)
      );

      updatedOrder.unshift(...sortedUUIDS);
      updateLocalNotesAndOrder(newNotes, updatedOrder, payload.userID);
      break;
    }

    case "BATCH_PIN": {
      const sortedNotes = payload.selectedNotes.sort(
        (a, b) => b.index - a.index
      );
      const newNotes = [];
      let sortedUUIDS = [];

      sortedNotes.forEach((noteData) => {
        const newNote = {
          ...payload.notes.get(noteData.uuid),
          isPinned: !payload.isPinned,
          isArchived: false,
        };
        newNotes.push(newNote);
        sortedUUIDS.push(noteData.uuid);
      });

      const updatedOrder = payload.order.filter(
        (uuid) => !sortedUUIDS.includes(uuid)
      );

      updatedOrder.unshift(...sortedUUIDS);
      updateLocalNotesAndOrder(newNotes, updatedOrder, payload.userID);
      break;
    }

    case "BATCH_DELETE_NOTES": {
      const updatedNotes = new Map();
      const updatedOrder = [];

      for (const noteUUID of payload.order) {
        const note = payload.notes.get(noteUUID);
        if (!payload.deletedUUIDs.includes(noteUUID)) {
          updatedNotes.set(noteUUID, note);
          updatedOrder.push(noteUUID);
        }
      }
      deleteLocalNotesAndUpdateOrder(
        payload.deletedUUIDs,
        updatedOrder,
        payload.userID
      );
      break;
    }

    case "UNDO_BATCH_ARCHIVE/TRASH": {
      const sortedNotes = payload.selectedNotes.sort(
        (a, b) => a.index - b.index
      );
      const newNotes = [];
      const updatedOrder = payload.order.slice(payload.length);

      sortedNotes.forEach((noteData) => {
        const newNote = {
          ...payload.notes.get(noteData.uuid),
          [payload.property]: payload.val,
          isPinned: noteData.isPinned,
        };
        newNotes.push(newNote);
        updatedOrder.splice(noteData.index, 0, noteData.uuid);
      });
      updateLocalNotesAndOrder(newNotes, updatedOrder, payload.userID);
      break;
    }

    case "UNDO_BATCH_PIN_ARCHIVED": {
      const sortedNotes = payload.selectedNotes.sort(
        (a, b) => a.index - b.index
      );
      const newNotes = [];
      const updatedOrder = payload.order.slice(payload.length);

      sortedNotes.forEach((noteData) => {
        const newNote = {
          ...payload.notes.get(noteData.uuid),
          isArchived: true,
          isPinned: false,
        };
        newNotes.push(newNote);
        updatedOrder.splice(noteData.index, 0, noteData.uuid);
      });
      updateLocalNotesAndOrder(newNote, updatedOrder, payload.userID);
      break;
    }

    case "TRASH_NOTE": {
      const newNote = {
        ...payload.notes.get(payload.note.uuid),
        isTrash: !payload.note.isTrash,
        isPinned: false,
      };
      const updatedOrder = [...payload.order].filter(
        (uuid) => uuid !== payload.note.uuid
      );
      updateLocalNotesAndOrder(
        [newNote],
        [newNote.uuid, ...updatedOrder],
        payload.userID
      );
      break;
    }
    case "UNDO_TRASH": {
      const newNote = {
        ...payload.notes.get(payload.note.uuid),
        isTrash: payload.note.isTrash,
        isPinned: payload.note.isPinned,
      };

      let targetedNote = null;

      const updatedOrder = payload.order.filter((uuid) => {
        if (uuid === newNote.uuid) {
          targetedNote = uuid;
          return false;
        }
        return true;
      });
      if (targetedNote !== null) {
        updatedOrder.splice(payload.initialIndex, 0, targetedNote);
      }
      updateLocalNotesAndOrder([newNote], updatedOrder, payload.userID);
      break;
    }
    case "DELETE_NOTE": {
      const updatedOrder = [...payload.order].filter(
        (uuid) => uuid !== payload.note.uuid
      );
      deleteLocalNotesAndUpdateOrder(
        [payload.note.uuid],
        updatedOrder,
        payload.userID
      );
      break;
    }
    case "UNDO_PIN_ARCHIVED": {
      const newNote = {
        ...payload.notes.get(payload.note.uuid),
        isPinned: false,
        isArchived: true,
      };

      let targetedNote = null;

      const updatedOrder = payload.order.filter((uuid) => {
        if (uuid === newNote.uuid) {
          targetedNote = uuid;
          return false;
        }
        return true;
      });
      if (targetedNote !== null) {
        updatedOrder.splice(payload.initialIndex, 0, targetedNote);
      }
      updateLocalNotesAndOrder([newNote], updatedOrder, payload.userID);
      break;
    }
    case "UPDATE_COLOR": {
      const newNote = {
        ...payload.notes.get(payload.note.uuid),
        color: payload.newColor,
      };

      updateLocalNotesAndOrder([newNote], null, payload.userID);
      break;
    }

    case "BATCH_UPDATE_COLOR": {
      const newNotes = [];
      payload.selectedNotes.forEach((data) => {
        const newNote = {
          ...payload.notes.get(data.uuid),
          color: payload.color,
        };
        newNotes.push(newNote);
      });
      updateLocalNotesAndOrder(newNotes, null, payload.userID);
      break;
    }

    case "UPDATE_BG": {
      const newNote = {
        ...payload.notes.get(payload.note.uuid),
        background: payload.newBG,
      };
      updateLocalNotesAndOrder([newNote], null, payload.userID);
      break;
    }
    case "BATCH_UPDATE_BG": {
      const newNotes = [];
      payload.selectedNotes.forEach((data) => {
        const newNote = {
          ...payload.notes.get(data.uuid),
          background: payload.background,
        };
        newNotes.push(newNote);
      });
      updateLocalNotesAndOrder(newNotes, null, payload.userID);
      break;
    }
    case "ADD_IMAGES": {
      const newNote = {
        ...payload.notes.get(payload.note.uuid),
        images: [...payload.note.images, ...payload.newImages],
      };
      const updatedNotes = new Map(payload.notes).set(
        payload.note.uuid,
        newNote
      );
    }
    case "UPDATE_TEXT": {
      const newNote = {
        ...payload.notes.get(payload.note.uuid),
        title: payload.newTitle,
        content: payload.newContent,
        textUpdatedAt: new Date(),
      };
      const updatedNotes = new Map(payload.notes).set(
        payload.note.uuid,
        newNote
      );
    }
    case "UPDATE_IMAGES": {
      const note = payload.notes.get(payload.note.uuid);
      const imagesMap = payload.imagesMap;
      const newNote = {
        ...note,
        images: note.images.map((img) => {
          if (imagesMap.has(img.uuid)) return imagesMap.get(img.uuid);
          return img;
        }),
      };
      updateLocalNotesAndOrder([newNote], null, payload.userID);
      break;
    }

    case "UNDO_COPY": {
      const updatedOrder = [...payload.order].filter(
        (uuid) => uuid !== payload.noteUUID
      );
      deleteLocalNotesAndUpdateOrder(
        [payload.noteUUID],
        updatedOrder,
        payload.userID
      );
      break;
    }

    case "ADD_LABEL": {
      const newNote = {
        ...payload.notes.get(payload.note.uuid),
        labels: [...payload.note.labels, payload.labelUUID],
      };
      updateLocalNotesAndOrder([newNote], null, payload.userID);
      break;
    }

    case "REMOVE_LABEL": {
      const targetedNote = {
        ...payload.notes.get(payload.note.uuid),
      };

      const newNote = {
        ...targetedNote,
        labels: targetedNote.labels.filter(
          (noteLabelUUID) => noteLabelUUID !== payload.labelUUID
        ),
      };
      updateLocalNotesAndOrder([newNote], null, payload.userID);
      break;
    }

    case "REMOVE_LABEL_FROM_NOTES": {
      const updatedNotes = [];
      payload.order.map((noteUUID) => {
        const note = payload.notes.get(noteUUID);
        const prevLength = note.labels.length;
        note.labels = note.labels.filter(
          (noteLabelUUID) => noteLabelUUID !== payload.labelUUID
        );

        const afterLength = note.labels.length;

        if (prevLength !== afterLength) {
          updatedNotes.push(note);
        }
      });
      if (updatedNotes.length > 0) {
        updateLocalNotesAndOrder(updatedNotes, null, payload.userID);
      }
      break;
    }

    case "UPDATE_NOTE_LABELS": {
      const newNote = {
        ...payload.notes.get(payload.note.uuid),
        labels: payload.newLabels,
      };
      const updatedNotes = new Map(payload.notes).set(
        payload.note.uuid,
        newNote
      );
    }

    case "BATCH_REMOVE_LABEL": {
      const newNotes = [];
      payload.selectedNotesIDs.forEach(({ uuid: noteUUID }) => {
        const note = payload.notes.get(noteUUID);

        const updatedLabels = note.labels.filter(
          (labelUUID) => labelUUID !== payload.uuid
        );
        const newNote = { ...note, labels: updatedLabels };
        newNotes.push(newNote);
      });
      updateLocalNotesAndOrder(newNotes, null, payload.userID);
      break;
    }

    case "BATCH_ADD_LABEL": {
      if (payload.case === "shared") {
        const newNotes = [];
        payload.selectedNotesIDs.forEach(({ uuid: noteUUID }) => {
          const note = payload.notes.get(noteUUID);

          const updatedLabels = [payload.uuid, ...note.labels];
          const newNote = { ...note, labels: updatedLabels };
          newNotes.push(newNote);
        });

        updateLocalNotesAndOrder(newNotes, null, payload.userID);
      } else {
        updateLocalNotesAndOrder(payload.newNotes, null, payload.userID);
      }
      break;
    }

    case "EMPTY_TRASH": {
      const notesToDel = [];
      const updatedOrder = [];

      for (const noteUUID of payload.order) {
        const note = payload.notes.get(noteUUID);
        if (!note.isTrash) {
          updatedOrder.push(noteUUID);
        } else {
          notesToDel.push(noteUUID);
        }
      }
      deleteLocalNotesAndUpdateOrder(notesToDel, updatedOrder, payload.userID);
      break;
    }

    case "ADD_CHECKBOX": {
      const note = payload.notes.get(payload.noteUUID);
      const newNote = {
        ...note,
        checkboxes: [...note.checkboxes, payload.checkbox],
        textUpdatedAt: new Date(),
      };
      updateLocalNotesAndOrder([newNote], null, payload.userID);
      break;
    }

    case "CHECKBOX_VIS": {
      const note = payload.notes.get(payload.noteUUID);
      const newNote = {
        ...note,
        showCheckboxes: !note.showCheckboxes,
      };
      updateLocalNotesAndOrder([newNote], null, payload.userID);
      break;
    }

    case "CHECKBOX_STATE": {
      const note = payload.notes.get(payload.noteUUID);
      const newCheckboxArr = note.checkboxes.map((checkbox) => {
        if (checkbox.uuid !== payload.checkboxUUID) return checkbox;
        return { ...checkbox, isCompleted: payload.value };
      });
      const newNote = {
        ...note,
        checkboxes: newCheckboxArr,
      };
      updateLocalNotesAndOrder([newNote], null, payload.userID);
      break;
    }

    case "DELETE_CHECKBOX": {
      const updatedNotes = new Map(payload.notes);
      const note = updatedNotes.get(payload.noteUUID);
      const newCheckboxArr = note.checkboxes.filter(
        (checkbox) => checkbox.uuid !== payload.checkboxUUID
      );
      updatedNotes.set(payload.noteUUID, {
        ...note,
        checkboxes: newCheckboxArr,
      });
    }

    case "DELETE_CHECKED": {
      const note = payload.notes.get(payload.noteUUID);
      const newCheckboxArr = note.checkboxes.filter(
        (checkbox) => !checkbox.isCompleted
      );
      const newNote = {
        ...note,
        checkboxes: newCheckboxArr,
      };
      updateLocalNotesAndOrder([newNote], null, payload.userID);
      break;
    }

    case "UNCHECK_ALL": {
      const note = payload.notes.get(payload.noteUUID);
      const newCheckboxArr = note.checkboxes.map((checkbox) => {
        if (!checkbox.isCompleted) return checkbox;
        return { ...checkbox, isCompleted: false };
      });
      const newNote = {
        ...note,
        checkboxes: newCheckboxArr,
      };
      updateLocalNotesAndOrder([newNote], null, payload.userID);
      break;
    }

    case "EXPAND_ITEMS": {
      const note = payload.notes.get(payload.noteUUID);
      const newNote = {
        ...note,
        expandCompleted: !note.expandCompleted,
      };
      updateLocalNotesAndOrder([newNote], null, payload.userID);
      break;
    }

    case "DND": {
      const initialIndex = payload.initialIndex;
      const finalIndex = payload.finalIndex;
      if (initialIndex === null || finalIndex === null) return null;

      const updatedOrder = [...payload.order];
      const [draggedNote] = updatedOrder.splice(initialIndex, 1);
      updatedOrder.splice(finalIndex, 0, draggedNote);
      syncOrderToLocalDB(updatedOrder, payload.userID);
      break;
    }
  }
};

export default localDbReducer;
