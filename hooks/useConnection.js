import { useAppContext } from "@/context/AppContext";
import { syncOfflineUpdatesAction } from "@/utils/actions";
import handleServerCall from "@/utils/handleServerCall";
import {
  clearQueuedNotes,
  getQueue,
} from "@/utils/localDb";
import React, { useEffect } from "react";

export function useConnection() {
  const { openSnackRef, setIsOnline, user } = useAppContext();

  useEffect(() => {
    const handleOnline = async () => {
      await clearQueuedNotes(user?.id);
      return;
      const {syncOrder, QueuedNotes} = await getQueue(user?.id);
      console.log(QueuedNotes)
      // await handleServerCall(
      //   [() => syncOfflineUpdatesAction({ updatedNotes: queue })],
      //   openSnackRef.current
      // );
      await clearQueuedNotes(user?.id);
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
