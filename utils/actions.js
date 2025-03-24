"use server";
import connectDB from "@/config/database";
import Note from "@/models/Note";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
import { v4 as uuid } from "uuid";
import { createClient } from "@supabase/supabase-js";

const session = await getServerSession(authOptions);
const userID = session?.user?.id;

export const fetchNotes = async () => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectDB();
    const notes = await Note.find({ creator: userID }).sort({ createdAt: -1 });
    const user = await User.findById(userID);
    const order = user.notesOrder;
    // Manually serialize the MongoDB-specific fields
    // const serializedNotes = notes.map((note) => ({
    //   _id: note._id.toString(), // Convert ObjectId to string
    //   uuid: note.uuid,
    //   title: note.title,
    //   content: note.content,
    //   color: note.color,
    //   labels: note.labels,
    //   isPinned: note.isPinned,
    //   isArchived: note.isArchived,
    //   isTrash: note.isTrash,
    //   images: Array.isArray(note.images)
    //     ? note.images.map((image) => ({
    //         url: image.url,
    //         uuid: image.uuid,
    //       }))
    //     : [],
    //   position: note.position,
    //   createdAt: note.createdAt.toISOString(), // If it's a Date, convert to string
    //   updatedAt: note.updatedAt.toISOString(),
    //   __v: note.__v,
    // }));

    return {
      success: true,
      status: 200,
      data: JSON.parse(JSON.stringify(notes)),
      order: order,
    };
  } catch (error) {
    console.log("Error fetching notes:", error);
    return new Response("Failed to fetch notes", { status: 500 });
  }
};

export const createNoteAction = async (note) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const starter =
    "https://fopkycgspstkfctmhyyq.supabase.co/storage/v1/object/public/notopia";
  const images = note.images.map((image) => ({
    url: `${starter}/${userID}/${note.uuid}/${image.uuid}`,
    uuid: image.uuid,
  }));
  try {
    await connectDB();
    const user = await User.findById(userID);
    const noteData = {
      ...note,
      images: images,
      creator: userID,
    };
    const newNote = new Note(noteData);
    await newNote.save();
    user.notes.push(newNote._id);
    user.notesOrder.unshift(newNote.uuid);

    await user.save();

    return {
      success: true,
      message: "Note added successfully!",
      status: 201,
    };
  } catch (error) {
    console.log("Error creating note:", error);
    return new Response("Failed to add note", { status: 500 });
  }
};

export const NoteUpdateAction = async (type, value, noteUUIDs, first) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();
    if (type === "images") {
      const updatedImages = await Note.findOneAndUpdate(
        { uuid: noteUUIDs[0] },
        { $push: { images: value } },
        { returnDocument: "after" }
      );
      return JSON.parse(JSON.stringify(updatedImages.images));
    } else if (type === "isArchived") {
      await Note.updateOne(
        { uuid: noteUUIDs[0] },
        { $set: { [type]: value, isPinned: false } }
      );
      if (!first) {
        const user = await User.findById(userID);
        const { notesOrder } = user;
        const order = notesOrder.filter((uuid) => uuid !== noteUUIDs[0]);
        const updatedOrder = [noteUUIDs[0], ...order];
        user.notesOrder = updatedOrder;
        await user.save();
      }
    } else if (type === "pinArchived") {
      await Note.updateOne(
        { uuid: noteUUIDs[0] },
        { $set: { isPinned: value, isArchived: false } }
      );
      const user = await User.findById(userID);
      const { notesOrder } = user;
      const order = notesOrder.filter((uuid) => uuid !== noteUUIDs[0]);
      const updatedOrder = [noteUUIDs[0], ...order];
      user.notesOrder = updatedOrder;
      await user.save();
    } else if (type === "isPinned") {
      await Note.updateOne({ uuid: noteUUIDs[0] }, { $set: { [type]: value } });
      if (!first) {
        const user = await User.findById(userID);
        const { notesOrder } = user;
        const order = notesOrder.filter((uuid) => uuid !== noteUUIDs[0]);
        const updatedOrder = [noteUUIDs[0], ...order];
        user.notesOrder = updatedOrder;
        await user.save();
      }
    } else if (type === "isTrash") {
      await Note.updateOne(
        { uuid: noteUUIDs[0] },
        { $set: { [type]: value, isPinned: false } }
      );
      const user = await User.findById(userID);
      const { notesOrder } = user;
      const order = notesOrder.filter((uuid) => uuid !== noteUUIDs[0]);
      const updatedOrder = [noteUUIDs[0], ...order];
      user.notesOrder = updatedOrder;
      await user.save();
    } else {
      await Note.updateMany(
        { uuid: { $in: noteUUIDs } },
        { $set: { [type]: value } }
      );
    }
  } catch (error) {
    console.log("Error updating note:", error);
    return new Response("Failed to update note", { status: 500 });
  }
};

