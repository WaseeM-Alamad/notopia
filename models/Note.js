import { Schema, model, models } from "mongoose";

const NoteSchema = new Schema(
  {
    uuid: {
      type: String,
      required: [true, "UUID is required!"],
    },
    title: {
      type: String,
    },
    content: {
      type: String,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required!"],
    },
    color: {
      type: String,
      trim: true,
      default: "Default",
    },

    background: {
      type: "String",
      trim: true,
      default: "DefaultBG",
    },

    labels: [
      {
        type: String,
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isTrash: {
      type: Boolean,
      default: false,
    },
    images: [
      {
        _id: false,
        url: { type: String, required: true },
        uuid: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Note = models?.Note || model("Note", NoteSchema);

export default Note;
