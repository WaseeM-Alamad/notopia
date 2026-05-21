// app/api/trash-cleanup/route.js

import connectDB from "@/config/database";
import UserSettings from "@/models/UserSettings";
import { v4 as uuid } from "uuid";

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
        _id: 0,
      },
    ).lean();

    if (dueReminders.length === 0) {
      return Response.json({
        success: true,
        dueReminders: 0,
      });
    }

    const bulkOps = [];

    dueReminders.forEach((item) => {
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

      reminder = { ...reminder, date: newDate };

      bulkOps.push({
        updateOne: {
          filter: { note: item.note },
          update: {
            $set: {
              reminder: { ...reminder, enabled: !disableReminder },
              lastModifiedBy: uuid(),
            },
          },
        },
      });
    });

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
