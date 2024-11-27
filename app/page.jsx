
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

const HomePage = async () => {
  const session = await getServerSession(authOptions);
  if (session) {
    return redirect("/home");
  }
  redirect("/login");
  
};

export default HomePage;
