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
) {
  console.log(Noteuuid);
  const file = event.target?.files[0];
  const fileExt = file?.name.split(".").pop();
  const filePath = `${userID}/${Noteuuid}.${fileExt}`;
  const { data, error } = await supabase.storage
    .from("notopia")
    .upload(filePath, file);
  if (error) {
    // Handle error
  } else {
    const { data: url } = supabase.storage.from("notopia").getPublicUrl(filePath);
    addImage(Noteuuid, url)
  }
}
