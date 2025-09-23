import { Schema, model, models } from "mongoose";

const NoteSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
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

    checkboxes: [
      {
        _id: false,
        uuid: String,
        content: String,
        isCompleted: Boolean,
        parent: String,
        children: [
          {
            type: String,
          },
        ],
      },
    ],

    images: [
      {
        _id: false,
        url: { type: String, required: true },
        uuid: { type: String, required: true },
      },
    ],

    collaborators: [
      {
        _id: false,
        data: { type: Schema.Types.ObjectId, ref: "User" },
        id: { type: Schema.Types.ObjectId, required: true },
        snapshot: {
          displayName: String,
          username: String,
          image: String,
        },
      },
    ],
    lastModifiedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Note = models?.Note || model("Note", NoteSchema);

export default Note;
