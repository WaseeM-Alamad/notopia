// models/PushSubscription.js
import mongoose from "mongoose";

const PushSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subscription: {
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String,
    },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.PushSubscription ||
  mongoose.model("PushSubscription", PushSubscriptionSchema);
