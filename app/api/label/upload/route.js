import cloudinary from "@/config/cloudinary";
import connectDB from "@/config/database";
import { updateLabelAction } from "@/utils/actions";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";
import sharp from "sharp";

const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const maxSizeBytes = 10 * 1024 * 1024;
const maxMegapixels = 25;

export async function POST(req) {
  const formData = await req.formData();
  const labelUUID = formData.get("labelUUID");
  const file = formData.get("file");
  const clientID = formData.get("clientID");

  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!userID || !labelUUID) {
    return new Response("Missing userID or labelUUID", { status: 400 });
  }
  const fileError =
    "Can’t upload this file. We accept GIF, JPEG, JPG, PNG files less than 10MB and 25 megapixels.";

  if (!acceptedTypes.includes(file.type)) {
    return new Response(fileError, { status: 400 });
  }

  if (file.size > maxSizeBytes) {
    return new Response(fileError, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const metadata = await sharp(buffer).metadata();
  const megapixels =
    ((metadata.width || 0) * (metadata.height || 0)) / 1_000_000;

  if (megapixels > maxMegapixels) {
    return new Response(fileError, { status: 400 });
  }

  const publicId = `${userID}/labels/${labelUUID}`;

  try {
    await connectDB();

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            public_id: publicId,
            resource_type: "image",
            overwrite: true,
          },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    const newUrl = cloudinary.url(publicId, { version: result.version });

    await updateLabelAction({
      type: "image",
      uuid: labelUUID,
      imageURL: newUrl,
      clientID: clientID,
    });

    return Response.json({
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return new Response("Error uploading image", { status: 400 });
  }
}
