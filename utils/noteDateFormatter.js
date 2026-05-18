import { format } from "date-fns";

export const getNoteFormattedDate = (recievedDate) => {
  if (!recievedDate) return;
  const currentDate = new Date();
  const noteYear = new Date(recievedDate).getFullYear();
  const noteDay = new Date(recievedDate).getDate();
  let formattedDate;
  if (noteYear === currentDate.getFullYear()) {
    if (noteDay === currentDate.getDate()) {
      formattedDate = format(new Date(recievedDate), "h:mm a");
    } else if (noteDay === currentDate.getDate() - 1) {
      formattedDate = format(new Date(recievedDate), " 'Yesterday, 'h:mm a");
    } else {
      formattedDate = format(new Date(recievedDate), `MMM dd`);
    }
  } else {
    formattedDate = format(new Date(recievedDate), `MMM yyyy`);
  }

  return formattedDate;
};
