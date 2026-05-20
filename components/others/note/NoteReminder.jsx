import { useAppContext } from "@/context/AppContext";
import { format } from "date-fns";
import React, { memo } from "react";

const NoteReminder = ({
  note,
  noteActions,
  setReminderOpen,
  setReminderAnchor,
  setLocalNote = null,
}) => {
  const { showTooltip, hideTooltip, setDialogInfoRef } = useAppContext();
  const reminder = note.reminder;
  const enabled = note?.reminder?.enabled;
  const repeat = note?.reminder?.rep?.toLowerCase();

  const formatDate = (date) => {
    if (!date) return;
    const currentDate = new Date();
    const noteYear = new Date(date).getFullYear();
    const noteDay = new Date(date).getDate();
    let formattedDate;
    if (noteYear === currentDate.getFullYear()) {
      if (noteDay === currentDate.getDate()) {
        formattedDate = format(new Date(date), "'Today, 'h:mm a");
      } else if (noteDay === currentDate.getDate() + 1) {
        formattedDate = format(new Date(date), " 'Tomorrow, 'h:mm a");
      } else {
        formattedDate = format(new Date(date), `MMM dd, h:mm a`);
      }
    } else {
      formattedDate = format(new Date(date), `MMM dd, YYY, h:mm a`);
    }
    return formattedDate;
  };

  const deleteReminder = () => {
    setDialogInfoRef.current({
      func: () =>
        noteActions({
          type: "DELETE_REMINDER",
          note: note,
          setLocalNote,
        }),
      title: "Delete reminder?",
      message: "You can add another reminder later.",
      btnMsg: "Delete",
    });
  };

  return (
    <div
      className={`note-reminder-container ${repeat !== "dnr" ? "repeat-reminder" : ""}`}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();

          const pageX = rect.left + window.pageXOffset;
          const pageY = rect.top + window.pageYOffset;

          const virtualAnchor = {
            getBoundingClientRect: () =>
              new DOMRect(
                pageX - window.pageXOffset,
                pageY - window.pageYOffset,
                rect.width,
                rect.height,
              ),
            contextElement: document.body,
          };

          setReminderAnchor({
            ...virtualAnchor,
            btnRef: e.target,
          });
          setReminderOpen((prev) => !prev);
        }}
        className="label-wrapper label-wrapper-h"
        style={!enabled ? { opacity: 0.7 } : undefined}
      >
        <div
          className={enabled ? "reminder-active-icon" : "double-check-icon"}
          style={{
            width: "17px",
            height: "20px",
            marginRight: "4px",
          }}
        />
        <div
          onClick={(e) => {
            e.stopPropagation();
            deleteReminder();
          }}
          onMouseEnter={(e) => showTooltip(e, "Delete reminder")}
          onMouseLeave={hideTooltip}
          className="remove-label"
        />

        <label className="note-label">{formatDate(reminder.date)}</label>
        {repeat !== "dnr" && (
          <div
            className="repeat-icon"
            style={{
              marginLeft: ".5rem",
              width: "17px",
              height: "20px",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default memo(NoteReminder);
