"use server";
import connectDB from "@/config/database";
import Note from "@/models/Note";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
import { v4 as uuid } from "uuid";
import { Resend } from "resend";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import isEmail from "validator/lib/isEmail";
import cloudinary from "@/config/cloudinary";

const resend = new Resend(process.env.RESEND_API_KEY);

const hashPassword = async (plainPassowrd) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(plainPassowrd, saltRounds);
  return hashedPassword;
};

const isPasswordValid = (val) => {
  return (
    typeof val === "string" &&
    val.length >= 8 &&
    val.trim() === val &&
    /[a-z]/.test(val) &&
    /[A-Z]/.test(val) &&
    /[0-9]/.test(val) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(val)
  );
};

const isConfirmPasswordValid = (confirmPassword, originalPassword) => {
  return (
    typeof confirmPassword === "string" &&
    confirmPassword.trim() !== "" &&
    confirmPassword === originalPassword
  );
};

const isUsernameValid = (val) => {
  return (
    typeof val === "string" &&
    val.trim() === val &&
    val.length >= 3 &&
    val.length <= 30 &&
    /^\p{L}/u.test(val) &&
    !/[=<>\/"]/.test(val)
  );
};

const isEmailValid = (val) => {
  return typeof val === "string" && isEmail(val);
};

export const signUpAction = async (formData) => {
  try {
    await connectDB();
    const email = formData.get("email");
    const password = formData.get("password");
    const username = formData.get("username");

    if (!isEmailValid(email))
      return { success: false, type: "email", message: "Invalid email" };
    if (!isUsernameValid(username))
      return { success: false, type: "username", message: "Invalid username" };
    if (!isPasswordValid(password))
      return { success: false, type: "password", message: "Invalid password" };

    const hashedPassword = await hashPassword(password);
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const user = await User.findOne({ email: email });

    if (user) {
      return {
        success: false,
        type: "email",
        message: "Email is already registered",
      };
    }

    await User.create({
      email: email,
      username: username,
      password: hashedPassword,
      token: token,
      tokenExpDate: expiresAt,
    });

    // const link = `http://localhost:3000/auth/verify?token=${token}`;
    const link = `https://notopia.app/auth/verify?token=${token}`;

    await resend.emails.send({
      from: "Notopia <noreply@notopia.app>",
      to: email,
      subject: "Sign up to Notopia",
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h2>🔐 Sign in to Notopia</h2>
          <p>Click below to verify your email:</p>
          <a href="${link}" style="display:inline-block;background:#4F46E5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">Sign In</a>
          <p style="font-size:14px;color:#666;">This link expires in 10 minutes.</p>
        </div>
      `,
    });

    return {
      success: true,
      type: "email",
      message: "A verification link has been sent to your email",
    };
  } catch (error) {
    console.log("Couldn't sign up.", error);
    return {
      success: false,
      type: "email",
      message: "Error creating an account",
    };
  }
};

export const resetPasswordAction = async (formData, receivedToken) => {
  try {
    await connectDB();

    const password = formData.get("password");
    const confirmPass = formData.get("confirm-password");

    const user = await User.findOne({ resetToken: receivedToken }).select(
      "+password +resetTokenExpDate"
    );

    if (!user) {
      return { success: false, message: "Invalid or expired link" };
    }

    const isExpired =
      user.resetTokenExpDate && new Date(user.resetTokenExpDate) < new Date();
    if (isExpired) {
      return { success: false, message: "Reset link has expired" };
    }

    if (!isPasswordValid(password)) {
      return { success: false, message: "Weak or invalid password" };
    }

    if (!isConfirmPasswordValid(confirmPass, password)) {
      return { success: false, message: "Passwords do not match" };
    }

    if (user?.password) {
      const matchesExistingPass = await bcrypt.compare(password, user.password);
      if (matchesExistingPass)
        return {
          success: false,
          passExists: true,
          message: "New password matches existing password",
        };
    }

    const hashedPassword = await hashPassword(password);

    user.password = hashedPassword;
    user.token = null;
    user.tokenExpDate = null;
    user.resetToken = null;
    user.resetTokenExpDate = null;
    user.isVerified = true;

    await user.save();

    return { success: true, message: "Password has been updated successfully" };
  } catch (error) {
    console.log("Error resetting password", error);
    return { success: false, message: "Server error" };
  }
};

export const sendResetPassAction = async (receivedEmail) => {
  try {
    await connectDB();

    if (!isEmailValid(receivedEmail))
      return { success: false, type: "email", message: "Invalid email" };

    const user = await User.findOne({ email: receivedEmail }).select(
      "+password +resetTokenExpDate"
    );

    if (!user)
      return {
        success: false,
        type: "email",
        message: "No user with such email",
      };

    const isRecent = user.resetTokenExpDate > new Date();

    if (isRecent) {
      const timeLeft = Math.ceil(
        (user.resetTokenExpDate - new Date()) / 1000 / 60
      );
      const unit = timeLeft === 1 ? "minute" : "minutes";
      const message = `Reset password link has already been sent. Please try again in ${timeLeft} ${unit}`;
      return {
        success: false,
        type: "email",
        message: message,
      };
    }

    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await User.updateOne(
      { email: user.email },
      { $set: { resetToken: token, resetTokenExpDate: expiresAt } },
      { upsert: true }
    );

    // const link = `http://localhost:3000/auth/reset-password?token=${token}`;
    const link = `https://notopia.app/auth/reset-password?token=${token}`;

    await resend.emails.send({
      from: "Notopia <noreply@notopia.app>",
      to: user.email,
      subject: "Reset your Notopia password",
      html: `
        <div style="font-family: 'Segoe UI', Roboto, sans-serif; padding: 24px; background-color: #f9fafb; color: #111827;">
          <div style="max-width: 480px; margin: auto; background: white; padding: 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <h2 style="margin-bottom: 16px; font-size: 24px; color: #111827;">🔑 Reset your password</h2>
            <p style="margin-bottom: 24px; font-size: 16px;">
              We received a request to reset your Notopia password. Click the button below to proceed.
            </p>
            <a href="${link}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
              Reset Password
            </a>
          </div>
          <p style="text-align: center; margin-top: 32px; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} Notopia. All rights reserved.
          </p>
        </div>
      `,
    });

    return { success: true, message: "Reset link sent successfully" };
  } catch (error) {
    console.log("Couldn't send reset link", error);
    return {
      success: false,
      type: "email",
      message: "Something went wrong. Please try again.",
    };
  }
};

export const verifyTokenAction = async (receivedToken) => {
  try {
    await connectDB();

    const user = await User.findOne({ token: receivedToken }).select(
      "+tokenExpDate"
    );

    if (!user)
      return {
        success: false,
        status: 404,
        message: "User not found.",
      };

    const userTempEmail = user.tempEmail;

    let result = {
      success: false,
      status: 401,
      message: "Authorization link has expired",
    };

    if (user.tokenExpDate && new Date(user.tokenExpDate) > new Date()) {
      user.isVerified = true;
      result = { success: true, status: 200, message: "Email verified." };

      if (userTempEmail) {
        user.email = userTempEmail;
        user.tempEmail = null;
        result.email = userTempEmail;
      }

      user.token = null;
      user.tokenExpDate = null;
      await user.save();
    }

    return result;
  } catch (error) {
    console.log("Error verifying", error);
  }
};

export const verifyResetTokenAction = async (receivedToken) => {
  try {
    await connectDB();

    const user = await User.findOne({ resetToken: receivedToken }).select(
      "+resetTokenExpDate"
    );

    if (!user)
      return {
        success: false,
        status: 404,
        message: "User not found.",
      };

    let result = {
      success: false,
      status: 401,
      message: "Reset link has expired",
    };

    if (
      user.resetTokenExpDate &&
      new Date(user.resetTokenExpDate) > new Date()
    ) {
      result = { success: true, status: 200, message: "Email verified." };
    }

    return result;
  } catch (error) {
    console.log("Error verifying", error);
  }
};

export const updateUsernameAction = async (newUsername) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  try {
    if (!userID)
      return {
        success: false,
        message: "An error has occurred",
      };

    await connectDB();
    const user = await User.findOne({ _id: userID });

    if (user.username.trim() === newUsername)
      return {
        success: false,
        message: "New username cannot be the same as your current username",
      };

    if (!isUsernameValid(newUsername))
      return { success: false, message: "Invalid username" };

    user.username = newUsername;

    await user.save();

    return { success: true, message: "Username updated successfully" };
  } catch (error) {
    console.log("Error updating username", error);
    return { success: false, message: "Error updating username" };
  }
};

export const updatePasswordAction = async ({
  currentPass,
  newPass,
  confirmNewPass,
}) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  try {
    if (!userID)
      return {
        success: false,
        type: "current",
        message: "An error has occurred",
      };

    await connectDB();

    if (currentPass === newPass)
      return {
        success: false,
        type: "new",
        message: "New password cannot be the same as your current password",
      };

    if (!isPasswordValid(newPass)) {
      return { success: false, type: "new", message: "Invalid password" };
    }

    if (!isConfirmPasswordValid(confirmNewPass, newPass)) {
      return {
        success: false,
        type: "confirm",
        message: "Passwords do not match",
      };
    }

    const user = await User.findOne({ _id: userID }).select("+password");
    const dbPassowrd = user.password;

    if (!dbPassowrd)
      return {
        success: false,
        type: "current",
        message: "Incorrect password",
      };

    const isCurrentValid = await bcrypt.compare(currentPass, dbPassowrd);

    if (!isCurrentValid)
      return {
        success: false,
        type: "current",
        message: "Incorrect password",
      };

    const hashedPassword = await hashPassword(newPass);

    user.password = hashedPassword;

    await user.save();

    return {
      success: true,
      message: "Password updated successfully",
    };
  } catch (error) {
    console.log("Error updating password", error);
    return {
      success: false,
      type: "current",
      message: "An error has occurred",
    };
  }
};

export const emailNewEmailAction = async ({ password, newEmail }) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  try {

    await connectDB();

    if (!userID)
      return {
        success: false,
        type: "both",
        message: "An error has occurred",
      };

    if (!isEmailValid(newEmail))
      return {
        success: false,
        type: "email",
        message: "Invalid email",
      };

    const isEmailUsed = await User.findOne({
      $or: [{ email: newEmail }, { tempMail: newEmail }],
    });

    console.log("IS EMAIL USED", isEmailUsed)

    if (isEmailUsed)
      return {
        success: false,
        type: "email",
        message: "Email is already in use",
      };

    const user = await User.findOne({ _id: userID }).select(
      "+password +token +tokenExpDate"
    );

    if (user.email === newEmail) {
      return {
        success: false,
        type: "email",
        message: "New email cannot be the same as current email",
      };
    }

    const dbPassowrd = user.password;

    if (!dbPassowrd)
      return {
        success: false,
        type: "password",
        message: "Incorrect password",
      };

    const isValidPassword = await bcrypt.compare(password, dbPassowrd);

    if (!isValidPassword)
      return {
        success: false,
        type: "password",
        message: "Incorrect password",
      };

    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.token = token;
    user.tokenExpDate = expiresAt;
    user.tempEmail = newEmail;

    await user.save();

    const link = `http://localhost:3000/auth/verify?token=${token}`;
    // const link = `https://notopia.app/auth/verify?token=${token}`;

    await resend.emails.send({
      from: "Notopia <noreply@notopia.app>",
      to: newEmail,
      subject: "Verify your new Notopia email address",
      html: `
        <div style="font-family: 'Segoe UI', Roboto, sans-serif; padding: 24px; background-color: #f9fafb; color: #111827;">
          <div style="max-width: 480px; margin: auto; background: white; padding: 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <h2 style="margin-bottom: 16px; font-size: 24px; color: #111827;">📧 Verify your new email</h2>
            <p style="margin-bottom: 24px; font-size: 16px;">
              You requested to update your Notopia account with a new email address. Please click the button below to confirm.
            </p>
            <a href="${link}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
              Verify Email
            </a>
          </div>
          <p style="text-align: center; margin-top: 32px; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} Notopia. All rights reserved.
          </p>
        </div>
      `,
    });

    return {
      success: true,
      message: "Email sent to new email address successfully",
      tempEmail: newEmail,
    };
  } catch (error) {
    console.log("Couldn't send verification to new email", error);
    return {
      success: false,
      type: "both",
      message: "An error has occurred",
    };
  }
};

