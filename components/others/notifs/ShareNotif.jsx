import BellIcon from "@/components/icons/BellIcon";
import { useAppContext } from "@/context/AppContext";
import { useNotifs } from "@/context/NotificationContext";
import { deleteNotification, markNotifAsRead } from "@/utils/actions";
import handleServerCall from "@/utils/handleServerCall";
import { formatNotificationDate } from "@/utils/notifDateFormatter";
import React, { memo } from "react";
import Skeleton from "react-loading-skeleton";

const shareNotif = ({ notif, closeMenu }) => {
  const { notesStateRef, setDialogInfoRef, openSnackRef, clientID } =
    useAppContext();
  const { setNotifsMap } = useNotifs();
  const isLoading = notif.skeleton;
  const notifId = notif._id;

  const onClick = () => {
    closeMenu();
    const noteUUID = notif?.data?.uuid;
    if (!noteUUID) return;
    const note = notesStateRef.current.notes.get(noteUUID);
    if (note !== undefined) {
      window.location.hash = `NOTE/${noteUUID}`;
    } else {
      setDialogInfoRef.current({
        func: () => window.location.replace("#home"),
        title: "Note not found",
        message:
          "This note may have been deleted or you may not have permission to view it.",
        btnMsg: "Okay",
        cancelFunc: () => window.location.replace("#home"),
        closeFunc: () => window.location.replace("#home"),
      });
    }
    if (!notif.read) {
      handleServerCall(
        [() => markNotifAsRead(notifId, clientID)],
        openSnackRef.current,
      );
      setNotifsMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(notifId, { ...notif, read: true });
        return newMap;
      });
    }
  };

  const deleteNotif = (e) => {
    e.stopPropagation();
    handleServerCall(
      [() => deleteNotification(notifId, clientID)],
      openSnackRef.current,
    );
    setNotifsMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(notifId);
      return newMap;
    });
  };

  return (
    <div
      onClick={onClick}
      className={`notif-item-wrapper ${!notif.read ? "unread-notif" : ""}`}
    >
      <div
        style={isLoading ? { pointerEvents: "none" } : undefined}
        className="reminder-notif-item"
      >
        {!isLoading && !notif.read && <div className="notif-dot" />}
        <div
          onClick={deleteNotif}
          className="clear-icon small-btn btn notif-del"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />

        {isLoading ? (
          <Skeleton circle width={30} height={30} />
        ) : (
          <img
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: "solid 1px var(--border)",
            }}
            src={notif?.data?.image}
          />
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.1rem",
            minWidth: 0,
            width: "100%",
          }}
        >
          {isLoading ? (
            <>
              <Skeleton height={14} width="85%" />
            </>
          ) : (
            <span
              style={{
                display: "-webkit-box",
                overflow: "hidden",
                textOverflow: "ellipsis",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              <span style={{ fontWeight: "600" }}>{notif?.data?.username}</span>{" "}
              has shared a note with you!
            </span>
          )}

          {isLoading ? (
            <Skeleton height={10} width="20%" />
          ) : (
            <div style={{ color: "var(--text3)", fontSize: ".75rem" }}>
              {formatNotificationDate(notif.createdAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(shareNotif);
