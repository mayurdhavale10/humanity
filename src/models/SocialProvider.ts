import mongoose, { Schema, Document, models } from "mongoose";

export interface ISocialProvider extends Document {
  userEmail: string;        // link to session user
  platform: "X" | "LINKEDIN" | "INSTAGRAM";
  accessToken: string;
  refreshToken?: string;
  accountRef: string;       // e.g. @handle or account id
  expiresAt?: Date;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const SocialProviderSchema = new Schema<ISocialProvider>(
  {
    userEmail: { type: String, required: true, index: true },
    platform: { type: String, required: true, enum: ["X", "LINKEDIN", "INSTAGRAM"] },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    accountRef: { type: String, required: true },
    expiresAt: { type: Date },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Prevent recompilation in dev hot-reload
const SocialProvider =
  models.SocialProvider || mongoose.model<ISocialProvider>("SocialProvider", SocialProviderSchema);

export default SocialProvider;
