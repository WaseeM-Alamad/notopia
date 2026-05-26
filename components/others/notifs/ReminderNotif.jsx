import BellIcon from "@/components/icons/BellIcon";
import { useAppContext } from "@/context/AppContext";
import { deleteNotification } from "@/utils/actions";
import handleServerCall from "@/utils/handleServerCall";
import React, { memo } from "react";
import Skeleton from "react-loading-skeleton";

const ReminderNotif = ({ notif, closeMenu }) => {
  const { notesStateRef, setDialogInfoRef, openSnackRef } = useAppContext();
  const isLoading = notif.skeleton;

  const onClick = () => {
    closeMenu();
    const event = new CustomEvent("deleteNotif", {
      detail: { id: notif._id },
    });
    window.dispatchEvent(event);
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

    handleServerCall(
      [() => deleteNotification(notif._id)],
      openSnackRef.current,
    );
  };

  return (
    <div onClick={onClick} className="notif-item-wrapper">
      <div
        style={isLoading ? { pointerEvents: "none" } : undefined}
        className="reminder-notif-item"
      >
        {!isLoading && !notif.read && <div className="notif-dot" />}

        {isLoading ? (
          <Skeleton circle width={30} height={30} />
        ) : (
          <BellIcon
            size={23}
            style={{
              flexShrink: 0,
              opacity: 0.9,
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            width: "100%",
          }}
        >
          {isLoading ? (
            <>
              <Skeleton height={14} width="85%" />
              <Skeleton height={14} width="60%" />
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
              <span style={{ fontWeight: "bold" }}>Reminder:</span>{" "}
              {notif.data?.title}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(ReminderNotif);
