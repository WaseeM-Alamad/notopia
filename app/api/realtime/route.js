import connectDB from "@/config/database";
import Note from "@/models/Note";
import User from "@/models/User";
import UserSettings from "@/models/UserSettings";
import { authOptions } from "@/utils/authOptions";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";

export async function GET(request) {
  await connectDB();

  const url = new URL(request.url);
  const clientID = url.searchParams.get("clientID");

  const session = await getServerSession(authOptions);
  const userID = new mongoose.Types.ObjectId(session?.user?.id);
  const encoder = new TextEncoder();
  let noteBuffer = [];
  let latestOrderUpdate = null;
  let latestLabelsUpdate = null;

  const stream = new ReadableStream({
    start(controller) {
      // Notes change stream
      const noteStream = Note.collection.watch(
        [
          {
            $match: {
              operationType: { $in: ["update", "replace"] },
              $or: [
                { "fullDocument.creator": userID }, // user is creator
                { "fullDocument.collaborators.data": userID }, // user is a collaborator
              ],
            },
          },
        ],
        { fullDocument: "updateLookup" },
      );

      // User (order array) change stream
      const userStream = User.collection.watch(
        [
          {
            $match: {
              "documentKey._id": userID,
              operationType: "update",
            },
          },
        ],
        { fullDocument: "updateLookup" },
      );

      const settingsStream = UserSettings.collection.watch(
        [
          {
            $match: {
              operationType: { $in: ["insert", "update", "replace"] },
              $or: [
                { "fullDocument.user": userID }, // only the current user's settings
              ],
            },
          },
        ],
        { fullDocument: "updateLookup" },
      );

      settingsStream.on("change", async (change) => {
        if (change.fullDocument.lastModifiedBy === clientID) return;

        if (change.operationType === "insert") {
          const fullDoc = change?.fullDocument;
          if (!fullDoc?.note) return;
          const receivedNote = await UserSettings.findById(fullDoc._id)
            .populate({
              path: "note",
              populate: [
                {
                  path: "collaborators.data",
                  select: "displayName username image",
                },
                {
                  path: "creator",
                  select: "_id displayName username image",
                },
              ],
            })
            .lean();
          const { note, ...settings } = receivedNote;
          const newNote = { ...note, ...settings, _id: note._id };
          noteBuffer.push({
            type: "settings",
            operationType: change.operationType,
            documentId: change.documentKey._id,
            fullDocument: newNote,
          });
        } else {
          noteBuffer.push({
            type: "settings",
            operationType: change.operationType,
            documentId: change.documentKey._id,
            fullDocument: change?.fullDocument ?? null,
          });
        }
      });

      // Handle note changes
      noteStream.on("change", (change) => {
        if (change.fullDocument.lastModifiedBy === clientID) return;
        noteBuffer.push({
          type: "note",
          operationType: change.operationType,
          documentId: change.documentKey._id,
          fullDocument: change.fullDocument ?? null,
        });
      });

      // Handle order changes (overwrite instead of pushing)

      userStream.on("change", (change) => {
        const updatedFields = change.updateDescription.updatedFields;
        // Check if notesOrder changed
        if (
          updatedFields.notesOrder &&
          change.fullDocument.orderLastModifiedBy !== clientID
        ) {
          latestOrderUpdate = {
            type: "order",
            userId: change.documentKey._id,
            notesOrder: change.fullDocument.notesOrder,
          };
        }

        // Check if labels changed (top-level or nested)
        const labelsChanged =
          updatedFields.labels ||
          Object.keys(updatedFields).some((k) => k.startsWith("labels."));

        if (
          labelsChanged &&
          change.fullDocument.labelsLastModifiedBy !== clientID
        ) {
          latestLabelsUpdate = {
            type: "labels",
            userId: change.documentKey._id,
            labels: change.fullDocument.labels,
          };
        }
      });

      // Flush interval
      const flushInterval = setInterval(() => {
        if (noteBuffer.length > 0 || latestOrderUpdate || latestLabelsUpdate) {
          const payload = [];

          if (noteBuffer.length > 0) {
            payload.push(...noteBuffer);
            noteBuffer = [];
          }

          if (latestOrderUpdate) {
            payload.push(latestOrderUpdate);
            latestOrderUpdate = null;
          }

          if (latestLabelsUpdate) {
            payload.push(latestLabelsUpdate);
            latestLabelsUpdate = null;
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        }
      }, 1500);

      // Heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, 15000);

      // Error handling
      const handleError = (err) => {
        console.error("Change stream error:", err);
        controller.error(err);
      };

      noteStream.on("error", handleError);
      userStream.on("error", handleError);

      // Cleanup
      request.signal.addEventListener("abort", () => {
        clearInterval(flushInterval);
        clearInterval(heartbeat);
        noteStream.close();
        userStream.close();
        settingsStream.close();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
