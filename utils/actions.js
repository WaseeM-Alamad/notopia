"use server";
import connectDB from "@/config/database";
import Note from "@/models/Note";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
import { createClient } from "@supabase/supabase-js";

const session = await getServerSession(authOptions);
const userID = session?.user?.id;

export const fetchNotes = async () => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectDB();
    const notes = await Note.find({ creator: userID }).sort({ createdAt: -1 });
    const user = await User.findById(userID);
    const order = user.notesOrder;
    // Manually serialize the MongoDB-specific fields
    const serializedNotes = notes.map((note) => ({
      _id: note._id.toString(), // Convert ObjectId to string
      uuid: note.uuid,
      title: note.title,
      content: note.content,
      color: note.color,
      labels: note.labels,
      isPinned: note.isPinned,
      isArchived: note.isArchived,
      isTrash: note.isTrash,
      images: Array.isArray(note.images)
        ? note.images.map((image) => ({
            url: image.url,
            uuid: image.uuid,
          }))
        : [],
      position: note.position,
      createdAt: note.createdAt.toISOString(), // If it's a Date, convert to string
      updatedAt: note.updatedAt.toISOString(),
      __v: note.__v,
    }));

    return {
      success: true,
      status: 200,
      data: serializedNotes,
      order: order,
    };
  } catch (error) {
    console.log("Error fetching notes:", error);
    return new Response("Failed to fetch notes", { status: 500 });
  }
};

export const createNoteAction = async (note) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const starter =
    "https://fopkycgspstkfctmhyyq.supabase.co/storage/v1/object/public/notopia";
  const images = note.images.map((image) => ({
    url: `${starter}/${userID}/${note.uuid}/${image.uuid}`,
    uuid: image.uuid,
  }));
  try {
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }
    await connectDB();
    const user = await User.findById(userID);
    const noteData = {
      ...note,
      images: images,
      creator: userID,
    };
    const newNote = new Note(noteData);
    await newNote.save();
    user.notes.push(newNote._id);
    user.notesOrder.unshift(newNote.uuid);

    await user.save();

    return {
      success: true,
      message: "Note added successfully!",
      status: 201,
    };
  } catch (error) {
    console.log("Error creating note:", error);
    return new Response("Failed to add note", { status: 500 });
  }
};

export const NoteUpdateAction = async (type, value, noteUUID, first) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();
    if (type === "images") {
      const updatedImages = await Note.findOneAndUpdate(
        { uuid: noteUUID },
        { $push: { images: value } },
        { returnDocument: "after" }
      );
      return JSON.parse(JSON.stringify(updatedImages.images));
    } else if (type === "isArchived") {
      await Note.updateOne(
        { uuid: noteUUID },
        { $set: { [type]: value, isPinned: false } }
      );
      if (!first) {
        const user = await User.findById(userID);
        const { notesOrder } = user;
        const order = notesOrder.filter((uuid) => uuid !== noteUUID);
        const updatedOrder = [noteUUID, ...order];
        user.notesOrder = updatedOrder;
        await user.save();
      }
    } else if (type === "pinArchived") {
      await Note.updateOne(
        { uuid: noteUUID },
        { $set: { isPinned: value, isArchived: false } }
      );
    } else if (type === "isPinned") {
      await Note.updateOne({ uuid: noteUUID }, { $set: { [type]: value } });
      if (!first) {
        const user = await User.findById(userID);
        const { notesOrder } = user;
        const order = notesOrder.filter((uuid) => uuid !== noteUUID);
        const updatedOrder = [noteUUID, ...order];
        user.notesOrder = updatedOrder;
        await user.save();
      }
    } else if (type === "isTrash") {
      await Note.updateOne(
        { uuid: noteUUID },
        { $set: { [type]: value, isPinned: false } }
      );
    } else {
      await Note.updateOne({ uuid: noteUUID }, { $set: { [type]: value } });
    }
  } catch (error) {
    console.log("Error updating note:", error);
    return new Response("Failed to update note", { status: 500 });
  }
};

export const NoteTextUpdateAction = async (values, noteUUID) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();

    await Note.updateOne(
      { uuid: noteUUID },
      { $set: { title: values.title, content: values.content } }
    );
  } catch (error) {
    console.log("Error updating note:", error);
    return new Response("Failed to update note", { status: 500 });
  }
};

export const NoteImageDeleteAction = async (filePath, noteUUID, imageID) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    await connectDB();
    await Note.updateOne(
      { uuid: noteUUID, "images.uuid": imageID }, // Make sure both the note's uuid and image's uuid are matched
      { $pull: { images: { uuid: imageID } } } // Remove the image with the specified uuid
    );
    await supabase.storage.from("notopia").remove([filePath]);
  } catch (error) {
    console.log("Error removing note.", error);
  }
};

export const DeleteNoteAction = async (noteUUID) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    await connectDB();
    const note = await Note.findOne({ uuid: noteUUID });
    await User.updateOne(
      { _id: userID },
      { $pull: { notes: note._id, notesOrder: noteUUID } }
    );
    const result = await Note.deleteOne({ uuid: noteUUID });
    if (result.deletedCount === 0) {
      return { success: false, message: "Note not found" };
    }

    if (note.images.length !== 0) {
      const folderPath = `${userID}/${noteUUID}/`;
      const bucketName = "notopia";
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list(folderPath);

      if (listError) {
        throw listError;
      }

      if (files.length === 0) {
        setMessage(`No files found in ${folderPath}`);
      }

      const filesToDelete = files.map((file) => `${folderPath}${file.name}`);
      await supabase.storage.from(bucketName).remove(filesToDelete);
    }

    return { success: true, message: "Note deleted successfully" };
  } catch (error) {
    console.log("Error deleting note.", error);
    return { success: false, message: "Error deleting note" };
  }
};

export const updateOrderAction = async (data) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(userID);
    const { notesOrder } = user;
    // console.log(user)

    if (data.type === "shift to start") {
      const order = notesOrder.filter((uuid) => uuid !== data.uuid);
      const updatedOrder = [data.uuid, ...order];
      user.notesOrder = updatedOrder;
    } else {
      const updatedOrder = [...notesOrder];
      const [draggedNote] = updatedOrder.splice(data.initialIndex, 1);
      updatedOrder.splice(data.endIndex, 0, draggedNote);

      user.notesOrder = updatedOrder;
    }
    await user.save();
  } catch (error) {
    console.log(error);
  }
};

export const undoAction = async (data) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(userID);
    const { notesOrder } = user;

    if (data.type === "undoArchive") {
      const { images, ...noteWithoutImages } = data.note;
      await Note.updateOne(
        { uuid: data.note.uuid },
        { $set: { ...noteWithoutImages, isArchived: data.note.isArchived } }
      );
      const updatedOrder = [...notesOrder];
      const [draggedNote] = updatedOrder.splice(data.initialIndex, 1);
      updatedOrder.splice(data.endIndex, 0, draggedNote);

      user.notesOrder = updatedOrder;
      await user.save();
    }
  } catch (error) {
    console.log(error);
  }
};
