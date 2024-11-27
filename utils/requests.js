import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
import connectDB from "@/config/database";
import Note from "@/models/Note";

const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || null;

async function fetchNotes(userID) {
  try {
    if (!apiDomain || !userID) {
      return [];
    }
    const res = await fetch(`${apiDomain}/notes?userID=${userID}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }

    return res.json();
  } catch (error) {
    console.log(error);
    return [];
  }
}

export { fetchNotes };