export const fetchNotes = async () => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectDB();
    const notes = await Note.find({ creator: userID }).sort({ createdAt: -1 });
    const user = await User.findById(userID);
    const order = user?.notesOrder || [];

    return {
      success: true,
      status: 200,
      data: JSON.parse(JSON.stringify(notes ?? [])),
      order: order,
    };
  } catch (error) {
    console.log("Error fetching notes:", error);
    return new Response("Failed to fetch notes", { status: 500 });
  }
};

export const createNoteAction = async (note) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectDB();
    const noteData = {
      ...note,
      images: [],
      creator: userID,
    };
    const newNote = new Note(noteData);

    await User.updateOne(
      { _id: userID },
      { $push: { notesOrder: { $each: [newNote.uuid], $position: 0 } } }
    );

    await newNote.save();

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

export const NoteUpdateAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();
    if (data.type === "images") {
      const updatedNote = await Note.findOneAndUpdate(
        { uuid: data.noteUUIDs[0], creator: userID },
        { $push: { images: data.value } },
        { returnDocument: "after" }
      );
      const updatedImage = updatedNote.images.find(
        (img) => img.uuid === data.value.uuid
      );
      return JSON.parse(JSON.stringify(updatedImage));
    } else if (data.type === "isArchived") {
      await Note.updateOne(
        { uuid: data.noteUUIDs[0], creator: userID },
        { $set: { [data.type]: data.value, isPinned: false } }
      );
      if (!data.first) {
        const user = await User.findById(userID);
        const { notesOrder } = user;
        const order = notesOrder.filter((uuid) => uuid !== data.noteUUIDs[0]);
        const updatedOrder = [data.noteUUIDs[0], ...order];
        user.notesOrder = updatedOrder;
        await user.save();
      }
    } else if (data.type === "pinArchived") {
      await Note.updateOne(
        { uuid: data.noteUUIDs[0], creator: userID },
        { $set: { isPinned: data.value, isArchived: false } }
      );
      const user = await User.findById(userID);
      const { notesOrder } = user;
      const order = notesOrder.filter((uuid) => uuid !== data.noteUUIDs[0]);
      const updatedOrder = [data.noteUUIDs[0], ...order];
      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "isPinned") {
      await Note.updateOne(
        { uuid: data.noteUUIDs[0], creator: userID },
        { $set: { [data.type]: data.value } }
      );
      if (!data.first) {
        const user = await User.findById(userID);
        const { notesOrder } = user;
        const order = notesOrder.filter((uuid) => uuid !== data.noteUUIDs[0]);
        const updatedOrder = [data.noteUUIDs[0], ...order];
        user.notesOrder = updatedOrder;
        await user.save();
      }
    } else if (data.type === "isTrash") {
      await Note.updateOne(
        { uuid: data.noteUUIDs[0], creator: userID },
        { $set: { [data.type]: data.value, isPinned: false } }
      );
      const user = await User.findById(userID);
      const { notesOrder } = user;
      const order = notesOrder.filter((uuid) => uuid !== data.noteUUIDs[0]);
      const updatedOrder = [data.noteUUIDs[0], ...order];
      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "checkboxes") {
      switch (data.operation) {
        case "ADD": {
          const checkbox = {
            ...data.value,
            content: data.value.content.trim(),
          };
          await Note.updateOne(
            { uuid: data.noteUUIDs[0], creator: userID },
            {
              $push: { checkboxes: checkbox },
              $set: { textUpdatedAt: new Date() },
            }
          );
          break;
        }
        case "MANAGE_COMPLETED": {
          await Note.updateOne(
            {
              uuid: data.noteUUIDs[0],
              "checkboxes.uuid": data.checkboxUUID,
              creator: userID,
            },
            {
              $set: {
                "checkboxes.$.isCompleted": data.value,
                textUpdatedAt: new Date(),
              },
            }
          );
          break;
        }
        case "DELETE_CHECKBOX": {
          await Note.updateOne(
            {
              uuid: data.noteUUIDs[0],
              creator: userID,
            },
            {
              $pull: {
                checkboxes: {
                  $or: [
                    { uuid: data.checkboxUUID },
                    { parent: data.checkboxUUID },
                  ],
                },
              },
              $set: { textUpdatedAt: new Date() },
            }
          );
          break;
        }
        case "DELETE_CHECKED": {
          await Note.updateOne(
            { uuid: data.noteUUIDs[0], creator: userID },
            {
              $pull: { checkboxes: { isCompleted: true } },
              $set: { textUpdatedAt: new Date() },
            }
          );
          break;
        }
        case "UNCHECK_ALL": {
          await Note.updateMany(
            { uuid: data.noteUUIDs[0], creator: userID },
            {
              $set: {
                "checkboxes.$[elem].isCompleted": false,
                textUpdatedAt: new Date(),
              },
            },
            { arrayFilters: [{ "elem.isCompleted": true }] }
          );
          break;
        }
        case "UPDATE_CONTENT": {
          await Note.updateOne(
            {
              uuid: data.noteUUIDs[0],
              "checkboxes.uuid": data.checkboxUUID,
              creator: userID,
            },
            {
              $set: {
                "checkboxes.$.content": data.value,
                textUpdatedAt: new Date(),
              },
            }
          );
          break;
        }
        case "UPDATE_ORDER-FAM": {
          const note = await Note.findOne({
            uuid: data.noteUUIDs[0],
            creator: userID,
          });
          const checkboxes = note.checkboxes;
          let filteredList = checkboxes;
          let parent;
          const children = [];

          let initialIndex;
          let overIndex;
          const overUUID = data.overItemUUID;

          if (data.reOrder) {
            filteredList = checkboxes.filter((cb, i) => {
              if (cb.uuid === data.parentUUID) {
                initialIndex = i;
                parent = cb;
                return false;
              }

              if (cb.uuid === overUUID) {
                overIndex = i;
              }

              if (cb.parent === data.parentUUID) {
                children.push(cb);
                return false;
              }

              return true;
            });

            const itemsToInsert = [parent, ...children];

            if (overIndex < initialIndex) {
              filteredList.splice(overIndex, 0, ...itemsToInsert);
            } else {
              filteredList.splice(
                overIndex - children.length,
                0,
                ...itemsToInsert
              );
            }
          }

          const newList = filteredList.map((currentItem, index) => {
            if (index === 0) {
              return { ...currentItem, parent: null };
            }
            if (data.updatedItems.has(currentItem.uuid)) {
              return {
                ...currentItem,
                parent: data.updatedItems.get(currentItem.uuid),
              };
            }

            return currentItem;
          });

          console.log(initialIndex, overIndex);
          note.textUpdatedAt = new Date();
          note.checkboxes = newList;
          await note.save();

          break;
        }
      }
    } else {
      await Note.updateMany(
        { uuid: { $in: data.noteUUIDs }, creator: userID },
        { $set: { [data.type]: data.value, textUpdatedAt: new Date() } }
      );
    }
  } catch (error) {
    console.log("Error updating note:", error);
    return new Response("Failed to update note", { status: 500 });
  }
};