export const batchUpdateAction = async (data) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    if (data.type === "BATCH_ARCHIVE") {
      await connectDB();
      const user = await User.findById(userID);
      const { notesOrder } = user;
      const updatedOrder = [...notesOrder];

      const sortedNotes = data.selectedNotes.sort((a, b) => b.index - a.index);
      const sortedUUIDs = [];

      sortedNotes.forEach((noteData) => {
        sortedUUIDs.push(noteData.uuid);
        updatedOrder.splice(noteData.index, 1);
      });

      updatedOrder.unshift(...sortedUUIDs);

      await Note.updateMany(
        { uuid: { $in: sortedUUIDs } },
        { $set: { isArchived: !data.val, isPinned: false } }
      );

      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "BATCH_PIN") {
      await connectDB();
      const user = await User.findById(userID);
      const { notesOrder } = user;
      const updatedOrder = [...notesOrder];

      const sortedNotes = data.selectedNotes.sort((a, b) => b.index - a.index);
      const sortedUUIDs = [];

      sortedNotes.forEach((noteData) => {
        sortedUUIDs.push(noteData.uuid);
        updatedOrder.splice(noteData.index, 1);
      });

      updatedOrder.unshift(...sortedUUIDs);

      await Note.updateMany(
        { uuid: { $in: sortedUUIDs } },
        { $set: { isPinned: !data.val, isArchived: false } }
      );

      user.notesOrder = updatedOrder;
      await user.save();
    }
  } catch (error) {
    console.log("Error updating note:", error);
    return new Response("Failed to update note", { status: 500 });
  }
};

export const NoteTextUpdateAction = async (values, noteUUID) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();

    await Note.updateOne(
      { uuid: noteUUID },
      { $set: { title: values.title, content: values.content } }
    );
  } catch (error) {
    console.log("Error updating note:", error);
    return new Response("Failed to update note", { status: 500 });
  }
};

export const NoteImageDeleteAction = async (filePath, noteUUID, imageID) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    await connectDB();
    await Note.updateOne(
      { uuid: noteUUID, "images.uuid": imageID }, // Make sure both the note's uuid and image's uuid are matched
      { $pull: { images: { uuid: imageID } } } // Remove the image with the specified uuid
    );
    await supabase.storage.from("notopia").remove([filePath]);
  } catch (error) {
    console.log("Error removing note.", error);
  }
};

export const DeleteNoteAction = async (noteUUID) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    await connectDB();
    const note = await Note.findOne({ uuid: noteUUID });
    await User.updateOne(
      { _id: userID },
      { $pull: { notes: note._id, notesOrder: noteUUID } }
    );
    const result = await Note.deleteOne({ uuid: noteUUID });
    if (result.deletedCount === 0) {
      return { success: false, message: "Note not found" };
    }

    if (note.labels.length > 0) {
      await User.updateOne(
        { _id: userID },
        {
          $inc: { "labels.$[elem].noteCount": -1 },
        },
        {
          arrayFilters: [
            { "elem.uuid": { $in: note.labels }, "elem.noteCount": { $gt: 0 } },
          ],
        }
      );
    }

    if (note.images.length !== 0) {
      const folderPath = `${userID}/${noteUUID}/`;
      const bucketName = "notopia";
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list(folderPath);

      if (listError) {
        throw listError;
      }

      const filesToDelete = files.map((file) => `${folderPath}${file.name}`);
      await supabase.storage.from(bucketName).remove(filesToDelete);
    }

    return { success: true, message: "Note deleted successfully" };
  } catch (error) {
    console.log("Error deleting note.", error);
    return { success: false, message: "Error deleting note" };
  }
};

