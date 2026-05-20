import { useAppContext } from "@/context/AppContext";
import { format } from "date-fns";
import React, { memo } from "react";

const NoteReminder = ({ note, noteActions }) => {
  const { showTooltip, hideTooltip } = useAppContext();
  const reminder = note.reminder;

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
    noteActions({
      type: "DELETE_REMINDER",
      note: note,
    });
  };

  return (
    <div className="note-reminder-container">
      <div
        onClick={(e) => e.stopPropagation()}
        className="label-wrapper label-wrapper-h"
      >
        <div
          // double-check-icon
          className="reminder-active-icon"
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
      </div>
    </div>
  );
};

export default memo(NoteReminder);
