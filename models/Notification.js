import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["reminder", "share"],
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    read: {
      type: Boolean,
      default: false,
    },

    deleted: {
      type: Boolean,
      default: false,
    },

    lastModifiedBy: {
      type: String,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: () =>
        new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        ),
    },
  },
  {
    timestamps: true,
  },
);

// Automatically delete old notifications
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
