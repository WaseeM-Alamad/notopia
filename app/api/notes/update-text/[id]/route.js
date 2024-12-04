import connectDB from "@/config/database";
import Note from "@/models/Note";

export const PATCH = async (request, { params }) => {
    try {
      await connectDB();
      const { id } = await params;
      const { title, content } = await request.json();

      const updatedNote = await Note.findByIdAndUpdate(
        id, 
        { title, content }, 
      );

      if (!updatedNote) {
        return new Response("Note not found", { status: 404 });
      }

      return new Response("Success", { status: 200 });
      
    } catch (error) {
      return new Response("Failed to update text", { status: 500 });
    }
  };