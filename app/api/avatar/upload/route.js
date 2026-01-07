import cloudinary from "@/config/cloudinary";
import connectDB from "@/config/database";
import { updateUserImageAction } from "@/utils/actions";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";
import sharp from "sharp";

const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const maxAvatarSizeBytes = 5 * 1024 * 1024; // 5MB
const minAvatarSize = 400;

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("file");

  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!userID) {
    return Response.json({ error: "Missing userID" }, { status: 400 });
  }
  const fileError = {
    error:
      "Can’t upload this image. Please choose a GIF, JPEG, JPG, or PNG under 5MB and at least 400×400 pixels.",
  };

  if (!acceptedTypes.includes(file.type)) {
    return fileError;
  }

  if (file.size > maxAvatarSizeBytes) {
    return fileError;
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (width < minAvatarSize || height < minAvatarSize) {
    return fileError;
  }

  const publicId = `avatars/${userID}`;

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

    await updateUserImageAction(newUrl);

    return Response.json({
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
  }
}