export const batchUpdateAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    if (data.type === "BATCH_ARCHIVE/TRASH") {
      await connectDB();
      const user = await User.findById(userID);
      const { notesOrder } = user;

      const sortedNotes = data.selectedNotes.sort((a, b) => b.index - a.index);
      const sortedUUIDs = [];

      sortedNotes.forEach((noteData) => {
        sortedUUIDs.push(noteData.uuid);
        // updatedOrder.splice(noteData.index, 1);
      });

      const updatedOrder = notesOrder.filter(
        (uuid) => !sortedUUIDs.includes(uuid)
      );

      updatedOrder.unshift(...sortedUUIDs);

      await Note.updateMany(
        { uuid: { $in: sortedUUIDs }, creator: userID },
        { $set: { [data.property]: !data.val, isPinned: false } }
      );

      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "BATCH_PIN") {
      await connectDB();
      const user = await User.findById(userID);
      const { notesOrder } = user;

      const sortedNotes = data.selectedNotes.sort((a, b) => b.index - a.index);
      const sortedUUIDs = [];

      sortedNotes.forEach((noteData) => {
        sortedUUIDs.push(noteData.uuid);
      });

      const updatedOrder = notesOrder.filter(
        (uuid) => !sortedUUIDs.includes(uuid)
      );

      updatedOrder.unshift(...sortedUUIDs);

      await Note.updateMany(
        { uuid: { $in: sortedUUIDs }, creator: userID },
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
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();

    await Note.updateOne(
      { uuid: noteUUID, creator: userID },
      {
        $set: {
          title: values.title,
          content: values.content,
          textUpdatedAt: new Date(),
        },
      }
    );
  } catch (error) {
    console.log("Error updating note:", error);
    return new Response("Failed to update note", { status: 500 });
  }
};

