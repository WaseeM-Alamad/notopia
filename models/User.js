import { Schema, model, models } from "mongoose";

const LabelSchema = new Schema(
  {
    _id: false,
    uuid: { type: String, required: true },
    label: {
      type: String,
      required: true,
      maxlength: [50],
    },
    color: { type: String, default: "Default" },
    isPinned: { type: Boolean, default: false },
    pinDate: { type: Date, default: Date.now },
    image: { type: String, default: null },
    default: [],
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
  tempEmail: {
    type: String,
    unique: [true, "Email already exists!"],
    sparse: true,
  },
  password: {
    type: String,
    select: false,
  },
  token: {
    type: String,
    select: false,
    default: null,
  },
  tokenExpDate: {
    type: Date,
    select: false,
    default: null,
  },
  resetToken: {
    type: String,
    select: false,
    default: null,
  },
  resetTokenExpDate: {
    type: Date,
    select: false,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  googleID: {
    type: String,
  },
  displayName: {
    type: String,
    maxlength: [30],
  },
  username: {
    type: String,
    maxlength: [20],
    required: [true, "Username is required!"],
    unique: [true, "Username already exists!"],
  },
  image: {
    type: String,
    default: null,
  },
  notesOrder: [
    {
      type: String,
      default: [],
    },
  ],
  labels: [LabelSchema],
  orderLastModifiedBy: {
    type: String,
    default: null,
  },
  labelsLastModifiedBy: {
    type: String,
    default: null,
  },
});

const User = models?.User || model("User", UserSchema);
export default User;
