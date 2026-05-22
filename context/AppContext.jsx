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
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";
import Button from "@/components/Tools/Button";
import BellIcon from "@/components/icons/BellIcon";

const AppContext = createContext();

export function AppProvider({ children, initialUser }) {
  const { data: session, status } = useSession();
  const { permission, subscribe } = usePushNotifications();
  const { filters, setFilters, setSearchTerm } = useSearch();
  const [user, setUser] = useState(initialUser);
  const [currentSection, setCurrentSection] = useState(null);
  const [loadingImages, setLoadingImages] = useState(new Set());
  const [labelsReady, setLabelsReady] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  const [isOnline, setIsOnline] = useState(true);
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
  const notifAudioRef = useRef(null);
  const audioUnlockedRef = useRef(false);

  useEffect(() => {
    notifAudioRef.current = new Audio("/notification.wav");
  }, []);

  useEffect(() => {
    const handler = async () => {
      const audio = new Audio("/notification.wav");
      audio.volume = 0;
      try {
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
        audioUnlockedRef.current = true;
      } catch {}
    };
    document.addEventListener("click", handler, { once: true });
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    focusedIndex.current = null;
    if (currentSection?.toLowerCase() === "search") return;
    requestAnimationFrame(() => {
      setSearchTerm("");
      setIsFiltered(false);
      setFilters((prev) =>
        Object.fromEntries(Object.keys(prev).map((key) => [key, null])),
      );
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
    setIsFiltered(Object.values(filters).some((filter) => filter));
  }, [filters]);

  const tooltipTimeoutRef = useRef(null);

  const showTooltip = useCallback((e, text) => {
    if (!setTooltipRef.current) return;
    const target = e.currentTarget;
    clearTimeout(tooltipTimeoutRef.current);
    tooltipTimeoutRef.current = setTimeout(() => {
      if (!document.body.contains(target)) return;
      setTooltipRef.current((prev) => {
        const newMap = new Map(prev);
        newMap.set(target, text);
        return newMap;
      });
    }, 200);
  }, []);

  const hideTooltip = useCallback((e) => {
    if (!setTooltipRef.current) return;

    const target = e.currentTarget;
    clearTimeout(tooltipTimeoutRef.current);
    setTooltipRef.current((prev) => {
      const newMap = new Map(prev);
      newMap.delete(target);
      return newMap;
    });
  }, []);

  const closeToolTip = useCallback(() => {
    if (!setTooltipRef.current) return;
    setTooltipRef.current(new Map());
    clearTimeout(tooltipTimeoutRef.current);
  }, []);

  useEffect(() => {
    const handler = () => {
      requestAnimationFrame(() => {
        closeToolTip();
      });
    };

    document.addEventListener("pointerdown", handler, true);

    return () => {
      document.removeEventListener("pointerdown", handler, true);
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      closeToolTip();
    };

    window.addEventListener("blur", handler);

    return () => window.removeEventListener("blur", handler);
  }, []);

  useEffect(() => {
    if (status === "loading" && !user) {
      setInitialLoading(true);
    } else {
      setTimeout(() => {
        session?.user && setInitialLoading(false);
      }, 400);
    }
  }, [status]);

  useEffect(() => {
    if (initialLoading) {
      document.body.setAttribute("data-scroll-locked", "1");
    } else {
      document.body.removeAttribute("data-scroll-locked");
    }
  }, [initialLoading]);

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

  const enableNotifs = useCallback(() => {
    if (permission === "granted") return null;
    subscribe();
  }, []);

  function playNotification() {
    const audio = notifAudioRef.current;

    if (!audio || !audio.paused || !audioUnlockedRef.current) return;

    audio.currentTime = 0;
    audio.play();
  }

  const showReminderNotif = useCallback(({ title, body, uuid }) => {
    if (!uuid) return;
    const note = notesStateRef.current.notes.get(uuid);

    const validTitle = title ? title.slice(0, 100) : body.slice(0, 100);
    const longerThanLimit = title.length > 100;

    playNotification();

    toast.custom((t) => (
      <div
        onClick={() => {
          toast.dismiss(t);
          if (!note) return;
          const hash = window.location.hash.replace("#", "");
          if (!hash.toLowerCase().startsWith("note/")) {
            window.location.hash = `NOTE/${uuid}`;
          } else {
            window.open(
              `${process.env.NEXT_PUBLIC_DOMAIN}/#NOTE/${uuid}`,
              "_blank",
            );
          }
        }}
        className="notification"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          opacity=".75"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 10.7179V16.8718H19C19.5523 16.8718 20 17.331 20 17.8974C20 18.4639 19.5523 18.923 19 18.923H5C4.44772 18.923 4 18.4639 4 17.8974C4 17.331 4.44772 16.8718 5 16.8718H6V10.7179C6 7.55897 7.64 4.93333 10.5 4.2359V3.53846C10.5 2.68718 11.17 2 12 2C12.83 2 13.5 2.68718 13.5 3.53846V4.2359C16.37 4.93333 18 7.56923 18 10.7179ZM8 16.8718H16V10.7179C16 8.17436 14.49 6.10256 12 6.10256C9.51 6.10256 8 8.17436 8 10.7179V16.8718ZM14 19.9488C14 21.077 13.1 22 12 22C10.9 22 10 21.077 10 19.9488H14Z"
            fill="var(--text)"
          />
        </svg>
        <div className="notification-inner">
          <h4>Reminder</h4>
          <p>
            {validTitle} {longerThanLimit ? "..." : ""}
          </p>
        </div>

        <Button
          style={{ color: "var(--text)" }}
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(t);
          }}
        >
          ✕
        </Button>
      </div>
    ));
  }, []);

  return (
    <AppContext.Provider
      value={{
        setInitialLoading,
        initialLoading,
        labelsReady,
        setLabelsReady,
        ignoreKeysRef,
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
        isOnline,
        setIsOnline,
        rootContainerRef,
        loadNextBatchRef,
        notesIndexMapRef,
        floatingBtnRef,
        skipLabelObjRefresh,
        isActionModalOpenRef,
        isContextMenuOpenRef,
        saveNewAvatar,
        enableNotifs,
        showReminderNotif,
        clientID: clientID.current,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
