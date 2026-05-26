// app/api/check-reminders/route.js

import connectDB from "@/config/database";
import UserSettings from "@/models/UserSettings";
import { v4 as uuid } from "uuid";
import webpush from "web-push";
import PushSubscription from "@/models/PushSubscription";
import Note from "@/models/Note";
import Notification from "@/models/Notification";

webpush.setVapidDetails(
  process.env.VAPID_MAILTO,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization");

    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const now = new Date();

    const dueReminders = await UserSettings.find(
      {
        "reminder.enabled": true,
        "reminder.date": { $lte: now },
      },
      {
        note: 1,
        reminder: 1,
        user: 1,
        _id: 0,
      },
    )
      .populate({
        path: "note",
        select: "uuid title content -_id",
      })
      .lean();

    if (dueReminders.length === 0) {
      return Response.json({
        success: true,
        dueReminders: 0,
      });
    }

    const bulkOps = [];

    for (const item of dueReminders) {
      let reminder = item.reminder;
      const newDate = reminder.date;
      const rep = reminder.rep;
      const disableReminder = rep === "DNR";

      if (rep === "daily") {
        newDate.setDate(newDate.getDate() + 1);
      } else if (rep === "weekly") {
        newDate.setDate(newDate.getDate() + 7);
      } else if (rep === "monthly") {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (rep === "yearly") {
        newDate.setFullYear(newDate.getFullYear() + 1);
      }

      const pushSubs = await PushSubscription.find({ userId: item.user });

      await Promise.all(
        pushSubs.map(async (pushSub) => {
          try {
            await webpush.sendNotification(
              pushSub.subscription,
              JSON.stringify({
                title: item.note.title.slice(0, 100) || "Reminder",
                body: item.note.content?.slice(0, 100) || "You have a reminder",
                url: `/#NOTE/${item.note.uuid}`,
              }),
            );
          } catch (err) {
            if (err.statusCode === 410) {
              await PushSubscription.deleteOne({ _id: pushSub._id });
            }
          }
        }),
      );

      await Notification.create({
        user: item.user,
        type: "reminder",
        data: {
          title: item.note.title,
          body: item.note.content,
          uuid: item.note.uuid,
        },
      });

      reminder = { ...reminder, date: newDate };

      bulkOps.push({
        updateOne: {
          filter: { note: item.note.uuid },
          update: {
            $set: {
              reminder: { ...reminder, enabled: !disableReminder },
              lastModifiedBy: uuid(),
            },
          },
        },
      });
    }

    await UserSettings.bulkWrite(bulkOps);

    return Response.json({
      success: true,
      dueReminders: dueReminders.length,
    });
  } catch (err) {
    console.error(err);

    return Response.json({ success: false }, { status: 500 });
  }
}
