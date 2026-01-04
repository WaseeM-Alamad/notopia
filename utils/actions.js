"use server";
import connectDB from "@/config/database";
import Note from "@/models/Note";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
import { v4 as uuid, validate as validateUUID } from "uuid";
import { Resend } from "resend";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import isEmail from "validator/lib/isEmail";
import cloudinary from "@/config/cloudinary";
import UserSettings from "@/models/UserSettings";
import { startSession } from "mongoose";

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
  if (typeof val !== "string") return false;

  const u = val.toLowerCase();

  return (
    u.length >= 2 &&
    u.length <= 32 &&
    /^[a-z0-9._]+$/.test(u) &&
    !u.includes("..") &&
    !/^[._]/.test(u) &&
    !/[._]$/.test(u)
  );
};

const isDisplayNameValid = (val) => {
  return (
    typeof val === "string" && val.trim().length >= 1 && val.trim().length <= 32
  );
};

const isEmailValid = (val) => {
  return typeof val === "string" && isEmail(val);
};

export const signUpAction = async (formData) => {
  try {
    await connectDB();
    const email = formData.get("email").toLowerCase().trim();
    const password = formData.get("password");
    const username = formData.get("username").toLowerCase().trim();

    if (!isEmailValid(email))
      return { success: false, type: "email", message: "Invalid email" };
    if (!isUsernameValid(username))
      return { success: false, type: "username", message: "Invalid username" };
    if (!isPasswordValid(password))
      return { success: false, type: "password", message: "Invalid password" };

    const hashedPassword = await hashPassword(password);
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const user = await User.findOne({
      $or: [{ email: email }, { username: username }],
    });

    if (user) {
      return {
        success: false,
        type: user.email === email ? "email" : "username",
        message:
          user.email === email
            ? "Email is already registered"
            : "Username is already taken",
      };
    }

    await User.create({
      email: email,
      displayName: username,
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

export const updateDisplayNameAction = async (newDisplayName) => {
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

    if (user?.displayName?.trim() === newDisplayName)
      return {
        success: false,
        message: "New display name cannot be the same as your current username",
      };

    if (!isDisplayNameValid(newDisplayName))
      return { success: false, message: "Invalid display name" };

    user.displayName = newDisplayName;

    await user.save();

    return { success: true, message: "Display name updated successfully" };
  } catch (error) {
    console.log("Error updating display name", error);
    return { success: false, message: "Error updating display name" };
  }
};

export const updateUsernameAction = async (input) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  try {
    if (!userID)
      return {
        success: false,
        message: "An error has occurred",
      };

    const newUsername = input.toLowerCase().trim();

    await connectDB();
    const user = await User.findOne({ username: newUsername });

    console.log("user", user);

    if (user) {
      if (user._id.equals(userID)) {
        return {
          success: false,
          message: "New username cannot be the same as your current username",
        };
      } else {
        return {
          success: false,
          message: "Username is already taken",
        };
      }
    }

    if (!isUsernameValid(newUsername))
      return { success: false, message: "Invalid username" };

    await User.updateOne({ _id: userID }, { $set: { username: newUsername } });

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

    console.log("IS EMAIL USED", isEmailUsed);

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

    // const link = `http://localhost:3000/auth/verify?token=${token}`;
    const link = `https://notopia.app/auth/verify?token=${token}`;

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
    throw new Error("Something went wrong");
  }

  try {
    await connectDB();

    const userSettings = await UserSettings.find({ user: userID })
      .populate({
        path: "note",
        populate: [
          {
            path: "collaborators.data",
            select: "displayName username image",
          },
          {
            path: "creator",
            select: "_id displayName username image",
          },
        ],
      })
      .lean();

    const notes = userSettings.map(({ note, ...settings }) => ({
      ...note,
      ...settings,
      _id: note._id,
    }));

    const user = await User.findById(userID);
    const order = user?.notesOrder || [];
    const labels = JSON.parse(JSON.stringify(user?.labels ?? []));

    return {
      success: true,
      status: 200,
      data: JSON.parse(JSON.stringify(notes ?? [])),
      order: order,
      labels: labels,
    };
  } catch (error) {
    console.log("Error fetching notes:", error);
    throw new Error("Error fetching notes");
  }
};

export const createNoteAction = async (note, clientID) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session || !note.uuid) {
    throw new Error("Something went wrong");
  }

  try {
    await connectDB();

    if (!validateUUID(note.uuid)) {
      throw new Error("Invalid ID");
    }

    const noteData = {
      _id: note.uuid,
      uuid: note.uuid,
      title: note.title || "",
      content: note.content || "",
      creator: userID,
      checkboxes: note.checkboxes || [],
      images: note.images || [],
      collaborators: note.collaborators || [],
      lastModifiedBy: clientID,
    };
    const settings = {
      note: note.uuid,
      user: userID,
      color: note.color || "Default",
      background: note.background || "DefaultBG",
      labels: note.labels || [],
      showCheckboxes: note.showCheckboxes || true,
      expandCompleted: note.expandCompleted || true,
      isPinned: note.isPinned || false,
      isArchived: note.isArchived || false,
      isTrash: note.isTrash || false,
      lastModifiedBy: clientID,
    };

    const newNote = new Note(noteData);
    const savedNote = await newNote.save();

    const newSettings = new UserSettings(settings);
    const savedSettings = await newSettings.save();

    await User.updateOne(
      { _id: userID },
      {
        $push: { notesOrder: { $each: [newNote.uuid], $position: 0 } },
        $set: { orderLastModifiedBy: clientID },
      }
    );

    const finalData = JSON.parse(JSON.stringify(savedNote));
    const p2 = JSON.parse(JSON.stringify(savedSettings));
    const { _id, _v, ...finalSettings } = p2;

    const finalNote = { ...finalData, ...finalSettings };

    return {
      success: true,
      message: "Note added successfully!",
      status: 201,
      newNote: finalNote,
    };
  } catch (error) {
    console.log("Error creating note:", error);
    throw new Error("Error creating note");
  }
};

