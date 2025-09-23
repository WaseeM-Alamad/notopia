import { Schema, model, models } from "mongoose";

const UserSettingsSchema = new Schema({
  note: {
    type: String,
    ref: "Note",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    select: false,
  },

  color: {
    type: String,
    default: "Default",
  },
  background: {
    type: String,
    default: "DefaultBG",
  },
  labels: [
    {
      type: String,
      default: [],
    },
  ],
  showCheckboxes: {
    type: Boolean,
    default: true,
  },
  expandCompleted: {
    type: Boolean,
    default: true,
  },
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
  openNote: {
    type: Boolean,
    default: true,
  },
  shareDate: {
    type: Date,
  },
  lastModifiedBy: {
    type: String,
    default: null,
  },
});

const UserSettings =
  models?.UserSettings || model("UserSettings", UserSettingsSchema);

export default UserSettings;
