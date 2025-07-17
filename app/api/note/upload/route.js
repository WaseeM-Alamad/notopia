import cloudinary from "@/config/cloudinary";
import connectDB from "@/config/database";
import { NoteUpdateAction } from "@/utils/actions";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";
import sharp from "sharp";

const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const maxSizeBytes = 10 * 1024 * 1024;
const maxMegapixels = 25;

export async function POST(req) {
  const formData = await req.formData();
  const noteUUID = formData.get("noteUUID");
  const files = formData.getAll("files");
  const imageUUIDs = formData.getAll("imageUUIDs");

  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!userID || !noteUUID) {
    return Response.json(
      { error: "Missing userID or noteUUID" },
      { status: 400 }
    );
  }

  if (files.length !== imageUUIDs.length) {
    return Response.json(
      { error: "Mismatch between files and UUIDs" },
      { status: 400 }
    );
  }

  const uploadPromises = files.map(async (file, i) => {
    const imageUUID = imageUUIDs[i];

    const fileError = {
      error:
        "Can’t upload this file. We accept GIF, JPEG, JPG, PNG files less than 10MB and 25 megapixels.",
      uuid: imageUUID,
    };

    if (!acceptedTypes.includes(file.type)) {
      return fileError;
    }

    if (file.size > maxSizeBytes) {
      return fileError;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const metadata = await sharp(buffer).metadata();
    const megapixels =
      ((metadata.width || 0) * (metadata.height || 0)) / 1_000_000;

    if (megapixels > maxMegapixels) {
      return fileError;
    }

    const publicId = `${userID}/${noteUUID}/${imageUUID}`;

    try {
      await connectDB();

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { public_id: publicId, resource_type: "image" },
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          )
          .end(buffer);
      });

      const newUrl = cloudinary.url(publicId);

      await NoteUpdateAction({
        type: "images",
        value: {
          url: newUrl,
          uuid: imageUUID,
        },
        noteUUIDs: [noteUUID],
      });

      return {
        url: result.secure_url,
        uuid: imageUUID,
      };
    } catch (error) {
      console.error("Error uploading image:", error);
      return null; // or handle errors as you want
    }
  });

  const uploads = await Promise.all(uploadPromises);

  return Response.json(uploads);
}
