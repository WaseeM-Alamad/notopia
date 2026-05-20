// app/api/trash-cleanup/route.js

import connectDB from "@/config/database";
import Note from "@/models/Note";
import UserSettings from "@/models/UserSettings";

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization");

    console.log('SECRETTTTTTTTTTTTT', process.env.CRON_SECRET);

    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const threshold = new Date(
      Date.now() - 5 * 60 * 1000, // testing (5 min)
    );

    const trashedSettings = await UserSettings.find({
      isTrash: true,
      trashedAt: { $lte: threshold },
    }).select("note");

    const noteIds = trashedSettings.map((s) => s.note);

    await Note.deleteMany({
      uuid: { $in: noteIds },
    });

    await UserSettings.deleteMany({
      note: { $in: noteIds },
    });

    return Response.json({
      success: true,
      deletedNotes: noteIds.length,
    });
  } catch (err) {
    console.error(err);

    return Response.json({ success: false }, { status: 500 });
  }
}
