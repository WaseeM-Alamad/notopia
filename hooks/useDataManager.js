import { createRef, useEffect, useMemo, useRef } from "react";
import {
  getQueuedNotes,
  isLabelsEmpty,
  isNotesEmpty,
  isOrderEmpty,
  loadLabelsMap,
  loadNotesMap,
  loadOrderArray,
  saveLabelsArray,
  saveNotesArray,
  saveOrderArray,
} from "@/utils/localDb";
import { useAppContext } from "@/context/AppContext";
import { fetchNotes } from "@/utils/actions";

export function useDataManager({ notesState, dispatchNotes, setNotesReady }) {
  const { user, labelsRef, setLabelsReady, notesStateRef, openSnackRef } =
    useAppContext();

  useEffect(() => {
    notesStateRef.current = notesState;
  }, [notesState]);

  const setLabels = async (fetchedLables) => {
    labelsRef.current = new Map(
      fetchedLables.map((mapLabel) => {
        return [mapLabel.uuid, mapLabel];
      })
    );
    setLabelsReady(true);
  };

  const fetchAndUpdateLocally = async () => {
    if (!navigator.onLine) {
      openSnackRef.current({
        snackMessage: "You need to be online",
        showUndo: false,
      });
      return;
    }
    try {
      window.dispatchEvent(new Event("loadingStart"));

      const fetchedNotes = await fetchNotes();
      await saveNotesArray(fetchedNotes.data, user?.id);
      await saveOrderArray(fetchedNotes.order, user?.id);
      await saveLabelsArray(fetchedNotes.labels, user?.id);
      setLabels(fetchedNotes.labels);
      const notesMap = new Map(
        fetchedNotes.data.map((note) => [
          note.uuid,
          { ...note, ref: createRef() },
        ])
      );
      dispatchNotes({
        type: "SET_INITIAL_DATA",
        notes: notesMap,
        order: fetchedNotes.order,
      });
      setNotesReady(true);
      requestIdleCallback(() => {
        window.dispatchEvent(new Event("refreshLabelsSection"));
        window.dispatchEvent(new Event("refreshPinnedLabels"));
      });
    } catch (error) {
      openSnackRef.current({
        snackMessage: error.message,
        showUndo: false,
      });
    } finally {
      window.dispatchEvent(new Event("loadingEnd"));
    }
  };

  const getInitialData = async () => {
    const notesEmpty = await isNotesEmpty(user?.id);
    const orderEmpty = await isOrderEmpty(user?.id);
    const labelsEmpty = await isLabelsEmpty(user?.id);

    window.dispatchEvent(new Event("loadLabels"));

    if (notesEmpty || orderEmpty || labelsEmpty) {
      fetchAndUpdateLocally();
    } else {
      const localNotes = await loadNotesMap(user?.id);
      const localOrder = await loadOrderArray(user?.id);
      const localLabels = await loadLabelsMap(user?.id);

      labelsRef.current = localLabels;

      dispatchNotes({
        type: "SET_INITIAL_DATA",
        notes: localNotes,
        order: localOrder,
      });
      setNotesReady(true);
      setLabelsReady(true);
      fetchAndUpdateLocally();
    }
  };

  useEffect(() => {
    getInitialData();
    window.addEventListener("refresh", fetchAndUpdateLocally);

    return () => window.removeEventListener("refresh", fetchAndUpdateLocally);
  }, []);
}
