import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  Upload,
  X,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Modal, Progress, App, Button, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { rootStore } from "@/store/rootStore";
import { useAuth } from "@/lib/auth/context";
import { ALLOWED_FILE_FORMATS, formatSize } from "@/lib/utils";
import {
  MAX_FILE_SIZE,
  validateAndFilterFiles,
  showRejectedFilesMessages,
} from "@/lib/utils";
import { RejectedFile } from "@/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  folder_id: string | null;
  onUploadComplete: () => void;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

const UploadModal: React.FC<Props> = ({
  visible,
  onClose,
  folder_id,
  onUploadComplete,
}) => {
  const { fileStore, folderStore } = rootStore;
  const { user } = useAuth();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<RejectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { message } = App.useApp();

  useEffect(() => {
    if (!visible) {
      setUploadingFiles([]);
      setRejectedFiles([]);
    }
  }, [visible]);

  const handleFileSelect = async (files: File[]) => {
    if (!user) {
      message.error("You must be logged in to upload files");
      return;
    }
    const { validFiles, rejectedFiles: newRejectedFiles } =
      validateAndFilterFiles(files);
    showRejectedFilesMessages(newRejectedFiles, message);

    setRejectedFiles((prev) => [...prev, ...newRejectedFiles]);

    if (validFiles.length === 0) return;

    const newUploadingFiles = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: "uploading" as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);
    setIsUploading(true);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const fileId = newUploadingFiles[i].id;

      try {
        const originalSetUploadProgress =
          fileStore.setUploadProgress.bind(fileStore);
        fileStore.setUploadProgress = (id, progress) => {
          originalSetUploadProgress(id, progress);
          setUploadingFiles((prev) => {
            const updated = [...prev];
            const index = updated.findIndex((f) => f.id === fileId);
            if (index !== -1) {
              updated[index].progress = progress;
            }
            return updated;
          });
        };
        const response = await fileStore.uploadFile(file, user.id, folder_id);
        fileStore.setUploadProgress = originalSetUploadProgress;

        setUploadingFiles((prev) => {
          const updated = [...prev];
          const index = updated.findIndex((f) => f.id === fileId);
          if (index !== -1) {
            updated[index].progress = 100;
            updated[index].status =
              response.status === "success" ? "completed" : "error";
            if (response.status === "error") {
              updated[index].error = response.message;
            }
          }
          return updated;
        });

        if (response.status === "success") {
          onUploadComplete();
        }
      } catch (error: any) {
        console.error("Upload failed:", error);

        setUploadingFiles((prev) => {
          const updated = [...prev];
          const index = updated.findIndex((f) => f.id === fileId);
          if (index !== -1) {
            updated[index].status = "error";
            updated[index].error = error.message || "Upload failed";
          }
          return updated;
        });
      }
    }
    setIsUploading(false);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      handleFileSelect(acceptedFiles);
    },
    [user, folder_id]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    noClick: true,
    maxSize: MAX_FILE_SIZE,
    accept: ALLOWED_FILE_FORMATS,
    onDropRejected: (fileRejections) => {
      const newRejectedFiles = fileRejections.map((rejection) => ({
        name: rejection.file.name,
        reason:
          rejection.errors[0]?.message ||
          `File exceeds the maximum allowed size of ${formatSize(
            MAX_FILE_SIZE
          )}`,
      }));

      setRejectedFiles((prev) => [...prev, ...newRejectedFiles]);
      showRejectedFilesMessages(newRejectedFiles, message);
    },
  });

  const currentFolder = folder_id
    ? folderStore.folders.find((f) => f.id === folder_id)
    : null;

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(Array.from(e.target.files));
    }
  };

  const handleCloseModal = () => {
    if (!isUploading) {
      setUploadingFiles([]);
      setRejectedFiles([]);
      onClose();
    }
  };

  const handleRetry = async (uploadFile: UploadingFile) => {
    if (!user) return;

    // Reset file status
    setUploadingFiles((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((f) => f.id === uploadFile.id);
      if (index !== -1) {
        updated[index].status = "uploading";
        updated[index].progress = 0;
        updated[index].error = undefined;
      }
      return updated;
    });

    setIsUploading(true);
    try {
      const originalSetUploadProgress =
        fileStore.setUploadProgress.bind(fileStore);
      fileStore.setUploadProgress = (id, progress) => {
        setUploadingFiles((prev) => {
          const updated = [...prev];
          const index = updated.findIndex((f) => f.id === uploadFile.id);
          if (index !== -1) {
            updated[index].progress = progress;
          }
          return updated;
        });
      };

      const response = await fileStore.uploadFile(
        uploadFile.file,
        user.id,
        folder_id
      );
      fileStore.setUploadProgress = originalSetUploadProgress.bind(fileStore);

      setUploadingFiles((prev) => {
        const updated = [...prev];
        const index = updated.findIndex((f) => f.id === uploadFile.id);
        if (index !== -1) {
          updated[index].progress = 100;
          updated[index].status =
            response.status === "success" ? "completed" : "error";
          if (response.status === "error") {
            updated[index].error = response.message;
          }
        }
        return updated;
      });

      if (response.status === "success") {
        message.success(`"${uploadFile.file.name}" uploaded successfully`);
        onUploadComplete();
      } else {
        message.error(
          `Failed to upload "${uploadFile.file.name}": ${response.message}`
        );
      }
    } catch (error: any) {
      setUploadingFiles((prev) => {
        const updated = [...prev];
        const index = updated.findIndex((f) => f.id === uploadFile.id);
        if (index !== -1) {
          updated[index].status = "error";
          updated[index].error = error.message || "Upload failed";
        }
        return updated;
      });

      message.error(
        `Failed to upload "${uploadFile.file.name}": ${
          error.message || "Unknown error"
        }`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const clearRejectedFiles = () => {
    setRejectedFiles([]);
  };

  const getUploadStats = () => {
    const completed = uploadingFiles.filter(
      (f) => f.status === "completed"
    ).length;
    const failed = uploadingFiles.filter((f) => f.status === "error").length;
    const uploading = uploadingFiles.filter(
      (f) => f.status === "uploading"
    ).length;
    const total = uploadingFiles.length;

    return { completed, failed, uploading, total };
  };

  return (
    <Modal
      open={visible}
      onCancel={handleCloseModal}
      footer={null}
      width={480}
      centered
      className="google-upload-modal"
      closable={false}
      maskClosable={!isUploading}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-normal text-[#202124]">
            {isUploading
              ? "Uploading"
              : uploadingFiles.length > 0
              ? "Upload complete"
              : `Upload to ${currentFolder ? currentFolder.name : "My Drive"}`}
          </h2>
          <button
            onClick={handleCloseModal}
            className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f3f4] ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isUploading}
          >
            <X size={20} className="text-[#5f6368]" />
          </button>
        </div>

        {uploadingFiles.length === 0 && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-[#1a73e8] bg-[#e8f0fe]"
                : "border-[#dadce0] hover:border-[#5f6368]"
            }`}
          >
            <input {...getInputProps()} onChange={() => {}} />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              multiple
              style={{ display: "none" }}
            />

            <Upload
              size={48}
              className={`mx-auto mb-4 ${
                isDragActive ? "text-[#1a73e8]" : "text-[#5f6368]"
              }`}
            />
            <p className="text-lg mb-2 text-[#3c4043]">
              {isDragActive ? "Drop your files here" : "Drag files here"}
            </p>
            <p className="text-sm text-[#5f6368] mb-4">or</p>
            <button
              onClick={handleSelectClick}
              className="px-6 py-2 bg-[#1a73e8] text-white rounded hover:bg-[#1765cc] transition-colors"
            >
              Select files
            </button>
          </div>
        )}

        {(uploadingFiles.length > 0 || rejectedFiles.length > 0) && (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {uploadingFiles.length > 0 && !isUploading && (
              <div className="pb-2 mb-2 border-b border-[#e0e0e0]">
                <div className="flex items-center">
                  {getUploadStats().completed > 0 && (
                    <div className="flex items-center mr-4">
                      <CheckCircle size={16} className="text-[#34a853] mr-1" />
                      <span className="text-sm text-[#3c4043]">
                        {getUploadStats().completed} completed
                      </span>
                    </div>
                  )}
                  {getUploadStats().failed > 0 && (
                    <div className="flex items-center">
                      <AlertTriangle
                        size={16}
                        className="text-[#ea4335] mr-1"
                      />
                      <span className="text-sm text-[#3c4043]">
                        {getUploadStats().failed} failed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {uploadingFiles.map((uploadFile) => (
              <div key={uploadFile.id} className="p-3 bg-[#f8f9fa] rounded-lg">
                <div className="flex items-center mb-2">
                  <FileText size={16} className="mr-2 text-[#5f6368]" />
                  <span className="text-sm text-[#3c4043] truncate flex-1 mr-2">
                    {uploadFile.file.name}
                  </span>
                  <span className="text-xs text-[#5f6368] mr-2">
                    {formatSize(uploadFile.file.size)}
                  </span>
                  {uploadFile.status === "completed" && (
                    <CheckCircle size={16} className="text-[#34a853]" />
                  )}
                  {uploadFile.status === "error" && (
                    <Tooltip title={uploadFile.error || "Upload failed"}>
                      <AlertTriangle size={16} className="text-[#ea4335]" />
                    </Tooltip>
                  )}
                </div>
                <div className="flex items-center">
                  <div className="flex-1 mr-2">
                    <Progress
                      percent={uploadFile.progress}
                      size="small"
                      strokeColor={
                        uploadFile.status === "error" ? "#ea4335" : "#1a73e8"
                      }
                      showInfo={false}
                    />
                  </div>
                  {uploadFile.status === "error" && (
                    <Button
                      type="text"
                      size="small"
                      className="text-[#1a73e8] h-6 px-2"
                      onClick={() => handleRetry(uploadFile)}
                    >
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Rejected files section */}
            {rejectedFiles.length > 0 && (
              <div className="p-3 bg-[#fdeded] rounded-lg">
                <div className="flex items-center mb-2">
                  <Info size={16} className="mr-2 text-[#ea4335]" />
                  <span className="text-sm text-[#3c4043] flex-1">
                    {rejectedFiles.length} file
                    {rejectedFiles.length !== 1 ? "s" : ""} couldn&apos;t be
                    uploaded
                  </span>
                  <Button
                    type="text"
                    size="small"
                    className="text-[#1a73e8] h-6 px-2"
                    onClick={clearRejectedFiles}
                  >
                    Dismiss
                  </Button>
                </div>
                <ul className="text-xs text-[#5f6368] pl-6 list-disc">
                  {rejectedFiles.slice(0, 3).map((file, index) => (
                    <li key={index} className="mb-1">
                      <span className="font-medium">{file.name}</span>:{" "}
                      {file.reason}
                    </li>
                  ))}
                  {rejectedFiles.length > 3 && (
                    <li>And {rejectedFiles.length - 3} more file(s)</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-xs text-[#5f6368]">
          <p>Maximum file size: {formatSize(MAX_FILE_SIZE)}</p>
          <p className="mt-1">Files are private unless shared</p>
        </div>

        <div className="mt-6 flex justify-end">
          {uploadingFiles.length === 0 ? (
            <Button
              onClick={handleCloseModal}
              className="border-none shadow-none text-[#1a73e8] hover:bg-[#f1f3f4]"
            >
              Cancel
            </Button>
          ) : (
            !isUploading && (
              <div className="flex space-x-2">
                <Button
                  onClick={handleCloseModal}
                  className="border-none shadow-none text-[#1a73e8] hover:bg-[#f1f3f4]"
                >
                  Close
                </Button>
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <Button className="border-none shadow-none text-[#1a73e8] hover:bg-[#f1f3f4]">
                    Upload more
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </Modal>
  );
};

export default observer(UploadModal);
