import { createRef, useEffect, useMemo, useRef } from "react";
import {
  isLabelsEmpty,
  isNotesEmpty,
  isOrderEmpty,
  loadLabelsMap,
  loadNotesMap,
  loadOrderArray,
  saveLabelsArray,
  saveNotesArray,
  saveNotesMap,
  saveOrderArray,
} from "@/utils/localDb";
import { useAppContext } from "@/context/AppContext";
import { debounce } from "lodash";
import { fetchNotes } from "@/utils/actions";

export function useDataManager({
  notesState,
  dispatchNotes,
  notesReady,
  setNotesReady,
}) {
  const { user, labelsRef, setLabelsReady, notesStateRef } = useAppContext();

  const isNotesSyncFirstRunRef = useRef(true);
  const isOrderSyncFirstRunRef = useRef(true);

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
    window.dispatchEvent(new Event("loadingStart"));
    const fetchedNotes = await fetchNotes();
    await saveNotesArray(fetchedNotes.data, user?.id);
    await saveOrderArray(fetchedNotes.order, user?.id);
    await saveLabelsArray(fetchedNotes.labels, user?.id);
    window.dispatchEvent(new Event("loadingEnd"));
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

  const syncOrderToLocalDB = useMemo(
    () =>
      debounce(async () => {
        await saveOrderArray(notesStateRef.current.order, user?.id);
      }, 500),
    [user]
  );

  useEffect(() => {
    if (!notesReady) return;

    if (isOrderSyncFirstRunRef.current) {
      isOrderSyncFirstRunRef.current = false;
      return;
    }

    syncOrderToLocalDB();
  }, [notesState.order]);

  const syncNotesToLocalDB = useMemo(
    () =>
      debounce(async () => {
        await saveNotesMap(notesStateRef.current.notes, user?.id);
      }, 500),
    [user]
  );

  useEffect(() => {
    if (!notesReady) return;
    if (isNotesSyncFirstRunRef.current) {
      isNotesSyncFirstRunRef.current = false;
      return;
    }

    syncNotesToLocalDB();
  }, [notesState.notes]);
}