export const NoteUpdateAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    throw new Error("Something went wrong");
  }
  try {
    await connectDB();
    if (data.type === "images") {
      const updatedNote = await Note.findOneAndUpdate(
        { uuid: data.noteUUIDs[0] },
        {
          $push: { images: data.value },
          $set: { lastModifiedBy: data.clientID },
        },
        { returnDocument: "after" }
      );
      const updatedImage = updatedNote.images.find(
        (img) => img.uuid === data.value.uuid
      );
      return JSON.parse(JSON.stringify(updatedImage));
    } else if (data.type === "isArchived") {
      await UserSettings.updateOne(
        { note: data.noteUUIDs[0], user: userID },
        {
          $set: {
            isArchived: data.value,
            isPinned: false,
            lastModifiedBy: data.clientID,
          },
        }
      );
      if (!data.first) {
        const user = await User.findById(userID);
        const { notesOrder } = user;
        const order = notesOrder.filter((uuid) => uuid !== data.noteUUIDs[0]);
        const updatedOrder = [data.noteUUIDs[0], ...order];
        user.orderLastModifiedBy = data.clientID;
        user.notesOrder = updatedOrder;
        await user.save();
      }
    } else if (data.type === "pinArchived") {
      await UserSettings.updateOne(
        { note: data.noteUUIDs[0], user: userID },
        {
          $set: {
            isPinned: data.value,
            isArchived: false,
            lastModifiedBy: data.clientID,
          },
        }
      );
      const user = await User.findById(userID);
      const { notesOrder } = user;
      const order = notesOrder.filter((uuid) => uuid !== data.noteUUIDs[0]);
      const updatedOrder = [data.noteUUIDs[0], ...order];
      user.orderLastModifiedBy = data.clientID;
      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "isPinned") {
      await UserSettings.updateOne(
        { note: data.noteUUIDs[0], user: userID },
        { $set: { isPinned: data.value, lastModifiedBy: data.clientID } }
      );
      const user = await User.findById(userID);
      const { notesOrder } = user;
      const order = notesOrder.filter((uuid) => uuid !== data.noteUUIDs[0]);
      const updatedOrder = [data.noteUUIDs[0], ...order];
      user.orderLastModifiedBy = data.clientID;
      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "isTrash") {
      await UserSettings.updateOne(
        { note: data.noteUUIDs[0], user: userID },
        {
          $set: {
            isTrash: data.value,
            isPinned: false,
            lastModifiedBy: data.clientID,
          },
        }
      );
      const user = await User.findById(userID);
      const { notesOrder } = user;
      const order = notesOrder.filter((uuid) => uuid !== data.noteUUIDs[0]);
      const updatedOrder = [data.noteUUIDs[0], ...order];
      user.orderLastModifiedBy = data.clientID;
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
            { uuid: data.noteUUIDs[0] },
            {
              $push: { checkboxes: checkbox },
              $set: {
                lastModifiedBy: data.clientID,
              },
            }
          );
          break;
        }
        case "MANAGE_COMPLETED": {
          await Note.updateOne(
            {
              uuid: data.noteUUIDs[0],
              "checkboxes.uuid": data.checkboxUUID,
            },
            {
              $set: {
                "checkboxes.$.isCompleted": data.value,
                lastModifiedBy: data.clientID,
              },
            }
          );
          break;
        }
        case "DELETE_CHECKBOX": {
          await Note.updateOne(
            {
              uuid: data.noteUUIDs[0],
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
              $set: {
                lastModifiedBy: data.clientID,
              },
            }
          );
          break;
        }
        case "DELETE_CHECKED": {
          await Note.updateOne(
            { uuid: data.noteUUIDs[0] },
            {
              $pull: { checkboxes: { isCompleted: true } },
              $set: {
                lastModifiedBy: data.clientID,
              },
            }
          );
          break;
        }
        case "UNCHECK_ALL": {
          await Note.updateMany(
            { uuid: data.noteUUIDs[0] },
            {
              $set: {
                "checkboxes.$[elem].isCompleted": false,
                lastModifiedBy: data.clientID,
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
            },
            {
              $set: {
                "checkboxes.$.content": data.value,
                lastModifiedBy: data.clientID,
              },
            }
          );
          break;
        }
        case "UPDATE_ORDER-FAM": {
          const note = await Note.findOne({
            uuid: data.noteUUIDs[0],
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
          note.checkboxes = newList;
          note.lastModifiedBy = data.clientID;
          await note.save();

          break;
        }
      }
    } else if (
      data.type === "expandCompleted" ||
      data.type === "color" ||
      data.type === "background" ||
      data.type === "showCheckboxes"
    ) {
      await UserSettings.updateMany(
        { note: { $in: data.noteUUIDs }, user: userID },
        {
          $set: {
            [data.type]: data.value,
            lastModifiedBy: data.clientID,
          },
        }
      );
    } else {
      await Note.updateMany(
        { uuid: { $in: data.noteUUIDs } },
        {
          $set: {
            [data.type]: data.value,
            lastModifiedBy: data.clientID,
          },
        }
      );
    }
  } catch (error) {
    console.log("Error updating note:", error);
    throw new Error("Error updating note");
  }
};

