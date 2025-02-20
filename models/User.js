import { Schema, model, models } from "mongoose";

const LabelSchema = new Schema(
  {
    _id: false,
    uuid: { type: String, required: true },
    label: {
      type: String,
      required: true,
      maxlength: [50],
      unique: [true, "Label already exists!"],
    },
    color: { type: String, default: "rgba(255, 255, 255, 1)" },
    image: { type: String },
    noteCount: { type: Number },
  },
  {
    timestamps: true,
  }
);

const UserSchema = new Schema({
  email: {
    type: String,
    unique: [true, "Email already exists!"],
    required: [true, "Email is required!"],
  },
  username: {
    type: String,
    required: [true, "Username is required!"],
  },
  image: {
    type: String,
  },
  notes: [
    {
      type: Schema.Types.ObjectId,
      ref: "Note",
    },
  ],
  notesOrder: [
    {
      type: String,
    },
  ],
  labels: [LabelSchema],
});

const User = models?.User || model("User", UserSchema);
export default User;