export const NoteImageDeleteAction = async (filePath, noteUUID, imageID) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();
    await Note.updateOne(
      { uuid: noteUUID, "images.uuid": imageID, creator: userID },
      { $pull: { images: { uuid: imageID } } }
    );

    await cloudinary.uploader.destroy(filePath);
  } catch (error) {
    console.log("Error removing note.", error);
  }
};

export const DeleteNoteAction = async (noteUUID) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();
    const note = await Note.findOne({ uuid: noteUUID, creator: userID });
    await User.updateOne({ _id: userID }, { $pull: { notesOrder: noteUUID } });
    const result = await Note.deleteOne({ uuid: noteUUID, creator: userID });
    if (result.deletedCount === 0) {
      return { success: false, message: "Note not found" };
    }

    if (note.images.length !== 0) {
      const folderPath = `${userID}/${note.uuid}/`;
      await cloudinary.api.delete_resources_by_prefix(folderPath);
    }

    return { success: true, message: "Note deleted successfully" };
  } catch (error) {
    console.log("Error deleting note.", error);
    return { success: false, message: "Error deleting note" };
  }
};

export const emptyTrashAction = async () => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();

    const deletedNotes = await Note.find({ isTrash: true, creator: userID });
    let deletedUUIDs = [];
    let deletedImages = [];

    deletedNotes.map((note) => {
      deletedUUIDs.push(note.uuid);
      const filePath = `${userID}/${note.uuid}/`;
      deletedImages.push(filePath);
    });

    await Note.deleteMany({ isTrash: true, creator: userID });
    await User.updateOne(
      { _id: userID },
      {
        $pull: {
          notesOrder: { $in: deletedUUIDs },
        },
      }
    );

    if (deletedImages.length !== 0) {
      await Promise.all(
        deletedImages.map((path) => {
          return cloudinary.api.delete_resources_by_prefix(path);
        })
      );
    }

    return { success: true, message: "Trash emptied successfully" };
  } catch (error) {
    console.log("Error deleting notes.", error);
    return { success: false, message: "Error deleting notes" };
  }
};

