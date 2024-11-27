"use server";
import connectDB from "@/config/database";
import Note from "@/models/Note";
import User from "@/models/User";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
);

const deleteNote = async (Noteuuid, userID) => {
  try {
    await connectDB();
    const note = await Note.findOne({ uuid: Noteuuid });
    const filePath = note.image.substring(note.image.indexOf("notopia/") + "notopia/".length );
    const noteID = note._id;
    await User.updateOne({ _id: userID }, { $pull: { notes: noteID } });

    const result = await Note.deleteOne({ uuid: Noteuuid });
    if (result.deletedCount === 0) {
      return { success: false, message: "Note not found" };
    }
    if (note.image) {
      await supabase.storage
        .from("notopia")
        .remove([filePath]);
    }

    return { success: true, message: "Note deleted successfully" };
  } catch (error) {
    console.log("Error deleting note.", error);
    return { success: false, message: "Error deleting note" };
  }
};

export default deleteNote;
