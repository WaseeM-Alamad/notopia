"use client";
import handleServerCall from "@/utils/handleServerCall";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAppContext } from "./AppContext";
import { fetchNotifsAction } from "@/utils/actions";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifsMap, setNotifsMap] = useState(new Map());

  const fetchNotifs = async (setIsLoading = () => {}) => {
    const data = await fetchNotifsAction();
    const notifs = data.notifs;
    if (data.success) {
      setNotifsMap(new Map(notifs.map((notif) => [notif._id, notif])));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const handler = (e) => {
      const notifId = e.detail.id;
      setNotifsMap((prev) => {
        const newMap = new Map(prev);
        newMap.delete(notifId);
        return newMap;
      });
    };

    window.addEventListener("deleteNotif", handler);
    return () => window.removeEventListener("deleteNotif", handler);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifsMap,
        setNotifsMap,
        fetchNotifs,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifs = () => useContext(NotificationContext);