export const updateOrderAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
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
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(userID);
    const { notesOrder } = user;

    if (data.type === "UNDO_ARCHIVE") {
      await Note.updateOne(
        { uuid: data.noteUUID, creator: userID },
        { $set: { isArchived: data.value, isPinned: data.pin } }
      );
      const updatedOrder = [...notesOrder];
      const [targetedNote] = updatedOrder.splice(data.endIndex, 1);
      updatedOrder.splice(data.initialIndex, 0, targetedNote);

      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "UNDO_TRASH") {
      await Note.updateOne(
        { uuid: data.noteUUID, creator: userID },
        { $set: { isTrash: data.value } }
      );
      const updatedOrder = [...notesOrder];
      const [targetedNote] = updatedOrder.splice(data.endIndex, 1);
      updatedOrder.splice(data.initialIndex, 0, targetedNote);

      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "UNDO_PIN_ARCHIVED") {
      await Note.updateOne(
        { uuid: data.noteUUID, creator: userID },
        { $set: { isPinned: false, isArchived: true } }
      );
      const updatedOrder = [...notesOrder];
      const [targetedNote] = updatedOrder.splice(data.endIndex, 1);
      updatedOrder.splice(data.initialIndex, 0, targetedNote);

      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "UNDO_COPY") {
      await User.updateOne(
        { _id: userID },
        { $pull: { notesOrder: data.noteUUID } }
      );

      const result = await Note.deleteOne({
        uuid: data.noteUUID,
        creator: userID,
      });
      if (result.deletedCount === 0) {
        return { success: false, message: "Note not found" };
      }

      if (data.isImages) {
        const folderPath = `${userID}/${data.noteUUID}/`;
        await cloudinary.api.delete_resources_by_prefix(folderPath);
      }
    } else if (data.type === "UNDO_BATCH_ARCHIVE/TRASH") {
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
              $set: { [data.property]: data.val, isPinned: noteData.isPinned },
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
        { uuid: { $in: selectedUUIDs }, creator: userID },
        { $set: { isArchived: true, isPinned: false } }
      );
      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "UNDO_BATCH_COPY") {
      if (data.imagesToDel.length !== 0) {
        await Promise.all(
          data.imagesToDel.map((path) => {
            return cloudinary.api.delete_resources_by_prefix(path);
          })
        );
      }

      await Note.deleteMany({
        uuid: { $in: data.notesUUIDs },
        creator: userID,
      });
      await User.updateOne(
        { _id: userID },
        {
          $pull: {
            notesOrder: { $in: data.notesUUIDs },
          },
        }
      );
    }
  } catch (error) {
    console.log(error);
  }
};

