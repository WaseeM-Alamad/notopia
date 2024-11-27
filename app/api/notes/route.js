import connectDB from "@/config/database";
import Note from "@/models/Note";
import User from "@/models/User";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth/next";



export const GET = async (request) => {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userID');

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!userId) {
      return new Response("User ID is required", { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId);

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const notes = await Note.find({ creator: userId });
    return new Response(JSON.stringify(notes), { status: 200 });
  } catch (error) {
    return new Response("Failed to fetch notes", { status: 500 });
  }
};

export const POST = async (request) => {
  const session = await getServerSession(authOptions);

  try {
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const formData = await request.formData();

    const noteData = {
      uuid: formData.get("uuid"),
      title: formData.get("titleInput"),
      content: formData.get("contentInput"),
      color: formData.get("color"),
      isPinned: formData.get("isPinned"),
      isArchived: formData.get("isArchived"),
      creator: user._id,
    };

    const newNote = new Note(noteData);
    user.notes.push(newNote._id);
    await newNote.save();
    await user.save();

    return new Response(
      JSON.stringify({ message: "Note added successfully!" }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating note:", error);
    return new Response("Failed to add note", { status: 500 });
  }
};
