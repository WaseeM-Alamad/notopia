"use server";
import connectDB from "@/config/database";
import Note from "@/models/Note";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";

export const fetchNotes = async () => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectDB();
    const notes = await Note.find({ creator: userID }).sort({ createdAt: -1 });

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
      images: note.images,
      createdAt: note.createdAt.toISOString(), // If it's a Date, convert to string
      updatedAt: note.updatedAt.toISOString(),
      __v: note.__v,
    }));

    return {
      success: true,
      status: 200,
      data: serializedNotes,
    };
  } catch (error) {
    console.log("Error fetching notes:", error);
    return new Response("Failed to fetch notes", { status: 500 });
  }
};

export const createNoteAction = async (note) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  try {
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }
    await connectDB();
    const user = await User.findById(userID);
    const noteData = {
      ...note,
      creator: userID,
    };
    const newNote = new Note(noteData);
    await newNote.save();
    user.notes.push(newNote._id);

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
  try {
    await connectDB();

    await Note.updateOne({ uuid: noteUUID }, { $set: { [type]: value } });
  } catch (error) {
    console.log("Error updating note:", error);
    return new Response("Failed to update note", { status: 500 });
  }
};