export const copyNoteAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();
    const copiedNote = data.note;
    let copiedImages = [];

    if (copiedNote.images.length !== 0) {
      const copyPromises = copiedNote.images.map(async (img, i) => {
        const originalImageUUID = img.uuid;
        const originalUrl = cloudinary.url(
          `${userID}/${data.originalNoteUUID}/${originalImageUUID}`
        );

        const newImageUUID = data.newImages[i].uuid;
        const newPublicId = `${userID}/${data.newNoteUUID}/${newImageUUID}`;
        const newUrl = cloudinary.url(
          `${userID}/${data.newNoteUUID}/${newImageUUID}`
        );

        try {
          await cloudinary.uploader.upload(originalUrl, {
            public_id: newPublicId,
            resource_type: "image",
          });

          copiedImages.push({
            url: newUrl,
            uuid: newImageUUID,
          });
        } catch (error) {
          console.warn(`Skipping image ${originalImageUUID}:`, error.message);
        }
      });

      await Promise.all(copyPromises);
    }

    const noteData = {
      uuid: data.newNoteUUID,
      title: copiedNote.title,
      content: copiedNote.content,
      color: copiedNote.color,
      background: copiedNote.background,
      labels: copiedNote.labels,
      checkboxes: copiedNote.checkboxes,
      showCheckboxes: copiedNote.showCheckboxes,
      expandCompleted: copiedNote.expandCompleted,
      isPinned: false,
      isArchived: false,
      isTrash: copiedNote.isTrash,
      images: copiedImages,
      creator: userID,
    };

    const newNote = new Note(noteData);

    await User.updateOne(
      { _id: userID },
      { $push: { notesOrder: { $each: [newNote.uuid], $position: 0 } } }
    );

    await newNote.save();

    return {
      success: true,
      note: JSON.parse(JSON.stringify(newNote)),
      message: "Note copied successfully!",
      status: 201,
    };
  } catch (error) {
    console.log("Error creating note:", error);
    return new Response("Failed to add note", { status: 500 });
  }
};

