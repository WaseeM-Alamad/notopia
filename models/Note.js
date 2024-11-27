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
      default: "#ffffff",
    },
    labels: [
      {
        type: String,
        maxlength: [50],
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
    image: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Note = models?.Note || model("Note", NoteSchema);

export default Note;
