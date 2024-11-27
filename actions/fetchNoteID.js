"use server";
import connectDB from "@/config/database";
import Note from "@/models/Note";

export default async function fetchNoteID(Noteuuid) {
  try {
    await connectDB();

    const note = await Note.findOne({ uuid: Noteuuid });
    const noteID = JSON.stringify(note._id);
    console.log("noteID: " + noteID);
    return noteID;
  } catch (error) {
    console.log("Couldn't fetch note ID: " + error);
  }
}
