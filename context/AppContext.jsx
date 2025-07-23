"use client";

import { useSession } from "next-auth/react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  fetchLabelsAction,
  createLabelAction,
  updateLabelAction,
} from "@/utils/actions";
import { useSearch } from "./SearchContext";

const AppContext = createContext();

export function AppProvider({ children, initialUser }) {
  const { data: session, status } = useSession();
  const { setFilters } = useSearch();
  const [user, setUser] = useState(initialUser);
  const [currentSection, setCurrentSection] = useState("Home");
  const [loadingImages, setLoadingImages] = useState(new Set());
  const [labelsReady, setLabelsReady] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const [layout, setLayout] = useState(null);
  const focusedNoteRef = useRef(null);

  const openSnackRef = useRef(null);
  const setTooltipRef = useRef(null);

  const labelsRef = useRef(new Map());
  const labelLookUPRef = useRef(new Map());
  const ignoreKeysRef = useRef(null);
  const labelObjRef = useRef(null);
  const calculateLayoutRef = useRef(null);
  const modalOpenRef = useRef(null);
  const isDarkModeRef = useRef(false);
  const addButtonRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark-mode");
      isDarkModeRef.current = true;
    }
  }, []);

  useEffect(() => {
    focusedNoteRef.current = null;
    if (currentSection?.toLowerCase() === "search") return;
    setIsFiltered(false);
    setFilters({ image: null, color: null, label: null });
  }, [currentSection]);

  const getLabels = async () => {
    const fetchedLables = await fetchLabelsAction();
    if (!fetchedLables.success || !fetchedLables) return;
    labelsRef.current = new Map(
      fetchedLables.data.map((mapLabel) => {
        labelLookUPRef.current.set(mapLabel.label.toLowerCase(), true);
        return [mapLabel.uuid, mapLabel];
      })
    );
    setLabelsReady(true);
  };

  useEffect(() => {
    session && setUser(session?.user);
  }, [session, status]);

  useEffect(() => {
    const savedLayout = localStorage.getItem("layout");
    if (!savedLayout) {
      localStorage.setItem("layout", "grid");
      setLayout("grid");
      return;
    }
    setLayout(savedLayout);
  }, []);

  useEffect(() => {
    window.addEventListener("loadLabels", getLabels);
    return () => window.removeEventListener("loadLabels", getLabels);
  }, []);

  const createLabel = async (uuid, label, createdAt) => {
    labelLookUPRef.current.set(label.toLowerCase(), true);
    labelsRef.current.set(uuid, {
      uuid: uuid,
      label: label,
      createdAt: createdAt,
      color: "Default",
    });
    window.dispatchEvent(new Event("loadingStart"));
    await createLabelAction(uuid, label);
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const createLabelForNotes = async (data) => {
    const updatedLabels = new Map(labelsRef.current);
    labelLookUPRef.current.set(data.label.toLowerCase(), true);
    updatedLabels.set(data.labelUUID, {
      uuid: data.labelUUID,
      label: data.label,
      createdAt: new Date(),
      color: "Default",
    });

    labelsRef.current = updatedLabels;
  };

  const updateLabelColor = async (uuid, newColor) => {
    const newLabel = { ...labelsRef.current.get(uuid), color: newColor };
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;
    window.dispatchEvent(new Event("loadingStart"));
    await updateLabelAction({ type: "color", uuid: uuid, color: newColor });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const updateLabel = async (uuid, updatedLabel, oldLabel) => {
    labelLookUPRef.current.delete(oldLabel.toLowerCase().trim());
    labelLookUPRef.current.set(updatedLabel.toLowerCase().trim(), true);
    const newLabel = { ...labelsRef.current.get(uuid), label: updatedLabel };
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;
    window.dispatchEvent(new Event("loadingStart"));
    await updateLabelAction({ type: "title", uuid: uuid, label: updatedLabel });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const updateLabelImage = async (uuid, imageFile) => {
    const localImageURL = URL.createObjectURL(imageFile);
    const newLabel = { ...labelsRef.current.get(uuid), image: localImageURL };
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("labelUUID", uuid);

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

    const data = await res.json();

    if (!data.error) {
      const newLabel = { ...labelsRef.current.get(uuid), image: data.url };
      labelsRef.current.set(uuid, newLabel);
    } else {
    }

    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(uuid);
      return newSet;
    });

    window.dispatchEvent(new Event("loadingEnd"));
  };

  const deleteLabelImage = async (data) => {
    if (data.action === "delete") {
      const newLabel = { ...labelsRef.current.get(data.uuid), image: null };
      const labels = new Map(labelsRef.current).set(data.uuid, newLabel);
      labelsRef.current = labels;
      window.dispatchEvent(new Event("loadingStart"));
      await updateLabelAction({ type: "delete_image", uuid: data.uuid });
      window.dispatchEvent(new Event("loadingEnd"));
    } else if (data.action === "remove") {
      const newLabel = { ...labelsRef.current.get(data.uuid), image: null };
      const labels = new Map(labelsRef.current).set(data.uuid, newLabel);
      labelsRef.current = labels;
    } else if (data.action === "restore") {
      const newLabel = {
        ...labelsRef.current.get(data.uuid),
        image: data.image,
      };
      const labels = new Map(labelsRef.current).set(data.uuid, newLabel);
      labelsRef.current = labels;
    }
  };

  const removeLabel = (uuid, label) => {
    labelsRef.current.delete(uuid);
    labelLookUPRef.current.delete(label.toLowerCase().trim());
  };

  const handlePin = async (uuid) => {
    const currentLabel = labelsRef.current.get(uuid);
    const value = !currentLabel.isPinned;
    const newLabel = {
      ...currentLabel,
      isPinned: value,
      pinDate: new Date(),
    };
    const labels = new Map(labelsRef.current).set(uuid, newLabel);
    labelsRef.current = labels;
    window.dispatchEvent(new Event("loadingStart"));
    await updateLabelAction({
      type: "label_pin",
      uuid: uuid,
      value: value,
    });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const swapPinnedLabels = async (draggedUUID, overUUID) => {
    if (!draggedUUID || !overUUID) return;

    const changedLabels = [];
    let initialIndex = -2;
    let endIndex = -1;

    if (overUUID === "remind") {
      const entries = Array.from(labelsRef.current.entries()).sort(
        ([, a], [, b]) =>
          new Date(b.pinDate).getTime() - new Date(a.pinDate).getTime()
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
        })
      );
      labelsRef.current = reordered;
    } else {
      // Convert Map to array for easier reordering
      const entries = Array.from(labelsRef.current.entries()).sort(
        ([, a], [, b]) =>
          new Date(b.pinDate).getTime() - new Date(a.pinDate).getTime()
      );
      const draggedIndex = entries.findIndex(([id]) => id === draggedUUID);
      initialIndex = draggedIndex;
      const overIndex = entries.findIndex(([id]) => id === overUUID);

      // Remove dragged label and reinsert at new position
      const [removed] = entries.splice(draggedIndex, 1);
      entries.splice(
        overIndex > draggedIndex ? overIndex : overIndex + 1,
        0,
        removed
      );

      // Recalculate pinDates so they stay consistent
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
        })
      );
      labelsRef.current = reordered;
    }
    if (initialIndex !== endIndex) {
      window.dispatchEvent(new Event("refreshPinnedLabels"));
      window.dispatchEvent(new Event("loadingStart"));
      await updateLabelAction({ type: "side-dnd", affected: changedLabels });
      window.dispatchEvent(new Event("loadingEnd"));
    }
  };

  const showTooltip = useCallback((e, text) => {
    const target = e.currentTarget;
    setTooltipRef.current({ anchor: target, text: text, display: true });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipRef.current((prev) => ({
      ...prev,
      display: false,
    }));
  }, []);

  const closeToolTip = useCallback(() => {
    setTooltipRef.current((prev) => ({
      anchor: null,
      text: prev?.text,
    }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        labelsReady,
        createLabel,
        createLabelForNotes,
        removeLabel,
        updateLabelColor,
        labelsRef,
        updateLabel,
        updateLabelImage,
        deleteLabelImage,
        labelLookUPRef,
        ignoreKeysRef,
        handlePin,
        layout,
        setLayout,
        swapPinnedLabels,
        isFiltered,
        setIsFiltered,
        currentSection,
        setCurrentSection,
        modalOpenRef,
        loadingImages,
        setLoadingImages,
        labelObjRef,
        user,
        setUser,
        session,
        status,
        isDarkModeRef,
        openSnackRef,
        setTooltipRef,
        showTooltip,
        hideTooltip,
        closeToolTip,
        calculateLayoutRef,
        focusedNoteRef,
        addButtonRef,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