export const emptyTrashAction = async () => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
  );
  try {
    await connectDB();

    const deletedNotes = await Note.find({ isTrash: true });
    let deletedUUIDs = [];
    let deletedIDs = [];
    let deletedLabels = [];
    let deletedImages = [];

    deletedNotes.map((note) => {
      deletedIDs.push(note._id);
      deletedUUIDs.push(note.uuid);
      deletedLabels.push(...note.labels);
      note.images.map((imageData) => {
        const filePath = `${userID}/${note.uuid}/${imageData.uuid}`;
        deletedImages.push(filePath);
      });
    });

    const labelCountsMap = deletedLabels.reduce((acc, label) => {
      acc[label] = acc[label] ? acc[label] + 1 : 1;
      return acc;
    }, {});

    const bulkOperations = [
      {
        updateOne: {
          filter: { _id: userID },
          update: {
            $pull: {
              notesOrder: { $in: deletedUUIDs },
              notes: { $in: deletedIDs },
            },
          },
        },
      },
      ...Object.entries(labelCountsMap).map(([label, count]) => ({
        updateOne: {
          filter: { "labels.uuid": label },
          update: { $inc: { "labels.$.noteCount": -count } },
        },
      })),
    ];

    await Note.deleteMany({ isTrash: true });
    await User.bulkWrite(bulkOperations);

    if (deletedImages.length !== 0) {
      const bucketName = "notopia";
      await supabase.storage.from(bucketName).remove(deletedImages);
    }

    return { success: true, message: "Trash emptied successfully" };
  } catch (error) {
    console.log("Error deleting notes.", error);
    return { success: false, message: "Error deleting notes" };
  }
};

export const updateOrderAction = async (data) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(userID);
    const { notesOrder } = user;
    // console.log(user)

    if (data.type === "shift to start") {
      const order = notesOrder.filter((uuid) => uuid !== data.uuid);
      const updatedOrder = [data.uuid, ...order];
      user.notesOrder = updatedOrder;
    } else {
      const updatedOrder = [...notesOrder];
      const [draggedNote] = updatedOrder.splice(data.initialIndex, 1);
      updatedOrder.splice(data.endIndex, 0, draggedNote);

      user.notesOrder = updatedOrder;
    }
    await user.save();
  } catch (error) {
    console.log(error);
  }
};

