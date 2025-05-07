import { FileStore } from "@/store/fileStore";
import { RejectedFile } from "@/types";
import { App } from "antd";

export const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const formatDate = (dateString: Date): string => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getThumbnailIcon = (
  type: "file" | "folder",
  size = "48",
  fileType: string | undefined
) => {
  if (type === "folder") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="#5f6368"
        className="mx-auto"
      >
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
      </svg>
    );
  }

  if (fileType?.includes("image")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="#4285f4"
        className="mx-auto"
      >
        <g>
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"></path>
          <path d="M10 16l1-3.62 2.38 1.62L15 11l3 5z"></path>
        </g>
      </svg>
    );
  }
  if (fileType?.includes("pdf")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="#ea4335"
        className="mx-auto"
      >
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
      </svg>
    );
  }
  if (fileType?.includes("sheet") || fileType?.includes("excel")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="#0f9d58"
        className="mx-auto"
      >
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm1 10H9v-2h6v2zm0 4H9v-2h6v2z" />
        <path d="M13 9V3.5L18.5 9H13z" />
      </svg>
    );
  }
  if (fileType?.includes("document") || fileType?.includes("word")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="#4285f4"
        className="mx-auto"
      >
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#4285f4"
      className="mx-auto"
    >
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
    </svg>
  );
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function validateAndFilterFiles(files: File[]): {
  validFiles: File[];
  rejectedFiles: RejectedFile[];
} {
  const validFiles: File[] = [];
  const rejectedFiles: RejectedFile[] = [];

  files.forEach((file) => {
    if (file.size > MAX_FILE_SIZE) {
      rejectedFiles.push({
        name: file.name,
        reason: `File exceeds the maximum allowed size of ${formatSize(
          MAX_FILE_SIZE
        )}`,
      });
      return;
    }

    if (ALLOWED_FILE_FORMATS && Object.keys(ALLOWED_FILE_FORMATS).length > 0) {
      const isAllowedFormat = Object.keys(ALLOWED_FILE_FORMATS).includes(
        file.type
      );
      if (!isAllowedFormat) {
        const allowedExtensions = getAllowedExtensionsString();
        rejectedFiles.push({
          name: file.name,
          reason: `File type not allowed. Supported formats: ${allowedExtensions}`,
        });
        return;
      }
    }

    validFiles.push(file);
  });

  return { validFiles, rejectedFiles };
}

export function showRejectedFilesMessages(
  rejectedFiles: RejectedFile[],
  messageApi: ReturnType<typeof App.useApp>["message"]
): void {
  if (rejectedFiles.length === 0) return;

  rejectedFiles.forEach((file) => {
    messageApi.error(`"${file.name}" - ${file.reason}`);
  });
}

export function showUploadResultMessages(
  successes: number,
  failures: number,
  messageApi: ReturnType<typeof App.useApp>["message"]
): void {
  const total = successes + failures;

  if (successes > 0 && failures === 0) {
    messageApi.success(
      `${successes} ${successes === 1 ? "file" : "files"} uploaded successfully`
    );
  } else if (successes > 0 && failures > 0) {
    messageApi.warning(`${successes} of ${total} files uploaded successfully`);
  } else if (failures > 0) {
    messageApi.error(
      `Failed to upload ${failures} ${failures === 1 ? "file" : "files"}`
    );
  }
}

export async function handleFileUpload(
  files: File[],
  userId: string,
  folderId: string | null,
  fileStore: FileStore,
  messageApi: ReturnType<typeof App.useApp>["message"],
  onSuccess?: () => void
): Promise<{
  successCount: number;
  errorCount: number;
  rejectedFiles: RejectedFile[];
}> {
  const { validFiles, rejectedFiles } = validateAndFilterFiles(files);
  showRejectedFilesMessages(rejectedFiles, messageApi);

  if (validFiles.length === 0) {
    return { successCount: 0, errorCount: 0, rejectedFiles };
  }
  const messageKey = `upload-${Date.now()}`;
  messageApi.loading({
    content: "Uploading files...",
    key: messageKey,
    duration: 0,
  });

  try {
    const results = await fileStore.uploadFiles(validFiles, userId, folderId);
    let successCount = 0;
    let errorCount = 0;

    for (const result of results || []) {
      if (result.status === "success") {
        successCount++;
      } else {
        errorCount++;
      }
    }

    messageApi.destroy(messageKey);
    showUploadResultMessages(successCount, errorCount, messageApi);

    if (successCount > 0 && onSuccess) {
      onSuccess();
    }

    return { successCount, errorCount, rejectedFiles };
  } catch (error) {
    messageApi.destroy(messageKey);

    messageApi.error(
      "Upload failed: " +
        (error instanceof Error ? error.message : "Unknown error")
    );

    return { successCount: 0, errorCount: files.length, rejectedFiles };
  }
}

export const ALLOWED_FILE_FORMATS: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/svg+xml": [".svg"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "application/zip": [".zip"],
  "application/x-rar-compressed": [".rar"],
};

export const getAllowedExtensionsString = (): string => {
  return Object.values(ALLOWED_FILE_FORMATS).flat().join(", ");
};
