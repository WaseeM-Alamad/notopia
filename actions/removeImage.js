"use server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
);

const deleteNote = async (filePath) => {
  try {
    await supabase.storage.from("notopia").remove([filePath]);
  } catch (error) {
    console.log("Error removing note.", error);
  }
};

export default deleteNote;
