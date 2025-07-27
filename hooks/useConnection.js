import { useAppContext } from "@/context/AppContext";
import React, { useEffect } from "react";

export function useConnection() {
  const { openSnackRef, isOnline, setIsOnline } = useAppContext();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      openSnackRef.current({
        snackMessage: (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="internet-icon" />
            <span>You're back online</span>
          </div>
        ),
        showUndo: false,
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      openSnackRef.current({
        snackMessage: (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="no-internet-icon" />
            <span>You are currently offline</span>
          </div>
        ),
        showUndo: false,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
}
