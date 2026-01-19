"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createLabelAction, updateLabelAction } from "@/utils/actions";
import { debounce } from "lodash";
import { saveLabelsMap } from "@/utils/localDb";
import { useAppContext } from "./AppContext";

const LabelsContext = createContext();

export const LabelsProvider = ({ children, userID }) => {
  const { clientID } = useAppContext();
  const labelsRef = useRef(new Map());

  const updateLocalLabels = useMemo(
    () =>
      debounce(async () => await saveLabelsMap(labelsRef.current, userID), 500),
    [],
  );

  const createLabel = useCallback(async (uuid, label, createdAt) => {
    labelsRef.current.set(uuid, {
      uuid: uuid,
      label: label,
      createdAt: createdAt,
      color: "Default",
    });
    updateLocalLabels();
    window.dispatchEvent(new Event("loadingStart"));
    await createLabelAction(uuid, label, clientID.current);
    window.dispatchEvent(new Event("loadingEnd"));
  }, []);

  const createLabelForNotes =
    (async (data) => {
      const updatedLabels = new Map(labelsRef.current);
      updatedLabels.set(data.labelUUID, {
        uuid: data.labelUUID,
        label: data.label,
        createdAt: new Date(),
        color: "Default",
      });

      labelsRef.current = updatedLabels;

      updateLocalLabels();
    },
    []);

  const updateLabelColor = useCallback(async (uuid, newColor) => {
    const newLabel = { ...labelsRef.current.get(uuid), color: newColor };
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;
    updateLocalLabels();
    window.dispatchEvent(new Event("loadingStart"));
    await updateLabelAction({
      type: "color",
      uuid: uuid,
      color: newColor,
      clientID: clientID.current,
    });
    window.dispatchEvent(new Event("loadingEnd"));
  }, []);

  const updateLabel = useCallback(async (uuid, updatedLabel) => {
    const newLabel = { ...labelsRef.current.get(uuid), label: updatedLabel };
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;
    updateLocalLabels();
    window.dispatchEvent(new Event("loadingStart"));
    await updateLabelAction({
      type: "title",
      uuid: uuid,
      label: updatedLabel,
      clientID: clientID.current,
    });
    window.dispatchEvent(new Event("loadingEnd"));
  }, []);

  const updateLabelImage = useCallback(async (uuid, imageFile) => {
    const oldImage = labelsRef.current.get(uuid).image;
    const localImageURL = URL.createObjectURL(imageFile);
    const newLabel = { ...labelsRef.current.get(uuid), image: localImageURL };
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("labelUUID", uuid);
    formData.append("clientID", clientID.current);

    window.dispatchEvent(new Event("loadingStart"));

    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.add(uuid);
      return newSet;
    });

    const res = await fetch("/api/label/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      const newLabel = { ...labelsRef.current.get(uuid), image: data.url };
      labelsRef.current.set(uuid, newLabel);
      updateLocalLabels();
    } else {
      const error = await res.text();
      openSnackRef.current({
        snackMessage: error,
        showUndo: false,
      });
      const newLabel = { ...labelsRef.current.get(uuid), image: oldImage };
      labelsRef.current.set(uuid, newLabel);
      updateLocalLabels();
    }

    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(uuid);
      return newSet;
    });

    window.dispatchEvent(new Event("loadingEnd"));
  }, []);

  const deleteLabelImage = useCallback(async (data) => {
    if (data.action === "delete") {
      const newLabel = { ...labelsRef.current.get(data.uuid), image: null };
      const labels = new Map(labelsRef.current).set(data.uuid, newLabel);
      labelsRef.current = labels;
      updateLocalLabels();
      window.dispatchEvent(new Event("loadingStart"));
      await updateLabelAction({
        type: "delete_image",
        uuid: data.uuid,
        clientID: clientID.current,
      });
      window.dispatchEvent(new Event("loadingEnd"));
    } else if (data.action === "remove") {
      const newLabel = { ...labelsRef.current.get(data.uuid), image: null };
      const labels = new Map(labelsRef.current).set(data.uuid, newLabel);
      updateLocalLabels();
      labelsRef.current = labels;
    } else if (data.action === "restore") {
      const newLabel = {
        ...labelsRef.current.get(data.uuid),
        image: data.image,
      };
      const labels = new Map(labelsRef.current).set(data.uuid, newLabel);
      labelsRef.current = labels;
      updateLocalLabels();
    }
  }, []);

  const removeLabel = useCallback((uuid, label) => {
    labelsRef.current.delete(uuid);
    updateLocalLabels();
  }, []);

  const handlePin = useCallback(async (uuid) => {
    const currentLabel = labelsRef.current.get(uuid);
    const value = !currentLabel.isPinned;
    const newLabel = {
      ...currentLabel,
      isPinned: value,
      pinDate: new Date(),
    };
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;
    updateLocalLabels();
    window.dispatchEvent(new Event("loadingStart"));
    await updateLabelAction({
      type: "label_pin",
      uuid: uuid,
      value: value,
      clientID: clientID.current,
    });
    window.dispatchEvent(new Event("loadingEnd"));
  }, []);

  const swapPinnedLabels = useCallback(async (draggedUUID, overUUID) => {
    if (!draggedUUID || !overUUID) return;

    const changedLabels = [];
    let initialIndex = -2;
    let endIndex = -1;

    if (overUUID === "remind") {
      const entries = Array.from(labelsRef.current.entries()).sort(
        ([, a], [, b]) =>
          new Date(b.pinDate).getTime() - new Date(a.pinDate).getTime(),
      );
      const draggedIndex = entries.findIndex(([id]) => id === draggedUUID);
      initialIndex = draggedIndex;
      const [removed] = entries.splice(draggedIndex, 1);
      entries.splice(0, 0, removed);
      const now = Date.now();
      const reordered = new Map(
        entries.map(([id, label], i) => {
          if (!label.isPinned) return [id, label];
          if (id === draggedUUID) {
            endIndex = i;
          }
          const newDate = now - i;
          changedLabels.push({ uuid: id, pinDate: newDate });
          return [id, { ...label, pinDate: newDate }];
        }),
      );
      labelsRef.current = reordered;
    } else {
      const entries = Array.from(labelsRef.current.entries()).sort(
        ([, a], [, b]) =>
          new Date(b.pinDate).getTime() - new Date(a.pinDate).getTime(),
      );
      const draggedIndex = entries.findIndex(([id]) => id === draggedUUID);
      initialIndex = draggedIndex;
      const overIndex = entries.findIndex(([id]) => id === overUUID);

      const [removed] = entries.splice(draggedIndex, 1);
      entries.splice(
        overIndex > draggedIndex ? overIndex : overIndex + 1,
        0,
        removed,
      );

      const now = Date.now();
      const reordered = new Map(
        entries.map(([id, label], i) => {
          if (!label.isPinned) return [id, label];
          if (id === draggedUUID) {
            endIndex = i;
          }
          const newDate = now - i;
          changedLabels.push({ uuid: id, pinDate: newDate });
          return [id, { ...label, pinDate: now - i }];
        }),
      );
      labelsRef.current = reordered;
    }
    updateLocalLabels();
    if (initialIndex !== endIndex) {
      window.dispatchEvent(new Event("refreshPinnedLabels"));
      window.dispatchEvent(new Event("loadingStart"));
      await updateLabelAction({
        type: "side-dnd",
        affected: changedLabels,
        clientID: clientID.current,
      });
      window.dispatchEvent(new Event("loadingEnd"));
    }
  }, []);

  return (
    <LabelsContext.Provider
      value={{
        labelsRef,
        swapPinnedLabels,
        updateLabel,
        updateLabelColor,
        updateLabelImage,
        handlePin,
        removeLabel,
        deleteLabelImage,
        createLabel,
        createLabelForNotes,
      }}
    >
      {children}
    </LabelsContext.Provider>
  );
};

export const useLabelsContext = () => useContext(LabelsContext);