export const undoAction = async (data) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(userID);
    const { notesOrder } = user;

    if (data.type === "UNDO_ARCHIVE") {
      await Note.updateOne(
        { uuid: data.noteUUID },
        { $set: { isArchived: data.value, isPinned: data.pin } }
      );
      const updatedOrder = [...notesOrder];
      const [targetedNote] = updatedOrder.splice(data.endIndex, 1);
      updatedOrder.splice(data.initialIndex, 0, targetedNote);

      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "UNDO_TRASH") {
      await Note.updateOne(
        { uuid: data.noteUUID },
        { $set: { isTrash: data.value } }
      );
      const updatedOrder = [...notesOrder];
      const [targetedNote] = updatedOrder.splice(data.endIndex, 1);
      updatedOrder.splice(data.initialIndex, 0, targetedNote);

      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "UNDO_PIN_ARCHIVED") {
      await Note.updateOne(
        { uuid: data.noteUUID },
        { $set: { isPinned: false, isArchived: true } }
      );
      const updatedOrder = [...notesOrder];
      const [targetedNote] = updatedOrder.splice(data.endIndex, 1);
      updatedOrder.splice(data.initialIndex, 0, targetedNote);

      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "UNDO_COPY") {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
      );

      const note = await Note.findOne({ uuid: data.noteUUID });
      await User.updateOne(
        { _id: userID },
        { $pull: { notes: note._id, notesOrder: data.noteUUID } }
      );
      const result = await Note.deleteOne({ uuid: data.noteUUID });
      if (result.deletedCount === 0) {
        return { success: false, message: "Note not found" };
      }

      if (data.isImages) {
        const folderPath = `${userID}/${data.noteUUID}/`;
        const bucketName = "notopia";
        const { data: files, error: listError } = await supabase.storage
          .from(bucketName)
          .list(folderPath);

        if (listError) {
          throw listError;
        }

        const filesToDelete = files.map((file) => `${folderPath}${file.name}`);
        await supabase.storage.from(bucketName).remove(filesToDelete);
      }
    } else if (data.type === "UNDO_BATCH_ARCHIVE") {
      const updatedOrder = notesOrder.slice(data.selectedNotes.length);
      const sortedNotes = data.selectedNotes.sort((a, b) => a.index - b.index);
      let selectedUUIDs = [];
      const bulkOperations = [];

      sortedNotes.forEach((noteData) => {
        selectedUUIDs.push(noteData.uuid);
        updatedOrder.splice(noteData.index, 0, noteData.uuid);

        bulkOperations.push({
          updateOne: {
            filter: { uuid: noteData.uuid },
            update: {
              $set: { isArchived: data.val, isPinned: noteData.isPinned },
            },
          },
        });
      });

      await Note.bulkWrite(bulkOperations);
      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "UNDO_BATCH_PIN_ARCHIVED") {
      const updatedOrder = notesOrder.slice(data.selectedNotes.length);
      const sortedNotes = data.selectedNotes.sort((a, b) => a.index - b.index);
      let selectedUUIDs = [];

      sortedNotes.forEach((noteData) => {
        selectedUUIDs.push(noteData.uuid);
        updatedOrder.splice(noteData.index, 0, noteData.uuid);
      });

      await Note.updateMany(
        { uuid: { $in: selectedUUIDs } },
        { $set: { isArchived: true, isPinned: false } }
      );
      user.notesOrder = updatedOrder;
      await user.save();
    }
  } catch (error) {
    console.log(error);
  }
};

export const copyNoteAction = async (copiedNote, originalUUID) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const starter =
    "https://fopkycgspstkfctmhyyq.supabase.co/storage/v1/object/public/notopia";
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
    );
    await connectDB();
    const user = await User.findById(userID);
    const sourceFolder = `${userID}/${originalUUID}`;
    const destinationFolder = `${userID}/${copiedNote.uuid}`;
    let copiedImages = [];

    if (copiedNote.images.length !== 0) {
      for (let i = 0; i < copiedNote.images.length; i++) {
        const newUUID = uuid();
        const { error: copyError } = await supabase.storage
          .from("notopia")
          .copy(
            `${sourceFolder}/${copiedNote.images[i].uuid}`,
            `${destinationFolder}/${newUUID}`
          );
        if (copyError) throw copyError;
        const newImage = {
          url: `${starter}/${userID}/${copiedNote.uuid}/${newUUID}`,
          uuid: newUUID,
        };
        copiedImages.push(newImage);
      }
    }

    const noteData = {
      ...copiedNote,
      images: copiedImages,
      creator: userID,
    };
    const newNote = new Note(noteData);
    await newNote.save();
    user.notes.push(newNote._id);
    user.notesOrder.unshift(newNote.uuid);

    await user.save();

    return {
      success: true,
      message: "Note copied successfully!",
      status: 201,
    };
  } catch (error) {
    console.log("Error creating note:", error);
    return new Response("Failed to add note", { status: 500 });
  }
};

export const fetchLabelsAction = async () => {
  if (!session) {
    return { success: false, message: "Unauthorized", status: 401 };
  }
  try {
    await connectDB();

    const user = await User.findById(userID);
    const labels = JSON.parse(JSON.stringify(user?.labels));

    return {
      success: true,
      message: "Fetched labels successfully!",
      status: 201,
      data: labels,
    };
  } catch (error) {
    console.log(error);
  }
};

