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

export const NoteUpdateAction = async (type, value, noteUUID) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();
    if (type === "images") {
      await Note.updateOne({ uuid: noteUUID }, { $push: { images: value } });
    } else if (type === "isArchived") {
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
  const starter =
    "https://fopkycgspstkfctmhyyq.supabase.co/storage/v1/object/public/notopia";
  try {
    await connectDB();
    const note = await Note.findOne({ uuid: noteUUID });
    await User.updateOne({ _id: userID }, { $pull: { notes: note._id } });
    const result = await Note.deleteOne({ uuid: noteUUID });
    if (result.deletedCount === 0) {
      return { success: false, message: "Note not found" };
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

    const updatedOrder = [...notesOrder];
    const [draggedNote] = updatedOrder.splice(data.initialIndex, 1);
    updatedOrder.splice(data.endIndex, 0, draggedNote);

    user.notesOrder = updatedOrder;

    await user.save();
  } catch (error) {
    console.log(error);
  }
};
