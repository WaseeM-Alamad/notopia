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
import { useSearch } from "./SearchContext";
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
  const [breakpoint, setBreakpoint] = useState(1);
  const [initialLoading, setInitialLoading] = useState(false);
  const focusedIndex = useRef(null);
  const clientID = useRef(uuid());
  const openSnackRef = useRef(() => {});
  const setTooltipRef = useRef(null);
  const setDialogInfoRef = useRef(null);
  const notesStateRef = useRef(null);

  const ignoreKeysRef = useRef(null);
  const labelObjRef = useRef(null);
  const modalOpenRef = useRef(null);
  const addButtonRef = useRef(null);
  const setBindsOpenRef = useRef(null);
  const rootContainerRef = useRef(null);
  const loadNextBatchRef = useRef(null);
  const notesIndexMapRef = useRef(null);
  const floatingBtnRef = useRef(null);
  const skipLabelObjRefresh = useRef(null);
  const isActionModalOpenRef = useRef(null);
  const isContextMenuOpenRef = useRef(null);

  const fadeNote =
    currentSection !== "DynamicLabel" && currentSection !== "Search";

  useEffect(() => {
    const width = window.innerWidth;

    if (width < 341) {
      setLayout("list");
    } else {
      const savedLayout = localStorage.getItem("layout");
      setLayout(savedLayout);
      setBreakpoint(width > 527 ? 1 : width < 400 ? 3 : 2);
    }
  }, []);

  

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

  useEffect(() => {
    const handler = () => {
      closeToolTip();
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    if (status === "loading" && !user) {
      setInitialLoading(true);
    } else {
      setTimeout(() => {
        setInitialLoading(false);
      }, 200);
    }
  }, [status]);

  const saveNewAvatar = useCallback(
    async ({ avatarBlob, setIsLoading, setIsOpen, gifFile }) => {
      let avatarFile = null;

      if (!gifFile) {
        avatarFile = new File([avatarBlob], "avatar.jpg", {
          type: "image/jpeg",
        });
      } else {
        avatarFile = new File([gifFile], "avatar.gif", { type: "image/gif" });
      }

      const formData = new FormData();
      formData.append("file", avatarFile);

      setIsLoading(true);

      const res = await fetch("/api/avatar/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUser((prev) => ({ ...prev, image: data.url }));
        setIsOpen(false);
      } else {
        const error = await res.text();
        openSnackRef.current({
          snackMessage: error,
          showUndo: false,
        });
      }

      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    },
    [],
  );

  return (
    <AppContext.Provider
      value={{
        initialLoading,
        labelsReady,
        setLabelsReady,
        ignoreKeysRef,
        layout,
        setLayout,
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
        openSnackRef,
        setTooltipRef,
        setDialogInfoRef,
        showTooltip,
        hideTooltip,
        closeToolTip,
        focusedIndex,
        addButtonRef,
        setBindsOpenRef,
        notesStateRef,
        fadeNote,
        isOnline,
        setIsOnline,
        rootContainerRef,
        loadNextBatchRef,
        notesIndexMapRef,
        floatingBtnRef,
        breakpoint,
        skipLabelObjRefresh,
        isActionModalOpenRef,
        isContextMenuOpenRef,
        saveNewAvatar,
        clientID: clientID.current,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
