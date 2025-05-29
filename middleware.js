import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt"; // Using the getToken helper to check if a user is authenticated

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const url = req.url;

  // Redirect unauthenticated users to the login page when trying to access /home
  if (url.includes("/main") && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect authenticated users away from the login page
  if (url.includes("/login") && token) {
    return NextResponse.redirect(new URL("/main", req.url));
  }

  // Allow the request to proceed for other routes
  return NextResponse.next();
}

export const config = {
  matcher: ["/main", "/login"], // Apply the middleware to these routes
};