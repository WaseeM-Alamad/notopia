import { format } from "date-fns";

export const getNoteFormattedDate = (recievedDate) => {
  const currentDate = new Date();
  const noteYear = new Date(recievedDate).getFullYear();
  const noteDay = new Date(recievedDate).getDate();
  let FormattedDate;
  if (noteYear === currentDate.getFullYear()) {
    if (noteDay === currentDate.getDate()) {
      FormattedDate = format(new Date(recievedDate), "h:mm a");
    } else if (noteDay === currentDate.getDate() - 1) {
      FormattedDate = format(new Date(recievedDate), " 'yesterday, ' h:mm a");
    } else {
      FormattedDate = format(new Date(recievedDate), `MMM dd`);
    }
  } else {
    FormattedDate = format(new Date(recievedDate), `MMM yyyy`);
  }

  return FormattedDate;
};

// noteYear === currentDate.getFullYear()
//   ? noteDay === currentDate.getDate()
//     ? format(new Date(recievedDate), "h:mm a")
//     : format(new Date(recievedDate), `MMM dd`)
//   : format(new Date(recievedDate), `MMM yyyy`);