export const createLabelAction = async (newUUID, newLabel) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();

    if (newLabel.trim() === "") {
      return;
    }

    const user = await User.findById(userID);
    const labelExists = user.labels.some(
      (labelData) =>
        labelData.label.toLowerCase().trim() === newLabel.toLowerCase().trim()
    );

    if (labelExists) {
      return {
        success: false,
        message: "Label already exists.",
        status: 409,
      };
    }

    user.labels.push({ uuid: newUUID, label: newLabel });

    await user.save();

    return {
      success: true,
      message: "Label added successfully!",
      status: 201,
    };
  } catch (error) {
    console.log(error);
  }
};

export const addLabelAction = async (data) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();

    await Note.updateOne(
      { uuid: data.noteUUID },
      { $push: { labels: data.labelUUID } }
    );
  } catch (error) {
    console.log(error);
    return { message: "Failed to add label", status: 500 };
  }
};

export const removeLabelAction = async (data) => {
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();

    await Note.updateOne(
      { uuid: data.noteUUID },
      { $pull: { labels: data.labelUUID } }
    );
  } catch (error) {
    console.log(error);
    return { message: "Failed to remove label", status: 500 };
  }
};

export const updateLabelAction = async (data) => {
  if (!session) {
    return { success: false, message: "Unauthorized", status: 401 };
  }

  try {
    await connectDB();

    if (data.type === "color") {
      await User.findOneAndUpdate(
        { _id: userID, "labels.uuid": data.uuid },
        { $set: { "labels.$.color": data.color } }
      );

      return {
        success: true,
        message: "Label color updated successfully!",
        status: 201,
      };
    } else if (data.type === "title") {
      const user = await User.findById(userID);

      const labelExists = user.labels.some(
        (labelData) =>
          labelData.label.toLowerCase().trim() ===
          data.label.toLowerCase().trim()
      );

      if (labelExists) {
        return {
          success: false,
          message: "Label already exists.",
          status: 409,
        };
      }

      await User.findOneAndUpdate(
        { _id: userID, "labels.uuid": data.uuid },
        { $set: { "labels.$.label": data.label.trim() } }
      );

      return {
        success: true,
        message: "Label updated successfully!",
        status: 201,
      };
    } else if (data.type === "image") {
      await User.findOneAndUpdate(
        { _id: userID, "labels.uuid": data.uuid },
        { $set: { "labels.$.image": data.imageURL } }
      );

      return {
        success: true,
        message: "Label image updated successfully!",
        status: 201,
      };
    } else if (data.type === "delete_image") {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
      );

      await User.findOneAndUpdate(
        { _id: userID, "labels.uuid": data.uuid },
        { $set: { "labels.$.image": null } }
      );

      const filePath = `${userID}/labels/${data.uuid}`;

      await supabase.storage.from("notopia").remove([filePath]);

      return {
        success: true,
        message: "Label image deleted successfully!",
        status: 201,
      };
    } else if (data.type === "note_count") {
      const user = await User.findOne(
        { _id: userID, "labels.uuid": data.uuid },
        { "labels.$": 1 }
      );
      const noteCount = user.labels[0].noteCount ?? 0;

      const newNoteCount =
        data.operation === "decrement"
          ? noteCount > 0
            ? noteCount - 1
            : 0
          : noteCount + 1;

      await User.findOneAndUpdate(
        { _id: userID, "labels.uuid": data.uuid },
        { $set: { "labels.$.noteCount": newNoteCount } }
      );
      return {
        success: true,
        message: "Label note count updated successfully!",
        status: 201,
      };
    }
  } catch (error) {
    console.log(error);
    return { message: "Failed to update label", status: 500 };
  }
};

export const deleteLabelAction = async (data) => {
  if (!session) {
    return { success: false, message: "Unauthorized", status: 401 };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    await connectDB();

    await User.findOneAndUpdate(
      { _id: userID, "labels.uuid": data.labelUUID },
      { $pull: { labels: { uuid: data.labelUUID } } }
    );

    await Note.updateMany(
      { labels: data.labelUUID },
      { $pull: { labels: data.labelUUID } }
    );

    const filePath = `${userID}/labels/${data.labelUUID}`;
    await supabase.storage.from("notopia").remove([filePath]);

    return {
      success: true,
      message: "Label deleted and removed successfully!",
      status: 201,
    };
  } catch (error) {
    console.log(error);
    return { message: "Failed to delete label", status: 500 };
  }
};
