import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  differenceInDays,
  format,
} from "date-fns";

export function formatNotificationDate(date) {
  if (!date) return "";
  const notificationDate = new Date(date);

  if (isToday(notificationDate)) {
    return formatDistanceToNow(notificationDate, {
      addSuffix: true,
    });
  }

  if (isYesterday(notificationDate)) {
    return "Yesterday";
  }

  const daysAgo = differenceInDays(new Date(), notificationDate);

  if (daysAgo < 7) {
    return `${daysAgo}d ago`;
  }

  return format(notificationDate, "MMM d, yyyy");
}
