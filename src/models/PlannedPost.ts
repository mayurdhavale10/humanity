import mongoose, { Schema, Document, models } from "mongoose";

export interface IPlannedPost extends Document {
  userEmail: string;
  platforms: ("X"|"LINKEDIN"|"INSTAGRAM")[];
  status: "DRAFT"|"SCHEDULED"|"QUEUED"|"PUBLISHED"|"FAILED";
  kind: "TEXT"|"IMAGE"|"VIDEO";
  caption: string;
  media?: any;
  scheduledAt?: Date;
  publishedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlannedPostSchema = new Schema<IPlannedPost>({
  userEmail: { type: String, required: true, index: true },
  platforms: { type: [String], required: true },
  status: { type: String, default: "DRAFT" },
  kind: { type: String, required: true },
  caption: { type: String, required: true },
  media: { type: Schema.Types.Mixed },
  scheduledAt: Date,
  publishedAt: Date,
  error: String,
}, { timestamps: true });

const PlannedPost =
  models.PlannedPost || mongoose.model<IPlannedPost>("PlannedPost", PlannedPostSchema);

export default PlannedPost;
