import mongoose, { Schema, Document, models, Model } from "mongoose";

export type Platform = "X" | "LINKEDIN" | "INSTAGRAM";
export type PostStatus = "DRAFT" | "SCHEDULED" | "QUEUED" | "PUBLISHED" | "FAILED";
export type PostKind = "TEXT" | "IMAGE" | "VIDEO";

export interface IPlannedPost extends Document {
  userEmail: string;
  platforms: Platform[];
  status: PostStatus;
  kind: PostKind;
  caption: string;
  media?: {
    imageUrl?: string;
    videoUrl?: string;
    // add more fields later (altText, thumb, etc.)
  };
  scheduledAt?: Date;
  publishedAt?: Date;

  // automation bookkeeping
  attempts: number;          // how many times cron tried to publish
  lastAttemptAt?: Date;      // when cron last tried
  error?: string;            // last error message (if any)

  // per-platform publish results (store remote IDs/links)
  results?: Array<{
    platform: Platform;
    remoteId?: string;       // e.g., IG media ID
    url?: string;            // canonical link if you have it
    postedAt?: Date;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

const PlannedPostSchema = new Schema<IPlannedPost>(
  {
    userEmail: { type: String, required: true, index: true },

    platforms: {
      type: [String],
      required: true,
      enum: ["X", "LINKEDIN", "INSTAGRAM"],
      validate: [(arr: string[]) => arr.length > 0, "At least one platform is required"],
    },

    status: {
      type: String,
      default: "DRAFT",
      enum: ["DRAFT", "SCHEDULED", "QUEUED", "PUBLISHED", "FAILED"],
      index: true,
    },

    kind: {
      type: String,
      required: true,
      enum: ["TEXT", "IMAGE", "VIDEO"],
    },

    caption: { type: String, required: true },

    media: {
      imageUrl: { type: String },
      videoUrl: { type: String },
    },

    scheduledAt: { type: Date, index: true },
    publishedAt: { type: Date },

    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    error: { type: String },

    results: [
      new Schema(
        {
          platform: {
            type: String,
            enum: ["X", "LINKEDIN", "INSTAGRAM"],
            required: true,
          },
          remoteId: String,
          url: String,
          postedAt: Date,
        },
        { _id: false }
      ),
    ],
  },
  { timestamps: true }
);

// Helpful compound index for the cron picker:
// quickly find items due to post now (QUEUED/SCHEDULED) by time.
PlannedPostSchema.index({ status: 1, scheduledAt: 1 });

// Optional: guard image posts to have imageUrl
PlannedPostSchema.pre("save", function (next) {
  if (this.kind === "IMAGE" && !this.media?.imageUrl) {
    return next(new Error("IMAGE posts require media.imageUrl"));
  }
  if (this.kind === "VIDEO" && !this.media?.videoUrl) {
    return next(new Error("VIDEO posts require media.videoUrl"));
  }
  next();
});

const PlannedPost: Model<IPlannedPost> =
  (models.PlannedPost as Model<IPlannedPost>) ||
  mongoose.model<IPlannedPost>("PlannedPost", PlannedPostSchema);

export default PlannedPost;
