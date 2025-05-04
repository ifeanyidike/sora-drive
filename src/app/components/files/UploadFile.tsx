import { useAuth } from "@/lib/auth/context";
import { rootStore } from "@/store/rootStore";
import { Button, message } from "antd";
import { UploadCloud } from "lucide-react";
import { observer } from "mobx-react-lite";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

type Props = {
  folderId: string | null;
};
const UploadFile = ({ folderId }: Props) => {
  const { fileStore } = rootStore;
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user) {
        message.error("You must be logged in to upload files");
        return;
      }
      setUploading(true);
      try {
        await fileStore.uploadFiles(acceptedFiles, user?.id, folderId);
        setUploading(false);
      } catch (error) {
        console.error("Error uploading files:", error);
        setUploading(false);
      }
    },
    [user?.id, folderId]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer transition-colors ${
        isDragActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-blue-400"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center">
        <UploadCloud size={48} className="text-gray-400 mb-4" />
        <p className="text-lg mb-2">
          {isDragActive
            ? "Drop files here"
            : "Drag & drop files here, or click to select files"}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Upload files to {folderId ? "this folder" : "your drive"}
        </p>
        <Button type="primary" loading={uploading}>
          Select Files
        </Button>
      </div>
    </div>
  );
};

export default observer(UploadFile);