export const batchUpdateAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    throw new Error("Something went wrong");
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

      if (data.property === "isTrash") {
        const notesWithCollabs = data.notesWithCollabs;

        const noteBulkOps = [];
        const userBulkOps = [
          {
            updateOne: {
              filter: { _id: userID },
              update: {
                $set: {
                  orderLastModifiedBy: data.clientID,
                  notesOrder: updatedOrder,
                },
              },
            },
          },
        ];
        const settingsBulkOps = [
          {
            updateMany: {
              filter: { note: { $in: sortedUUIDs }, user: userID },
              update: {
                $set: {
                  isTrash: !data.val,
                  isPinned: false,
                  lastModifiedBy: data.clientID,
                },
              },
            },
          },
        ];

        if (notesWithCollabs.length > 0) {
          notesWithCollabs.forEach(
            ({ uuid: noteUUID, isCreator, collabIDs }) => {
              if (isCreator) {
                if (collabIDs?.length === 0) return;

                noteBulkOps.push({
                  updateOne: {
                    filter: { uuid: noteUUID },
                    update: {
                      $set: {
                        lastModifiedBy: data.clientID,
                        collaborators: [],
                      },
                    },
                  },
                });

                settingsBulkOps.push({
                  deleteMany: {
                    filter: {
                      note: noteUUID,
                      user: { $ne: userID },
                    },
                  },
                });

                userBulkOps.push({
                  updateMany: {
                    filter: { _id: { $in: collabIDs } },
                    update: {
                      $pull: { notesOrder: noteUUID },
                      $set: { orderLastModifiedBy: data.clientID },
                    },
                  },
                });
              } else {
                noteBulkOps.push({
                  updateOne: {
                    filter: { uuid: noteUUID },
                    update: {
                      $pull: { collaborators: { id: userID } },
                      $set: { lastModifiedBy: data.clientID },
                    },
                  },
                });

                settingsBulkOps.push({
                  deleteOne: {
                    filter: { user: userID, note: noteUUID },
                  },
                });

                userBulkOps.push({
                  updateOne: {
                    filter: { _id: userID },
                    update: {
                      $pull: { notesOrder: noteUUID },
                      $set: { orderLastModifiedBy: data.clientID },
                    },
                  },
                });
              }
            }
          );
        }

        const session = await startSession();
        await session.withTransaction(async () => {
          {
            noteBulkOps.length > 0 &&
              (await Note.bulkWrite(noteBulkOps, { session }));
          }
          await UserSettings.bulkWrite(settingsBulkOps, { session });
          await User.bulkWrite(userBulkOps, { session });
        });
      } else {
        await UserSettings.updateMany(
          { note: { $in: sortedUUIDs }, user: userID },
          {
            $set: {
              isArchived: !data.val,
              isPinned: false,
              lastModifiedBy: data.clientID,
            },
          }
        );
        user.orderLastModifiedBy = data.clientID;
        user.notesOrder = updatedOrder;
      }

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

      await UserSettings.updateMany(
        { note: { $in: sortedUUIDs }, user: userID },
        {
          $set: {
            isPinned: !data.val,
            isArchived: false,
            lastModifiedBy: data.clientID,
          },
        }
      );

      user.orderLastModifiedBy = data.clientID;
      user.notesOrder = updatedOrder;
      await user.save();
    }
  } catch (error) {
    console.log("Error updating note:", error);
    return new Response("Failed to update note", { status: 500 });
  }
};

export const NoteTextUpdateAction = async (values, noteUUID, clientID) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Something went wrong");
  }
  if (values.title.length > 999 || values.content.length > 19999) {
    throw new Error("Title or note exceeded maximum length");
  }
  try {
    await connectDB();

    await Note.updateOne(
      { uuid: noteUUID },
      {
        $set: {
          title: values.title,
          content: values.content,
          lastModifiedBy: clientID,
        },
      }
    );
  } catch (error) {
    console.log("Error updating text", error);
    throw new Error("Error updating text");
  }
};

