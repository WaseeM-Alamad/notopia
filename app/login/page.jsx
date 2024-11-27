'use client';
import { useSession, signIn, signOut } from "next-auth/react";
import { redirect } from "next/navigation";


export default function page() {
  const { data: session, status } = useSession();

  
  if (status === "authenticated") {
    redirect("/home");
  }
 
    return (
      <div>
        <h2>Please Login</h2>
        <button onClick={() => signIn("google") } >
          Sign In with Google
        </button>
      </div>
    )
  }

 


