import cloudinary from "@/config/cloudinary";
import connectDB from "@/config/database";
import Note from "@/models/Note";
import User from "@/models/User";
import UserSettings from "@/models/UserSettings";
import { startSession } from "mongoose";
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

    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const deletedImages = [];

    const trashedSettings = await UserSettings.find({
      isTrash: true,
      trashedAt: { $lte: threshold },
    }).select("note");

    const deletedUUIDs = trashedSettings.map((s) => s.note);

    const session = await startSession();
    await session.withTransaction(async () => {
      const deletedNotesData = (
        await Note.find(
          {
            uuid: { $in: deletedUUIDs },
          },
          {
            uuid: 1,
            creator: 1,
            _id: 0,
          },
        )
      ).map(({ uuid, creator }) => ({ uuid, creator: creator.toString() }));

      deletedNotesData.map(({ uuid, creator }) => {
        const filePath = `${creator}/${uuid}/`;
        deletedImages.push(filePath);
      });

      const userIds = await UserSettings.distinct("user", {
        note: { $in: deletedUUIDs },
      }).session(session);

      await Note.deleteMany({ uuid: { $in: deletedUUIDs } }).session(session);

      await UserSettings.deleteMany({
        note: { $in: deletedUUIDs },
      }).session(session);

      await User.updateMany(
        { _id: { $in: userIds } },
        {
          $pull: { notesOrder: { $in: deletedUUIDs } },
          $set: { orderLastModifiedBy: uuid() },
        },
      ).session(session);
    });

    session.endSession();

    if (deletedImages.length !== 0) {
      await Promise.all(
        deletedImages.map((path) => {
          return cloudinary.api.delete_resources_by_prefix(path);
        }),
      );
    }

    return Response.json({
      success: true,
      message: "Trash emptied successfully",
      deletedNotes: deletedUUIDs.length,
    });
  } catch (err) {
    console.error(err);

    return Response.json({ success: false }, { status: 500 });
  }
}
