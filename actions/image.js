'use server';
import connectDB from "@/config/database";
import Note from "@/models/Note";

export const addImage = async (Noteuuid, url)=> {
    try {
        await connectDB();
  
        await Note.updateOne({ uuid: Noteuuid }, { $set: { image: url.publicUrl } });
      } catch (error) {
        console.log("Couldn't upload image to database");
      }
}
