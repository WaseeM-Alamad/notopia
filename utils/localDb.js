"use client";

import { openDB } from "idb";
import { createRef } from "react";

export const initDB = async (userID) => {
  return openDB(`notopia-db-${userID}`, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("notes")) {
        db.createObjectStore("notes", { keyPath: "uuid" });
      }
      if (!db.objectStoreNames.contains("labels")) {
        db.createObjectStore("labels", { keyPath: "uuid" });
      }
      if (!db.objectStoreNames.contains("order")) {
        db.createObjectStore("order", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("notesUpdateQueue")) {
        db.createObjectStore("notesUpdateQueue", { keyPath: "uuid" });
      }
    },
  });
};

export const saveNotesArray = async (notesArray, userID) => {
  const db = await initDB(userID);
  const tx = db.transaction("notes", "readwrite");
  const store = tx.store;

  await store.clear();

  for (const note of notesArray) {
    await store.put(note);
  }

  await tx.done;
};

export const saveOrderArray = async (orderArray, userID) => {
  const db = await initDB(userID);
  const tx = db.transaction("order", "readwrite");

  await tx.store.put({
    id: "main",
    value: orderArray,
  });

  await tx.done;
};

export async function saveLabelsArray(labels, userId) {
  const db = await openDB(`notopia-db-${userId}`, 1);
  const tx = db.transaction("labels", "readwrite");
  const store = tx.objectStore("labels");

  await store.clear();

  for (const label of labels) {
    await store.put(label);
  }

  await tx.done;
}

export const saveLabelsMap = async (labelsMap, userID) => {
  const db = await initDB(userID);
  const tx = db.transaction("labels", "readwrite");
  const store = tx.objectStore("labels");

  for (const label of labelsMap.values()) {
    await store.put(label);
  }

  await tx.done;
};

export const isNotesEmpty = async (userID) => {
  const db = await initDB(userID);
  const count = await db.transaction("notes").store.count();
  return count === 0;
};

export const isOrderEmpty = async (userID) => {
  const db = await initDB(userID);
  const order = await db.transaction("order").store.get("main");
  return !order || !Array.isArray(order.value) || order.value.length === 0;
};

export const isLabelsEmpty = async (userID) => {
  const db = await initDB(userID);
  const count = await db.transaction("labels").store.count();
  return count === 0;
};

export const loadNotesMap = async (userID) => {
  const db = await initDB(userID);
  const allNotes = await db.getAll("notes");
  return new Map(
    allNotes.map((note) => [note.uuid, { ...note, ref: createRef() }])
  );
};

export const loadOrderArray = async (userID) => {
  const db = await initDB(userID);
  const orderEntry = await db.get("order", "main");
  return orderEntry?.value || [];
};

export const loadLabelsMap = async (userID) => {
  const db = await initDB(userID);
  const allLabels = await db.getAll("labels");

  return new Map(allLabels.map((label) => [label.uuid, label]));
};

export const updateLocalNote = async (passedNote, userID) => {
  const db = await initDB(userID);

  const { ref, ...note } = passedNote;

  await db.put("notes", note);
};

export const updateLocalNotes = async (notesArray, userID) => {
  const db = await initDB(userID);
  const tx = db.transaction("notes", "readwrite");
  const store = tx.objectStore("notes");

  for (const note of notesArray) {
    await store.put(note);
  }

  await tx.done;
};

export const deleteNote = async (uuid, userID) => {
  const db = await initDB(userID);
  await db.delete("notes", uuid);
};

export async function updateLocalNotesAndOrder(
  notesArray,
  orderArray = null,
  userID
) {
  try {
    const db = await initDB(userID);
    const isOnline = navigator.onLine;

    const txStores = ["notes", "notesUpdateQueue"];
    if (orderArray) txStores.push("order");

    const tx = db.transaction(txStores, "readwrite");

    const notesStore = tx.objectStore("notes");
    const notesQueueStore = tx.objectStore("notesUpdateQueue");

    for (const note of notesArray) {
      const { ref, ...noteWithoutRef } = note;

      if (!isOnline) {
        notesQueueStore.put(noteWithoutRef);
      }

      notesStore.put(noteWithoutRef);
    }

    if (orderArray) {
      const orderStore = tx.objectStore("order");
      orderStore.put({ id: "main", value: orderArray });
    }

    await tx.done;
  } catch (err) {
    console.error("Failed to update local notes and order:", err);
  }
}

// export async function updateLocalNotesAndOrder(
//   notesArray,
//   orderArray = null,
//   userID
// ) {
//   try {
//     const db = await initDB(userID);
//     const txStores = ["notes"];
//     if (orderArray) txStores.push("order");

//     const tx = db.transaction(txStores, "readwrite");
//     const notesStore = tx.objectStore("notes");

//     for (const note of notesArray) {
//       const { ref, ...noteWithoutRef } = note;
//       notesStore.put(noteWithoutRef);
//     }

//     if (orderArray) {
//       const orderStore = tx.objectStore("order");
//       orderStore.put({ id: "main", value: orderArray });
//     }

//     await tx.done;
//   } catch (err) {
//     console.error("Failed to update local notes and order:", err);
//   }
// }

export async function deleteLocalNotesAndUpdateOrder(
  noteUUIDsToDelete,
  orderArray = null,
  userID
) {
  try {
    const db = await initDB(userID);
    const txStores = ["notes"];
    if (orderArray) txStores.push("order");

    const tx = db.transaction(txStores, "readwrite");
    const notesStore = tx.objectStore("notes");

    for (const uuid of noteUUIDsToDelete) {
      notesStore.delete(uuid);
    }

    if (orderArray) {
      const orderStore = tx.objectStore("order");
      orderStore.put({ id: "main", value: orderArray });
    }

    await tx.done;
  } catch (err) {
    console.error("Failed to delete local notes and update order:", err);
  }
}

export async function getQueuedNotes(userID) {
  try {
    const db = await initDB(userID);
    const tx = db.transaction("notesUpdateQueue", "readonly");
    const store = tx.objectStore("notesUpdateQueue");
    const allQueuedNotes = await store.getAll();

    await tx.done;
    return allQueuedNotes;
  } catch (err) {
    console.error("Failed to fetch queued notes:", err);
    return [];
  }
}

export async function clearQueuedNotes(userID) {
  try {
    const db = await initDB(userID);
    const tx = db.transaction("notesUpdateQueue", "readwrite");
    const store = tx.objectStore("notesUpdateQueue");
    await store.clear();
    await tx.done;
  } catch (err) {
    console.error("Failed to clear notesUpdateQueue:", err);
  }
}
