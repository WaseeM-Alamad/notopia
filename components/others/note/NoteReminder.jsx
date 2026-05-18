import { format } from "date-fns";
import React, { memo } from "react";

const NoteReminder = ({ note }) => {
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

  const reminder = note.reminder;

  return (
    <div className="note-reminder-container label-wrapper">
      {formatDate(reminder.date)}
    </div>
  );
};

export default memo(NoteReminder);
