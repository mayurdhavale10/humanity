// src/app/api/media/upload/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Make sure these are set in your env (Vercel → Project → Settings → Environment Variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // e.g. dqiolmf7y
  api_key: process.env.CLOUDINARY_API_KEY,       // e.g. 173985179328941
  api_secret: process.env.CLOUDINARY_API_SECRET, // e.g. DXuIGKr7qqn-x0XkcdwVRnpnGN8
});

type UploadResult = {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  resource_type: string;
  bytes: number;
  format: string;
};

function uploadBufferToCloudinary(
  buffer: Buffer,
  filename?: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "humanity",
        resource_type: "image",
        filename_override: filename,
        use_filename: Boolean(filename),
        unique_filename: !filename,
        overwrite: false,
      },
      (err, res) => {
        if (err || !res) return reject(err || new Error("Upload failed"));
        resolve(res as UploadResult);
      }
    );
    stream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    // Accept either:
    // 1) multipart/form-data with a "file" (from <input type="file">), or
    // 2) JSON / form field with a public "url" to import
    const contentType = req.headers.get("content-type") || "";

    // Case A: multipart with file
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      const urlField = form.get("url") as string | null;

      if (file && file.size > 0) {
        const arrayBuf = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const result = await uploadBufferToCloudinary(
          buffer,
          (file as any).name || "upload"
        );
        return NextResponse.json({
          ok: true,
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          format: result.format,
        });
      }

      if (urlField && typeof urlField === "string") {
        const result = (await cloudinary.uploader.upload(urlField, {
          folder: "humanity",
          resource_type: "image",
        })) as UploadResult;
        return NextResponse.json({
          ok: true,
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          format: result.format,
        });
      }

      return NextResponse.json(
        { error: "Provide a file in 'file' or a public URL in 'url'." },
        { status: 400 }
      );
    }

    // Case B: JSON with { url: "https://..." }
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      const url = body?.url as string | undefined;
      if (!url) {
        return NextResponse.json(
          { error: "Missing 'url' in JSON body." },
          { status: 400 }
        );
      }
      const result = (await cloudinary.uploader.upload(url, {
        folder: "humanity",
        resource_type: "image",
      })) as UploadResult;

      return NextResponse.json({
        ok: true,
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format,
      });
    }

    return NextResponse.json(
      { error: "Unsupported Content-Type. Use multipart/form-data or JSON." },
      { status: 415 }
    );
  } catch (err: any) {
    console.error("Upload error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}

// (optional) avoid accidental GET calls showing as errors
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