export const batchCopyNoteAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();

    const notesUUIDs = [];

    await Promise.all(
      data.newNotes.map(async (n) => {
        notesUUIDs.unshift(n.uuid);
        n.creator = userID;
        const destinationFolder = `${userID}/${n.uuid}`;
        if (n.images.length > 0) {
          await Promise.all(
            n.images.map(async (image) => {
              const sourceDes = data.imagesMap.get(image.uuid);
              const originalPublicId = `${userID}/${sourceDes}`;
              const originalUrl = cloudinary.url(originalPublicId);
              const destinationPublicId = `${destinationFolder}/${image.uuid}`;
              const newUrl = cloudinary.url(destinationPublicId);

              try {
                await cloudinary.uploader.upload(originalUrl, {
                  public_id: destinationPublicId,
                  resource_type: "image",
                });

                image.url = newUrl;
              } catch (error) {
                console.warn(
                  `Skipping image ${originalPublicId}:`,
                  error.message
                );
              }
            })
          );
        }
      })
    );

    await Note.insertMany(data.newNotes);
    await User.updateOne(
      { _id: userID },
      {
        $push: {
          notesOrder: { $each: notesUUIDs, $position: 0 },
        },
      }
    );

    return {
      success: true,
      message: "Notes copied successfully!",
      status: 201,
    };
  } catch (error) {
    console.log("Error copying notes:", error);
    return new Response("Failed to copy notes", { status: 500 });
  }
};

export const fetchLabelsAction = async () => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return { success: false, message: "Unauthorized", status: 401 };
  }
  try {
    await connectDB();

    const user = await User.findById(userID);
    const labels = JSON.parse(JSON.stringify(user?.labels ?? []));

    return {
      success: true,
      message: "Fetched labels successfully!",
      status: 201,
      data: labels,
    };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Couldn't fetch labels", status: 500 };
  }
};

export const createLabelAction = async (newUUID, newLabel) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
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

export const createLabelForNotesAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();

    await Note.updateMany(
      {
        uuid: { $in: data.notesUUIDs },
        creator: userID,
      },
      { $push: { labels: data.labelObj.uuid } }
    );

    await User.updateOne({ _id: userID }, { $push: { labels: data.labelObj } });

    return {
      success: true,
      message: "Label created successfully!",
      status: 201,
    };
  } catch (error) {
    console.log(error);
  }
};

