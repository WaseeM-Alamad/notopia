import { createClient } from "@supabase/supabase-js";
import removeImage from "./removeImage";

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Upload file using standard upload
export default async function replaceImage(
  event,
  Noteuuid,
  userID,
  image,
  setIsPending,
  setIsLoading
) {
  setIsPending(true);
  setIsLoading(true);
  const file = event.target?.files[0];
  const filePath = `${userID}/${Noteuuid}`;
  if (image) {
    console.log("HIIIIIIII WAS");
    await removeImage(filePath);
  }
  const { data, error } = await supabase.storage
    .from("notopia")
    .upload(filePath, file);
  if (error) {
    // Handle error
  } else {
    setIsPending(false);
    setIsLoading(false);
    // const { data: url } = supabase.storage
    //   .from("notopia")
    //   .getPublicUrl(filePath);
    // await addImage(Noteuuid, url);
  }
}