export const NoteImageDeleteAction = async (
  filePath,
  noteUUID,
  imageID,
  clientID
) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Something went wrong");
  }
  try {
    await connectDB();
    await Note.updateOne(
      { uuid: noteUUID, "images.uuid": imageID },
      {
        $pull: { images: { uuid: imageID } },
        $set: { lastModifiedBy: clientID },
      }
    );

    await cloudinary.uploader.destroy(filePath);
  } catch (error) {
    console.log("Error deleting image", error);
    throw new Error("Error deleting image");
  }
};

export const DeleteNoteAction = async (noteUUID, creatorID) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    throw new Error("Something went wrong");
  }
  try {
    await connectDB();
    const note = await Note.findOne({ uuid: noteUUID });
    await User.updateOne({ _id: userID }, { $pull: { notesOrder: noteUUID } });
    const result = await Note.deleteOne({ uuid: noteUUID });
    if (result.deletedCount === 0) {
      return { success: false, message: "Note not found" };
    }
    await UserSettings.deleteOne({
      note: noteUUID,
    });

    if (note.images.length !== 0) {
      const folderPath = `${creatorID}/${note.uuid}/`;
      await cloudinary.api.delete_resources_by_prefix(folderPath);
    }

    return { success: true, message: "Note deleted successfully" };
  } catch (error) {
    console.log("Error deleting note", error);
    throw new Error("Error deleting note");
  }
};

export const batchDeleteNotes = async (deletedNotesData, clientID) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Something went wrong");
  }
  try {
    await connectDB();

    const deletedImages = [];
    const deletedUUIDs = [];

    deletedNotesData.map(({ noteUUID, creatorID }) => {
      const filePath = `${creatorID}/${noteUUID}/`;
      deletedImages.push(filePath);
      deletedUUIDs.push(noteUUID);
    });

    const session = await startSession();
    await session.withTransaction(async () => {
      const ids = await UserSettings.distinct("user", {
        note: { $in: deletedUUIDs },
      }).session(session);

      await Note.deleteMany({ uuid: { $in: deletedUUIDs } }).session(session);
      await UserSettings.deleteMany({
        note: { $in: deletedUUIDs },
      }).session(session);
      await User.updateMany(
        { _id: { $in: ids } },
        {
          $pull: { notesOrder: { $in: deletedUUIDs } },
          $set: { orderLastModifiedBy: clientID },
        }
      ).session(session);
    });
    session.endSession();

    if (deletedImages.length !== 0) {
      await Promise.all(
        deletedImages.map((path) => {
          return cloudinary.api.delete_resources_by_prefix(path);
        })
      );
    }

    return { success: true, message: "Trash emptied successfully" };
  } catch (error) {
    console.log("Error deleting notes", error);
    throw new Error("Error deleting notes");
  }
};

export const updateOrderAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    throw new Error("Something went wrong");
  }

  try {
    await connectDB();
    const user = await User.findById(userID);
    const { notesOrder } = user;

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
    user.orderLastModifiedBy = data.clientID;
    await user.save();
  } catch (error) {
    console.log("Error updating position", error);
    throw new Error("Error updating position");
  }
};

export const undoAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    throw new Error("Something went wrong");
  }

  try {
    await connectDB();
    const user = await User.findById(userID);
    const { notesOrder } = user;

    if (data.type === "UNDO_ARCHIVE") {
      await UserSettings.updateOne(
        { note: data.noteUUID, user: userID },
        {
          $set: {
            isArchived: data.value,
            isPinned: data.pin,
            lastModifiedBy: data.clientID,
          },
        }
      );
      const updatedOrder = [...notesOrder];
      const [targetedNote] = updatedOrder.splice(data.endIndex, 1);
      updatedOrder.splice(data.initialIndex, 0, targetedNote);

      user.orderLastModifiedBy = data.clientID;
      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "UNDO_TRASH") {
      await UserSettings.updateOne(
        { note: data.noteUUID, user: userID },
        { $set: { isTrash: data.value, lastModifiedBy: data.clientID } }
      );
      const updatedOrder = [...notesOrder];
      const [targetedNote] = updatedOrder.splice(data.endIndex, 1);
      updatedOrder.splice(data.initialIndex, 0, targetedNote);

      user.orderLastModifiedBy = data.clientID;
      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "UNDO_PIN_ARCHIVED") {
      await UserSettings.updateOne(
        { note: data.noteUUID, user: userID },
        {
          $set: {
            isPinned: false,
            isArchived: true,
            lastModifiedBy: data.clientID,
          },
        }
      );
      const updatedOrder = [...notesOrder];
      const [targetedNote] = updatedOrder.splice(data.endIndex, 1);
      updatedOrder.splice(data.initialIndex, 0, targetedNote);

      user.orderLastModifiedBy = data.clientID;
      user.notesOrder = updatedOrder;
      await user.save();
    } else if (data.type === "UNDO_COPY") {
      await User.updateOne(
        { _id: userID },
        {
          $pull: { notesOrder: data.noteUUID },
          $set: { orderLastModifiedBy: data.clientID },
        }
      );

      const result = await Note.deleteOne({
        uuid: data.noteUUID,
      });
      if (result.deletedCount === 0) {
        return { success: false, message: "Note not found" };
      }

      await UserSettings.deleteOne({ note: data.noteUUID, user: userID });

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
            filter: { note: noteData.uuid, user: userID },
            update: {
              $set: {
                [data.property]: data.val,
                isPinned: noteData.isPinned,
                isArchived: noteData?.isArchived,
                lastModifiedBy: data.clientID,
              },
            },
          },
        });
      });

      await UserSettings.bulkWrite(bulkOperations);

      user.orderLastModifiedBy = data.clientID;
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

      await UserSettings.updateMany(
        { note: { $in: selectedUUIDs }, user: userID },
        {
          $set: {
            isArchived: true,
            isPinned: false,
            lastModifiedBy: data.clientID,
          },
        }
      );

      user.orderLastModifiedBy = data.clientID;
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
      });
      await UserSettings.deleteMany({
        note: { $in: data.notesUUIDs },
        user: userID,
      });
      await User.updateOne(
        { _id: userID },
        {
          $pull: { notesOrder: { $in: data.notesUUIDs } },
          $set: { orderLastModifiedBy: data.clientID },
        }
      );
    }
  } catch (error) {
    console.log("Error undoing action", error);
    throw new Error("Error undoing action");
  }
};

