"use server";
import { v2 as cloudinary, UploadApiOptions } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export async function uploadFileToCloudinary(
  buffer: Buffer,
  file: File,
  folder: string
): Promise<string | Error> {
  try {
    const base64Data = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64Data}`;

    const uploadOptions = {
      folder,
      resource_type: "auto" as "auto" | "raw" | "image" | "video",
      public_id: `${Date.now()}_${file.name.split(".")[0]}`,
      ...(file.type === "application/pdf" && { resource_type: "raw" }),
    } as UploadApiOptions;

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(dataURI, uploadOptions, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    console.log("Cloudinary upload result:", result);
    return result.secure_url;
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    return error as Error;
  }
}

export async function uploadFile(formData: FormData, repo: string) {
  try {
    const file = formData.get("file") as File;

    if (file?.size === 0) {
      return { status: "error", message: "Please select a file" };
    } else if (file.size > 5 * 1024 * 1024) {
      return {
        status: "error",
        message: "File size exceeds the maximum allowed size of 5 MB",
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFileToCloudinary(buffer, file, repo);

    if (result instanceof Error) {
      throw result;
    }

    return {
      status: "success",
      message: "File has been uploaded successfully",
      url: result,
    };
  } catch (error) {
    console.log("error", error);
    return { status: "error", message: "Failed to upload file" };
  }
}

export async function removeFromObjectStorage(fileUrl: string, id: string) {
  try {
    const urlParts = fileUrl.split("/");
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.split(".")[0];

    const uploadIndex = urlParts.indexOf("upload");
    const folderPath = urlParts.slice(uploadIndex + 1, -1).join("/");
    const fullPublicId = folderPath ? `${folderPath}/${publicId}` : publicId;

    const extension = publicIdWithExtension.split(".").pop()?.toLowerCase();
    const resourceType = extension === "pdf" ? "raw" : "image";

    const response = await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        fullPublicId,
        { resource_type: resourceType },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    console.log("Cloudinary delete response:", response);
    return { status: "success" };
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    return { status: "error", message: "Failed to delete file" };
  }
}
