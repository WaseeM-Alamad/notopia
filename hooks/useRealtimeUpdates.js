import { useAppContext } from "@/context/AppContext";
import localDbReducer from "@/utils/localDbReducer";
import { useEffect, useRef } from "react";

export function useRealtimeUpdates({ dispatchNotes }) {
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

    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(data);
        const updatedNotes = new Map();
        const deletedNotesIDs = new Set();
        const newNotes = [];
        for (let item of data) {
          if (item.type === "note") {
            const note = item?.fullDocument;
            switch (item.operationType) {
              case "update":
              case "replace":
                item?.fullDocument && updatedNotes.set(note.uuid, note);
                break;
              case "insert":
                item?.fullDocument && newNotes.push(note);
                break;
              case "delete":
                item?.documentId && deletedNotesIDs.add(item.documentId);
                break;
            }
          } else if (item.type === "order") {
            dispatchNotes({ type: "SET_ORDER", newOrder: item.notesOrder });
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
          dispatchNotes({
            type: "SET_NOTES",
            notes: [...updatedNotes.values()],
          });
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "SET_NOTES",
            notes: [...updatedNotes.values()],
          });
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
