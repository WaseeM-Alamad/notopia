import { createClient } from "@supabase/supabase-js";
import { addImage } from "./image";

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Upload file using standard upload
export default async function uploadFile(
  event,
  userID,
  setIsPending,
  Noteuuid,
  setIsLoading
) {
  setIsLoading(true);
  setIsPending(true);
  const file = event.target?.files[0];
  const filePath = `${userID}/${Noteuuid}`;
  const { data, error } = await supabase.storage
    .from("notopia")
    .upload(filePath, file);
  if (error) {
    console.log("couldn't upload image: " + error);
  } else {
    
    setTimeout(() => {
      setIsLoading(false);  
    }, 700);
    setIsPending(false);
  }
}