export const copyNoteAction = async (data) => {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const userID = session?.user?.id;
  if (!session) {
    throw new Error("Something went wrong");
  }
  try {
    await connectDB();
    const copiedNote = data.note;
    const creatorID = data?.creatorID;
    let copiedImages = [];

    if (copiedNote.images.length !== 0) {
      const copyPromises = copiedNote.images.map(async (img, i) => {
        const originalImageUUID = img.uuid;
        const originalUrl = cloudinary.url(
          `${creatorID}/${data.originalNoteUUID}/${originalImageUUID}`
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
      _id: data.newNoteUUID,
      uuid: data.newNoteUUID,
      title: copiedNote.title || "",
      content: copiedNote.content || "",
      creator: userID,
      checkboxes: copiedNote.checkboxes || [],
      images: copiedImages ?? [],
      lastModifiedBy: data.clientID,
    };

    const settings = {
      note: data.newNoteUUID,
      user: userID,
      color: copiedNote.color || "Default",
      background: copiedNote.background || "DefaultBG",
      labels: copiedNote.labels || [],
      showCheckboxes: copiedNote.showCheckboxes || true,
      expandCompleted: copiedNote.expandCompleted || true,
      isPinned: false,
      isArchived: false,
      isTrash: false,
      lastModifiedBy: data.clientID,
    };

    const newNote = new Note(noteData);
    const savedNote = await newNote.save();

    const newSettings = new UserSettings(settings);
    const savedSettings = await newSettings.save();

    await User.updateOne(
      { _id: userID },
      {
        $push: { notesOrder: { $each: [newNote.uuid], $position: 0 } },
        $set: { orderLastModifiedBy: data.clientID },
      }
    );

    const finalData = JSON.parse(JSON.stringify(savedNote));
    const p2 = JSON.parse(JSON.stringify(savedSettings));
    const { _id, _v, ...finalSettings } = p2;

    const finalNote = {
      ...finalData,
      ...finalSettings,
      creator: {
        _id: userID,
        username: user?.username,
        displayName: user?.displayName,
        image: user?.image,
      },
    };

    return {
      success: true,
      note: finalNote,
      message: "Note copied successfully!",
      status: 201,
    };
  } catch (error) {
    console.log("Error creating note", error);
    throw new Error("Error copying note");
  }
};

export const batchCopyNoteAction = async (data) => {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const userID = session?.user?.id;
  if (!session) {
    throw new Error("Something went wrong");
  }
  try {
    await connectDB();

    const notesUUIDs = [];

    const notes = [];
    const notesSettings = [];

    await Promise.all(
      data.newNotes.map(async (n) => {
        notesUUIDs.unshift(n.uuid);
        n.creator = userID;
        n.lastModifiedBy = data.clientID;
        const destinationFolder = `${userID}/${n.uuid}`;
        if (n.images.length > 0) {
          await Promise.all(
            n.images.map(async (image) => {
              const sourceDes = data.imagesMap.get(image.uuid);
              const originalPublicId = sourceDes;
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

        notes.push({
          _id: n.uuid,
          uuid: n.uuid,
          title: n?.title,
          content: n?.content,
          creator: userID,
          checkboxes: n?.checkboxes,
          images: n?.images,
          lastModifiedBy: data.clientID,
        });

        notesSettings.push({
          note: n.uuid,
          user: userID,
          color: n?.color,
          background: n?.background,
          labels: n?.labels,
          showCheckboxes: n?.showCheckboxes,
          expandCompleted: n?.expandCompleted,
          isPinned: n?.isPinned,
          isArchived: n?.isArchived,
          isTrash: n?.isTrash,
          lastModifiedBy: data.clientID,
        });
      })
    );

    const savedNotes = await Note.insertMany(notes);
    const savedSettings = await UserSettings.insertMany(notesSettings);

    const finalNotesData = JSON.parse(JSON.stringify(savedNotes));
    const finalSettings = JSON.parse(JSON.stringify(savedSettings));

    await User.updateOne(
      { _id: userID },
      {
        $push: { notesOrder: { $each: notesUUIDs, $position: 0 } },
        $set: { lastModifiedBy: data.clientID },
      }
    );

    const finalNotes = finalNotesData.map((note, index) => {
      const settings = finalSettings[index];
      return {
        ...note,
        ...settings,
        _id: note._id,
        creator: {
          _id: userID,
          username: user.username,
          image: user.image,
          displayName: user.displayName,
        },
      };
    });

    return {
      success: true,
      message: "Notes copied successfully!",
      newNotes: finalNotes,
      status: 201,
    };
  } catch (error) {
    console.log("Error copying notes", error);
    throw new Error("Error copying notes");
  }
};

export const fetchLabelsAction = async () => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    throw new Error("Something went wrong");
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

export const createLabelAction = async (newUUID, newLabel, clientID) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    throw new Error("Something went wrong");
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

    user.labelsLastModifiedBy = clientID;
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
    throw new Error("Something went wrong");
  }
  try {
    await connectDB();

    await UserSettings.updateMany(
      {
        note: { $in: data.notesUUIDs },
        user: userID,
      },
      {
        $push: { labels: data.labelObj.uuid },
        $set: { lastModifiedBy: data.clientID },
      }
    );

    await User.updateOne(
      { _id: userID },
      {
        $push: { labels: data.labelObj },
        $set: { labelsLastModifiedBy: data.clientID },
      }
    );

    return {
      success: true,
      message: "Label created successfully!",
      status: 201,
    };
  } catch (error) {
    console.log("Error creating label", error);
    throw new Error("Error creating label");
  }
};

export const addLabelAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    throw new Error("Something went wrong");
  }
  try {
    await connectDB();

    await UserSettings.updateOne(
      { note: data.noteUUID, user: userID },
      {
        $push: { labels: data.labelUUID },
        $set: { lastModifiedBy: data.clientID },
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error("Error adding label");
  }
};

export const removeLabelAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    throw new Error("Something went wrong");
  }
  try {
    await connectDB();

    await UserSettings.updateOne(
      { note: data.noteUUID, user: userID },
      {
        $pull: { labels: data.labelUUID },
        $set: { lastModifiedBy: data.clientID },
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error("Error removing label");
  }
};

export const updateLabelAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;
  if (!session) {
    throw new Error("Something went wrong");
  }

  try {
    await connectDB();

    if (data.type === "color") {
      await User.findOneAndUpdate(
        { _id: userID, "labels.uuid": data.uuid },
        {
          $set: {
            "labels.$.color": data.color,
            labelsLastModifiedBy: data.clientID,
          },
        }
      );

      return {
        success: true,
        message: "Label color updated successfully!",
        status: 201,
      };
    } else if (data.type === "title") {
      const user = await User.findById(userID);

      if (!data.label.toLowerCase().trim()) {
        return {
          success: false,
          message: "Label can't be empty.",
          status: 409,
        };
      }

      const labelExists = user.labels.some(
        (labelData) =>
          labelData.label.toLowerCase().trim() ===
            data.label.toLowerCase().trim() && labelData.uuid !== data.uuid
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
        {
          $set: {
            "labels.$.label": data.label.trim(),
            labelsLastModifiedBy: data.clientID,
          },
        }
      );

      return {
        success: true,
        message: "Label updated successfully!",
        status: 201,
      };
    } else if (data.type === "image") {
      await User.findOneAndUpdate(
        { _id: userID, "labels.uuid": data.uuid },
        {
          $set: {
            "labels.$.image": data.imageURL,
            labelsLastModifiedBy: data.clientID,
          },
        }
      );

      return {
        success: true,
        message: "Label image updated successfully!",
        status: 201,
      };
    } else if (data.type === "delete_image") {
      await User.findOneAndUpdate(
        { _id: userID, "labels.uuid": data.uuid },
        {
          $set: { "labels.$.image": null, labelsLastModifiedBy: data.clientID },
        }
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
            labelsLastModifiedBy: data.clientID,
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

      await User.updateOne(
        { _id: userID },
        { $set: set, labelsLastModifiedBy: data.clientID },
        { arrayFilters }
      );

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
    throw new Error("Something went wrong");
  }

  try {
    await connectDB();

    await User.findOneAndUpdate(
      { _id: userID, "labels.uuid": data.labelUUID },
      {
        $pull: { labels: { uuid: data.labelUUID } },
        $set: { labelsLastModifiedBy: data.clientID },
      }
    );

    await UserSettings.updateMany(
      { labels: data.labelUUID, user: userID },
      {
        $pull: { labels: data.labelUUID },
        $set: { lastModifiedBy: data.clientID },
      }
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
    console.log("Error deleting label", error);
    throw new Error("Error deleting label");
  }
};

export const batchManageLabelsAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!session) {
    throw new Error("Something went wrong");
  }
  try {
    await connectDB();

    if (data.case === "shared") {
      switch (data.operation) {
        case "remove": {
          await UserSettings.updateMany(
            {
              note: { $in: data.notesUUIDs },
              labels: data.labelUUID,
              user: userID,
            },
            {
              $pull: { labels: data.labelUUID },
              $set: { lastModifiedBy: data.clientID },
            }
          );
          return { success: true, message: "Label removed successfully" };
        }

        case "add": {
          await UserSettings.updateMany(
            {
              note: { $in: data.notesUUIDs },
              user: userID,
            },
            {
              $push: { labels: data.labelUUID },
              $set: { lastModifiedBy: data.clientID },
            }
          );
          return { success: true, message: "Label added successfully" };
        }
      }
    } else {
      await UserSettings.updateMany(
        {
          note: { $in: data.notesUUIDs },
          user: userID,
        },
        {
          $push: { labels: data.labelUUID },
          $set: { lastModifiedBy: data.clientID },
        }
      );
      return { success: true, message: "Label added successfully" };
    }
  } catch (error) {
    console.log("Something went wrong", error);
    throw new Error("Something went wrong");
  }
};

function cleanNoteForDB(note) {
  const { _id, ref, createdAt, updatedAt, _v, creator, type, ...cleanNote } =
    note; // exclude _id and any other unwanted props
  return cleanNote;
}

export const syncOfflineUpdatesAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!session) {
    throw new Error("Something went wrong");
  }

  try {
    await connectDB();

    const dbNotes = await Note.find({ creator: userID }).sort({
      createdAt: -1,
    });

    const queuedNotes = data?.queuedNotes || [];
    const queuedOrder = data?.queuedOrder || [];

    const queuedOrderSet = new Set(queuedOrder);
    const deletedNotesSet = new Set();

    let syncOrder = data.syncOrder;

    const notesBulkOperations = [];
    const userBulkOperations = [];

    if (queuedNotes.length > 0) {
      for (let note of queuedNotes) {
        const cleanNote = cleanNoteForDB(note);
        if (note.type === "create") {
          notesBulkOperations.push({
            insertOne: {
              document: {
                ...cleanNote,
                creator: userID,
                lastModifiedBy: data.clientID,
              },
            },
          });
        } else if (note.type === "delete") {
          deletedNotesSet.add(note.uuid);
          notesBulkOperations.push({
            deleteOne: {
              filter: { uuid: cleanNote.uuid, creator: userID },
            },
          });
        } else {
          notesBulkOperations.push({
            updateOne: {
              filter: { uuid: cleanNote.uuid, creator: userID },
              update: { $set: { ...cleanNote, lastModifiedBy: data.clientID } },
            },
          });
        }
      }
    }

    if (syncOrder) {
      for (let dbNote of dbNotes) {
        if (
          !queuedOrderSet.has(dbNote.uuid) &&
          !deletedNotesSet.has(dbNote.uuid)
        ) {
          syncOrder = true;
          queuedOrder.push(dbNote.uuid);
        }
      }
    }

    if (syncOrder) {
      userBulkOperations.push({
        updateOne: {
          filter: { _id: userID },
          update: { $set: { notesOrder: queuedOrder } },
        },
      });
    }

    if (notesBulkOperations.length > 0) {
      await Note.bulkWrite(notesBulkOperations);
    }
    if (syncOrder) {
      await User.bulkWrite(userBulkOperations);
    }

    return {
      success: true,
      message: "Data synced with database successfully",
    };
  } catch (error) {
    console.log("Error syncing data with database", error);
    throw new Error("Error syncing data with database");
  }
};

export const submitCollabUserAction = async (input, noteUUID) => {
  const session = await getServerSession(authOptions);
  const loggedInUser = session?.user;

  if (!session) {
    throw new Error("Something went wrong");
  }

  try {
    await connectDB();

    const finalInput = input.toLowerCase().trim();

    const isEmail = isEmailValid(finalInput);
    let user = null;

    if (!isEmail) {
      if (
        finalInput.toLowerCase().trim() ===
        loggedInUser.username.toLocaleLowerCase().trim()
      ) {
        return {
          success: false,
          message: "Username already exists",
        };
      }
      user = await User.findOne({ username: finalInput });
    } else {
      if (
        finalInput.toLowerCase().trim() ===
        loggedInUser.email.toLocaleLowerCase().trim()
      ) {
        return {
          success: false,
          message: "Email already exists",
        };
      }
      user = await User.findOne({ email: finalInput });
    }

    if (!user) {
      return {
        success: false,
        message: "User does not exist",
      };
    }

    const passedUser = {
      data: {
        image: user.image,
        displayName: user.displayName,
        username: user.username,
      },
      id: user._id,
    };

    if (!user) {
      return {
        success: false,
        message: "No matching user found",
      };
    }

    const alreadyExists = await Note.exists({
      uuid: noteUUID,
      "collaborators.data": user._id,
    });

    if (alreadyExists)
      return {
        success: false,
        newUser: JSON.parse(JSON.stringify(passedUser)),
        message: isEmail ? "Email already exists" : "Username already exists",
      };

    return {
      success: true,
      newUser: JSON.parse(JSON.stringify(passedUser)),
      message: "A matching user found",
    };
  } catch (error) {
    console.log("Error submitting collab user", error);
    throw new Error("Error submitting collab user");
  }
};

export const removeSelfAction = async (noteUUID, clientID) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!session) {
    throw new Error("Something went wrong");
  }

  try {
    await connectDB();

    const session = await startSession();
    await session.withTransaction(async () => {
      await Note.updateOne(
        { uuid: noteUUID },
        {
          $pull: { collaborators: { id: userID } },
          $set: { lastModifiedBy: clientID },
        }
      ).session(session);
      await UserSettings.deleteOne({ user: userID, note: noteUUID }).session(
        session
      );
      await User.updateOne(
        { _id: userID },
        {
          $pull: { notesOrder: noteUUID },
          $set: { orderLastModifiedBy: clientID },
        }
      ).session(session);
    });
    session.endSession();

    return {
      success: true,
      message: "Collaborator has been removed successfully",
    };
  } catch (error) {
    console.log("Error removing collaborator", error);
    throw new Error("Error removing collaborator");
  }
};

export const updateCollabsAction = async (data) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!session) {
    throw new Error("Something went wrong");
  }

  if (data.creatorID !== userID) {
    throw new Error("Only creator manage collaborators");
  }

  try {
    await connectDB();

    const shareDate = new Date();

    if (!data.creatorID) {
      throw new Error("Something went wrong");
    }

    const noteBulkOps = [];
    const settingsBulkOps = [];
    const userBulkOps = [];

    const addIDsSet = new Set();
    const removeIDsSet = new Set();

    for (let [collabID, operation] of data.collabOpsMap) {
      if (operation === "add") {
        addIDsSet.add(collabID);
        settingsBulkOps.push({
          insertOne: {
            document: {
              note: data.noteUUID,
              user: collabID,
              openNote: false,
              shareDate: shareDate,
              lastModifiedBy: data.clientID,
            },
          },
        });
      } else {
        removeIDsSet.add(collabID);
        settingsBulkOps.push({
          deleteOne: { filter: { user: collabID, note: data.noteUUID } },
        });
      }
    }

    if (addIDsSet.size > 0) {
      const newUsers = await User.find(
        { _id: { $in: [...addIDsSet] } },
        { _id: 1, displayName: 1, username: 1, image: 1 }
      );

      const collabsToAdd = newUsers.map((u) => {
        return {
          data: u._id,
          id: u._id,
          snapshot: {
            displayName: u.displayName,
            username: u.username,
            image: u.image,
          },
        };
      });

      noteBulkOps.push({
        updateOne: {
          filter: { uuid: data.noteUUID },
          update: {
            $addToSet: { collaborators: { $each: collabsToAdd } },
            $set: { lastModifiedBy: data.clientID },
          },
        },
      });

      userBulkOps.push({
        updateMany: {
          filter: { _id: { $in: [...addIDsSet] } },
          update: [
            {
              $set: {
                notesOrder: {
                  $concatArrays: [
                    [data.noteUUID],
                    {
                      $filter: {
                        input: "$notesOrder",
                        cond: { $ne: ["$$this", data.noteUUID] },
                      },
                    },
                  ],
                },
                orderLastModifiedBy: data.clientID,
              },
            },
          ],
        },
      });
    }

    if (removeIDsSet.size > 0) {
      noteBulkOps.push({
        updateOne: {
          filter: { uuid: data.noteUUID },
          update: {
            $pull: { collaborators: { id: { $in: [...removeIDsSet] } } },
            $set: { lastModifiedBy: data.clientID },
          },
        },
      });
      userBulkOps.push({
        updateMany: {
          filter: { _id: { $in: [...removeIDsSet] } },
          update: {
            $pull: { notesOrder: data.noteUUID },
            $set: { orderLastModifiedBy: data.clientID },
          },
        },
      });
    }

    const session = await startSession();
    await session.withTransaction(async () => {
      await Note.bulkWrite(noteBulkOps, { session });
      await UserSettings.bulkWrite(settingsBulkOps, { session });
      await User.bulkWrite(userBulkOps, { session });
    });
    session.endSession();
    return { success: true, message: "Collaborators updated successfully" };
  } catch (error) {
    console.log("Error updating collaborators", error);
    throw new Error("Error updating collaborators");
  }
};

export const openNoteAction = async (noteUUID, clientID) => {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!session) {
    throw new Error("Something went wrong");
  }

  try {
    await connectDB();

    await UserSettings.updateOne(
      { user: userID, note: noteUUID },
      {
        $set: {
          openNote: true,
          lastModifiedBy: clientID,
        },
      }
    );

    return { success: true, message: "Note updated successfully" };
  } catch (error) {
    console.log("Error updating note", error);
    throw new Error("Error updating note");
  }
};
