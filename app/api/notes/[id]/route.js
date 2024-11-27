import connectDB from "@/config/database";
import Note from "@/models/Note";

// GET /api/properties/:id
export const GET = async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;

    const note = await Note.findById(id);

    if (!note) return new Response("Note Not Found", { status: 404 });

    return new Response(JSON.stringify(note), { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response("Something Went Wrong", { status: 500 });
  }
};

export const PATCH = async (request, { params }) => {
  try {
    await connectDB();

    const { id } = await params;
    const formData = await request.formData();

    const existingNote = await Note.findById(id);

    if (!existingNote) {
      return new Response("Note does not exist", { status: 404 });
    }

    // Get values from formData
    const updatedFields = {
      title: formData.get("title") || existingNote.title,
      content: formData.get("content") || existingNote.content,
      color: formData.get("color") || existingNote.color,
      isPinned: formData.get("isPinned") || existingNote.isPinned,
      isArchived: formData.get("isArchived") || existingNote.isArchived,
      isTrash: formData.get("isTrash") || existingNote.isTrash,
    };

    // Update the note
    await Note.findByIdAndUpdate(id, updatedFields);

    return new Response(JSON.stringify({ message: "Note added successfully!" }), { status: 201 });
  } catch (error) {
    return new Response("Failed to update note", { status: 500 });
  }
};
