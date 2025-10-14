import { useAppContext } from "@/context/AppContext";
import { saveOrderArray } from "@/utils/localDb";
import localDbReducer from "@/utils/localDbReducer";
import { useEffect, useRef } from "react";

export function useRealtimeUpdates({ dispatchNotes, updateModalRef }) {
  const { user, clientID, labelsRef, notesStateRef, isOnline } =
    useAppContext();

  const userID = user?.id;

  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!isOnline) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    eventSourceRef.current = new EventSource(
      `/api/realtime?clientID=${clientID}`
    );

    eventSourceRef.current.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        updateModalRef.current = true;
        console.log(data);
        const updatedNotes = new Map();
        const deletedNotesIDs = new Set();
        const newNotes = [];
        for (let item of data) {
          if (item.type === "note") {
            const doc = item?.fullDocument;
            switch (item.operationType) {
              case "update":
              case "replace": {
                const { creator, ...newNote } = doc;
                if (!doc) continue;
                let lastVersion = newNote;
                const existingUpdatedNote = updatedNotes.get(doc?.uuid);
                if (
                  existingUpdatedNote &&
                  existingUpdatedNote?.ut === "settings"
                ) {
                  lastVersion = { ...newNote, ...existingUpdatedNote };
                }
                updatedNotes.set(doc?.uuid, { ...lastVersion, ut: "note" });
                break;
              }
            }
          } else if (item.type === "settings") {
            switch (item.operationType) {
              case "update":
              case "replace": {
                const settings = item?.fullDocument;
                const { _v, _id, user, note, ...newSettings } = settings;
                if (!settings) continue;
                let lastVersion = newSettings;
                const existingUpdatedNote = updatedNotes.get(note);
                if (existingUpdatedNote && existingUpdatedNote?.ut === "note") {
                  lastVersion = { ...existingUpdatedNote, ...newSettings };
                }
                updatedNotes.set(note, {
                  ...lastVersion,
                  uuid: note,
                  ut: "settings",
                });
                break;
              }
              case "insert": {
                const note = item?.fullDocument;
                note && newNotes.push({ ...note, ut: "settings" });
                break;
              }
            }
          } else if (item.type === "order") {
            const orderSet = new Set(item.notesOrder);
            const existingOrder = notesStateRef.current.order;

            existingOrder.forEach((uuid) => {
              if (!orderSet.has(uuid)) {
                deletedNotesIDs.add(uuid);
              }
            });

            dispatchNotes({ type: "SET_ORDER", newOrder: item.notesOrder });
            await saveOrderArray(item.notesOrder, user?.id);
          } else if (item.type === "labels") {
            labelsRef.current = new Map(
              item.labels.map((mapLabel) => {
                return [mapLabel.uuid, mapLabel];
              })
            );
            requestAnimationFrame(() => {
              window.dispatchEvent(new Event("refreshPinnedLabels"));
              window.dispatchEvent(new Event("refreshLabelsSection"));
            });
          }
        }

        if (updatedNotes.size > 0) {
          const newUpdatedNotes = [];
          let willUpdate = true;
          for (let newNote of [...updatedNotes.values()]) {
            const originalNote = notesStateRef.current.notes.get(newNote.uuid);
            if (!originalNote) {
              willUpdate = false;
              break;
            }
            const { ut, ...clearNewNote } = newNote;
            const updatedNote = {
              ...originalNote,
              ...clearNewNote,
              creator: originalNote.creator,
            };
            newUpdatedNotes.push(updatedNote);
          }

          if (willUpdate) {
            dispatchNotes({
              type: "SET_NOTES",
              notes: newUpdatedNotes,
            });
            localDbReducer({
              notes: notesStateRef.current.notes,
              order: notesStateRef.current.order,
              userID: userID,
              type: "SET_NOTES",
              notes: newUpdatedNotes,
            });
          }
        }

        if (newNotes.length > 0) {
          dispatchNotes({
            type: "ADD_NOTES",
            newNotes,
          });
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "ADD_NOTES",
            newNotes,
          });
        }

        if (deletedNotesIDs.size > 0) {
          dispatchNotes({
            type: "DELETE_BY_ID",
            deletedIDsSet: deletedNotesIDs,
          });
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "DELETE_BY_ID",
            deletedIDsSet: deletedNotesIDs,
          });
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error("EventSource failed:", error);
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isOnline]);

  return {
    disconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    },
  };
}