export const addLabelAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();

    await Note.updateOne(
      { uuid: data.noteUUID, creator: userID },
      { $push: { labels: data.labelUUID } }
    );
  } catch (error) {
    console.log(error);
    return { message: "Failed to add label", status: 500 };
  }
};

export const removeLabelAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();

    await Note.updateOne(
      { uuid: data.noteUUID, creator: userID },
      { $pull: { labels: data.labelUUID } }
    );
  } catch (error) {
    console.log(error);
    return { message: "Failed to remove label", status: 500 };
  }
};

export const updateLabelAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
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
      await User.findOneAndUpdate(
        { _id: userID, "labels.uuid": data.uuid },
        { $set: { "labels.$.image": null } }
      );

      const publicId = `${userID}/labels/${data.uuid}`;
      await cloudinary.uploader.destroy(publicId);

      return {
        success: true,
        message: "Label image deleted successfully!",
        status: 201,
      };
    } else if (data.type === "label_pin") {
      await User.findOneAndUpdate(
        { _id: userID, "labels.uuid": data.uuid },
        {
          $set: {
            "labels.$.isPinned": data.value,
            "labels.$.pinDate": new Date(),
          },
        }
      );

      return {
        success: true,
        message: "Label pinned state updated successfully!",
        status: 201,
      };
    } else if (data.type === "side-dnd") {
      const set = {};
      const arrayFilters = [];

      data.affected.forEach((label, index) => {
        set[`labels.$[label${index}].pinDate`] = label.pinDate;
        arrayFilters.push({ [`label${index}.uuid`]: label.uuid });
      });

      await User.updateOne({ _id: userID }, { $set: set }, { arrayFilters });

      return {
        success: true,
        message: "Labels updated successfully!",
        status: 201,
      };
    }
  } catch (error) {
    console.log(error);
    return { message: "Failed to update label", status: 500 };
  }
};

export const deleteLabelAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return { success: false, message: "Unauthorized", status: 401 };
  }

  try {
    await connectDB();

    await User.findOneAndUpdate(
      { _id: userID, "labels.uuid": data.labelUUID },
      { $pull: { labels: { uuid: data.labelUUID } } }
    );

    await Note.updateMany(
      { labels: data.labelUUID, creator: userID },
      { $pull: { labels: data.labelUUID } }
    );

    if (data.hasImage) {
      const publicId = `${userID}/labels/${data.labelUUID}`;
      await cloudinary.uploader.destroy(publicId);
    }

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

export const batchDeleteNotes = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();

    const deletedNotes = await Note.find({
      uuid: { $in: data.deletedUUIDs },
      creator: userID,
    });

    let deletedImages = [];

    deletedNotes.map((note) => {
      const filePath = `${userID}/${note.uuid}/`;
      deletedImages.push(filePath);
    });

    await Note.deleteMany({
      uuid: { $in: data.deletedUUIDs },
      creator: userID,
    });
    await User.updateOne(
      { _id: userID },
      {
        $pull: {
          notesOrder: { $in: data.deletedUUIDs },
        },
      }
    );

    if (deletedImages.length !== 0) {
      await Promise.all(
        deletedImages.map((path) => {
          return cloudinary.api.delete_resources_by_prefix(path);
        })
      );
    }

    return { success: true, message: "Trash emptied successfully" };
  } catch (error) {
    console.log("Error deleting notes.", error);
    return { success: false, message: "Error deleting notes" };
  }
};

export const batchManageLabelsAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectDB();

    if (data.case === "shared") {
      switch (data.operation) {
        case "remove": {
          await Note.updateMany(
            {
              uuid: { $in: data.notesUUIDs },
              labels: data.labelUUID,
              creator: userID,
            },
            { $pull: { labels: data.labelUUID } }
          );
          return { success: true, message: "Label removed successfully" };
        }

        case "add": {
          await Note.updateMany(
            {
              uuid: { $in: data.notesUUIDs },
              creator: userID,
            },
            { $push: { labels: data.labelUUID } }
          );
          return { success: true, message: "Label added successfully" };
        }
      }
    } else {
      await Note.updateMany(
        {
          uuid: { $in: data.notesUUIDs },
          creator: userID,
        },
        { $push: { labels: data.labelUUID } }
      );
      return { success: true, message: "Label added successfully" };
    }
  } catch (error) {
    return { success: false, message: "Error managing labels" };
  }
};
