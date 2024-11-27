import connectDB from "@/config/database";
import Note from "@/models/Note";

export const PATCH = async (request) => {
  try {
    await connectDB();

    const formData = await request.formData();
    const selectedNotesIDs = formData.get("selectedNotesIDs").split(","); // Assuming IDs are sent as comma-separated string

    // Validate that all notes exist
    const existingNotes = await Note.find({ uuid: { $in: selectedNotesIDs } });
    
    if (existingNotes.length !== selectedNotesIDs.length) {
      return new Response("Some notes do not exist", { status: 404 });
    }

    // Get values from formData
    const updatedFields = {};
    
    // Only include fields that are actually present in formData
    if (formData.has("color")) updatedFields.color = formData.get("color");
    if (formData.has("isPinned")) updatedFields.isPinned = formData.get("isPinned") === "true";
    if (formData.has("isArchived")) updatedFields.isArchived = formData.get("isArchived")

    console.log("Updated fields: ", updatedFields);

    // Update all notes
    await Note.updateMany(
      { uuid: { $in: selectedNotesIDs } },
      { $set: updatedFields }
    );

    return new Response(
      JSON.stringify({
        message: `Successfully updated ${existingNotes.length} notes!`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in batch update:", error);
    return new Response("Failed to update notes", { status: 500 });
  }
};