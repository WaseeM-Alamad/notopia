import { format } from "date-fns";

export const getNoteFormattedDate = (createdAt) => {
  const currentDate = new Date();
  const noteYear = new Date(createdAt).getFullYear();
  const noteDay = new Date(createdAt).getDate();
  const FormattedDate =
    noteYear === currentDate.getFullYear()
      ? noteDay === currentDate.getDate()
        ? format(new Date(createdAt), "h:mm a")
        : format(new Date(createdAt), `MMM dd`)
      : format(new Date(createdAt), `MMM yyyy`);
      return FormattedDate;
};
