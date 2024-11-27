import Navbar from "@/components/Navbar";
import Notes from "@/components/Notes";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

async function getInitialNotes(userID, session) {
  if (!userID) {
    redirect("/login");
  }

  try {

    const apiUrl = process.env.NEXT_PUBLIC_API_DOMAIN;
    const headersList = await headers(); // Await headers
    const cookie = headersList.get("cookie");

    const res = await fetch(`${apiUrl}/notes?userID=${userID}`, {
      cache: "no-store",
      headers: {
        Cookie: cookie || "",
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      console.error("Failed to fetch:", res.status, await res.text());
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
}

const Home = async () => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  const initialNotes = await getInitialNotes(userID, session);
  const image = session?.user.image;
  const email = session?.user.email;
  const name = session?.user.name;

  return (
    <>
      <div style={{ paddingTop: "4.42rem" }}>
        <Notes initialNotes={initialNotes} suppressHydrationWarning />
      </div>
    </>
  );
};

export default Home;
