// /api/reminder

import Note from "@/models/Note";

export async function POST(req) {
  const { noteId } = await req.json();

  console.log("REMINDERRRRRRRRRRRRRRRRRRRR")

  // Find note
//   const note = await Note.findById(noteId);

  // Send notification however you want
//   console.log(`Reminder: ${note.title}`);

  return Response.json({
    success: true,
  });
}
