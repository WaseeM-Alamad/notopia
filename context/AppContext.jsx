"use client";

import { signOut, useSession } from "next-auth/react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createLabelAction, updateLabelAction } from "@/utils/actions";
import { useSearch } from "./SearchContext";
import { debounce } from "lodash";
import { saveLabelsMap } from "@/utils/localDb";
import { v4 as uuid } from "uuid";

const AppContext = createContext();

export function AppProvider({ children, initialUser }) {
  const { data: session, status } = useSession();
  const { setFilters, setSearchTerm } = useSearch();
  const [user, setUser] = useState(initialUser);
  const [currentSection, setCurrentSection] = useState(null);
  const [loadingImages, setLoadingImages] = useState(new Set());
  const [labelsReady, setLabelsReady] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const [layout, setLayout] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isExpanded, setIsExpanded] = useState({ open: null, threshold: null });
  const [breakpoint, setBreakpoint] = useState(1);
  const isExpandedRef = useRef(null);
  const focusedIndex = useRef(null);
  const clientID = useRef(uuid());
  const openSnackRef = useRef(() => {});
  const setTooltipRef = useRef(null);
  const setDialogInfoRef = useRef(null);
  const notesStateRef = useRef(null);
  const labelsRef = useRef(new Map());
  const ignoreKeysRef = useRef(null);
  const labelObjRef = useRef(null);
  const calculateLayoutRef = useRef(null);
  const modalOpenRef = useRef(null);
  const isDarkModeRef = useRef(false);
  const addButtonRef = useRef(null);
  const setBindsOpenRef = useRef(null);
  const rootContainerRef = useRef(null);
  const loadNextBatchRef = useRef(null);
  const notesIndexMapRef = useRef(null);
  const floatingBtnRef = useRef(null);

  const fadeNote =
    currentSection !== "DynamicLabel" && currentSection !== "Search";

  useEffect(() => {
    const width = window.innerWidth;
    const sidebarExpanded = localStorage.getItem("sidebar-expanded");
    setIsExpanded({
      open: width < 605 ? false : sidebarExpanded === "true",
      threshold: width < 605 ? "before" : "after",
    });
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark-mode");
      isDarkModeRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!calculateLayoutRef.current) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        calculateLayoutRef.current();
      });
    });
  }, [isExpanded.open]);

  useEffect(() => {
    isExpandedRef.current = isExpanded;
  }, [isExpanded]);

  useEffect(() => {
    const handler = () => {
      const width = window.innerWidth;

      if (width < 605) {
        if (isExpandedRef.current.threshold !== "before") {
          setIsExpanded({ open: false, threshold: "before" });
        }
      } else if (isExpandedRef.current.threshold !== "after") {
        setIsExpanded({ open: false, threshold: "after" });
      }

      if (width <= 384) {
        setLayout("list");
      } else {
        const savedLayout = localStorage.getItem("layout");
        setLayout(savedLayout);
        setBreakpoint(width > 527 ? 1 : 2);
      }
    };

    handler();

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    const width = window.innerWidth;
    if (width < 605) return;
    localStorage.setItem(
      "sidebar-expanded",
      isExpanded.open ? "true" : "false"
    );
  }, [isExpanded.open]);

  useEffect(() => {
    if (isExpanded.threshold !== "before") return;

    const body = document.body;
    const nav = document.querySelector("nav");
    const topMenu = document.querySelector("#top-menu");
    const floatingBtn = floatingBtnRef?.current;
    const elements = [nav, topMenu, floatingBtn, body];

    if (isExpanded.open) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      elements.forEach(
        (el) => el && (el.style.paddingRight = `${scrollbarWidth}px`)
      );
      body.style.overflow = "hidden";
    } else {
      elements.forEach((el) => el && el.style.removeProperty("padding-right"));
      body.style.removeProperty("overflow");
      document.body.removeAttribute("data-scroll-locked");
    }
  }, [isExpanded]);

  useEffect(() => {
    focusedIndex.current = null;
    if (currentSection?.toLowerCase() === "search") return;
    requestAnimationFrame(() => {
      setSearchTerm("");
      setIsFiltered(false);
      setFilters({ image: null, color: null, label: null });
    });
  }, [currentSection]);

  useEffect(() => {
    const sessionUser = session?.user;
    if (!sessionUser && status === "authenticated") {
      signOut();
    }
    session && setUser(sessionUser);
  }, [session, status]);

  useEffect(() => {
    const savedLayout = localStorage.getItem("layout");
    if (!savedLayout) {
      localStorage.setItem("layout", "grid");
      setLayout("grid");
      return;
    }
    setLayout(window.innerWidth <= 384 ? "list" : savedLayout);
  }, []);

  const updateLocalLabels = useMemo(
    () =>
      debounce(
        async () => await saveLabelsMap(labelsRef.current, initialUser?.id),
        500
      ),
    []
  );

  const createLabel = async (uuid, label, createdAt) => {
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
  };

  const createLabelForNotes = async (data) => {
    const updatedLabels = new Map(labelsRef.current);
    updatedLabels.set(data.labelUUID, {
      uuid: data.labelUUID,
      label: data.label,
      createdAt: new Date(),
      color: "Default",
    });

    labelsRef.current = updatedLabels;

    updateLocalLabels();
  };

  const updateLabelColor = async (uuid, newColor) => {
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
  };

  const updateLabel = async (uuid, updatedLabel, oldLabel) => {
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
  };

  const updateLabelImage = async (uuid, imageFile) => {
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

    const data = await res.json();

    if (!data.error) {
      const newLabel = { ...labelsRef.current.get(uuid), image: data.url };
      labelsRef.current.set(uuid, newLabel);
      updateLocalLabels();
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
  };

  const removeLabel = (uuid, label) => {
    labelsRef.current.delete(uuid);
    updateLocalLabels();
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
    updateLocalLabels();
    window.dispatchEvent(new Event("loadingStart"));
    await updateLabelAction({
      type: "label_pin",
      uuid: uuid,
      value: value,
      clientID: clientID.current,
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
  };

  const tooltipTimeoutRef = useRef(null);

  const showTooltip = useCallback((e, text) => {
    const target = e.currentTarget;

    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltipRef.current((prev) => {
        const newMap = new Map(prev);
        newMap.set(target, text);
        return newMap;
      });
    }, 200);
  }, []);

  const hideTooltip = useCallback((e) => {
    const target = e.currentTarget;
    clearTimeout(tooltipTimeoutRef.current);
    setTooltipRef.current((prev) => {
      const newMap = new Map(prev);
      newMap.delete(target);
      return newMap;
    });
  }, []);

  const closeToolTip = useCallback(() => {
    setTooltipRef.current(new Map());
    clearTimeout(tooltipTimeoutRef.current);
  }, []);

  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    if (status === "loading" && !user) {
      setInitialLoading(true);
    } else {
      setTimeout(() => {
        setInitialLoading(false);
      }, 200);
    }
  }, [status]);

  return (
    <AppContext.Provider
      value={{
        initialLoading,
        labelsReady,
        setLabelsReady,
        createLabel,
        createLabelForNotes,
        removeLabel,
        updateLabelColor,
        labelsRef,
        updateLabel,
        updateLabelImage,
        deleteLabelImage,
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
        setDialogInfoRef,
        showTooltip,
        hideTooltip,
        closeToolTip,
        calculateLayoutRef,
        focusedIndex,
        addButtonRef,
        setBindsOpenRef,
        notesStateRef,
        fadeNote,
        isOnline,
        setIsOnline,
        isExpanded,
        setIsExpanded,
        rootContainerRef,
        loadNextBatchRef,
        notesIndexMapRef,
        floatingBtnRef,
        breakpoint,
        clientID: clientID.current,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
