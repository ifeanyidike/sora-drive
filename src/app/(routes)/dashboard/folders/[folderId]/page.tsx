"use client";

import React, { useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { Spin, App } from "antd";
import {
  FolderIcon,
  Edit3,
  Share2,
  Info,
  Trash2,
  Star,
  ChevronRight,
  Upload,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useAuth } from "@/lib/auth/context";
import FileCard from "@/app/components/files/FileCard";
import BreadcrumbNavigation from "@/app/components/layout/BreadCrumbNavigation";
import { ViewMode } from "@/types";
import { rootStore } from "@/store/rootStore";
import Image from "next/image";
import Toggle from "@/app/components/layout/Toggle";
import {
  MAX_FILE_SIZE,
  validateAndFilterFiles,
  showRejectedFilesMessages,
  ALLOWED_FILE_FORMATS,
} from "@/lib/utils";
import { formatSize } from "@/lib/utils";
import UploadModal from "@/app/components/files/UploadModal";
import CreateFolder from "@/app/components/folders/CreateFolder";
import { withAuth } from "@/lib/auth/withAuth";

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
}

interface MenuItem {
  key: string;
  label: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
  type?: "divider";
}

const FolderPage = () => {
  const params = useParams();
  const folder_id = params.folderId as string;
  const { fileStore, folderStore } = rootStore;
  const { user } = useAuth();
  const [fileViewMode, setFileViewMode] = useState<ViewMode>("grid");
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const handleFolderCreated = async () => {
    if (user) {
      await folderStore.fetchFolders(user.id);
      message.success("Folder created successfully");
    }
  };

  const handleUploadComplete = async () => {
    setUploadModalOpen(false);
    if (user) {
      await fileStore.fetchFiles(user.id, folder_id || null);
      message.success("Files uploaded successfully");
    }
  };
  const { message } = App.useApp();

  useEffect(() => {
    const fetchData = async () => {
      if (user && folder_id) {
        try {
          await Promise.all([
            folderStore.fetchFolders(user.id),
            fileStore.fetchFiles(user.id, folder_id),
          ]);
        } catch (error) {
          message.error("Failed to load folder contents");
        }
      }
    };

    fetchData();
  }, [user, folder_id, fileStore, folderStore, message]);

  const currentFolder = folderStore.folders.find(
    (folder) => folder.id === folder_id
  );

  const childFolders = folderStore.folders.filter(
    (folder) => folder.parent_id === folder_id && !folder.trashed
  );

  const folderFiles = fileStore.files.filter(
    (file) => file.folder_id === folder_id && !file.trashed
  );

  const allItems = [
    ...childFolders.map((f) => ({ ...f, type: "folder" as const })),
    ...folderFiles.map((f) => ({ ...f, type: "file" as const })),
  ];

  const loading = fileStore.loading || folderStore.loading;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user) {
        message.error("You must be logged in to upload files");
        return;
      }

      setIsUploading(true);

      try {
        const localProgress: Record<string, number> = {};
        const { validFiles, rejectedFiles } =
          validateAndFilterFiles(acceptedFiles);
        showRejectedFilesMessages(rejectedFiles, message);

        if (validFiles.length === 0) {
          setIsUploading(false);
          return;
        }
        const messageKey = `upload-${Date.now()}`;
        message.loading({
          content: "Uploading files...",
          key: messageKey,
          duration: 0,
        });
        const localFileIds = validFiles.map(
          (_, index) => `local-${Date.now()}-${index}`
        );

        localFileIds.forEach((id) => {
          localProgress[id] = 0;
          setUploadProgress((prev) => ({
            ...prev,
            [id]: 0,
          }));
        });

        const results = await fileStore.uploadFiles(
          validFiles,
          user.id,
          folder_id
        );

        localFileIds.forEach((id) => {
          setUploadProgress((prev) => ({
            ...prev,
            [id]: 100,
          }));
        });

        let successCount = 0;
        let errorCount = 0;

        for (const result of results || []) {
          if (result.status === "success") {
            successCount++;
          } else {
            errorCount++;
          }
        }

        message.destroy(messageKey);

        if (successCount > 0 && errorCount === 0) {
          message.success(
            `${successCount} ${
              successCount === 1 ? "file" : "files"
            } uploaded successfully`
          );
        } else if (successCount > 0 && errorCount > 0) {
          message.warning(
            `${successCount} of ${validFiles.length} files uploaded successfully`
          );
        } else if (errorCount > 0) {
          message.error(
            `Failed to upload ${errorCount} ${
              errorCount === 1 ? "file" : "files"
            }`
          );
        }

        if (successCount > 0) {
          await fileStore.fetchFiles(user.id, folder_id);

          setTimeout(() => {
            setUploadProgress({});
          }, 1000);
        }
      } catch (error) {
        console.error("Upload error:", error);
        message.error(
          "Upload failed: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
      } finally {
        setIsUploading(false);
      }
    },
    [user, folder_id, fileStore, message]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: loading || allItems.length > 0,
    maxSize: MAX_FILE_SIZE,
    accept: ALLOWED_FILE_FORMATS,
    onDropRejected: (rejectedItems) => {
      const rejectedFiles = rejectedItems.map((item) => ({
        name: item.file.name,
        reason:
          item.errors[0]?.message ||
          `File exceeds the maximum allowed size of ${formatSize(
            MAX_FILE_SIZE
          )}`,
      }));

      showRejectedFilesMessages(rejectedFiles, message);
    },
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ ...contextMenu, visible: false });
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu]);

  const renderMenuItem = (
    key: string,
    label: string,
    icon: React.ReactNode,
    hasSubmenu: boolean = false,
    shortcut?: string,
    danger: boolean = false,
    onClick?: () => void
  ): MenuItem => {
    return {
      key,
      label: (
        <div className="flex items-center justify-between w-full py-1">
          <div className="flex items-center">
            <span className="mr-3">{icon}</span>
            <span>{label}</span>
          </div>
          <div className="flex items-center">
            {shortcut && (
              <span className="text-[#5f6368] text-xs">{shortcut}</span>
            )}
            {hasSubmenu && <ChevronRight size={16} className="ml-2" />}
          </div>
        </div>
      ),
      danger,
      onClick,
    };
  };

  const contextMenuItems: MenuItem[] = [
    renderMenuItem(
      "new_folder",
      "New folder",
      <FolderIcon size={16} className="text-[#5f6368]" />,
      false,
      "Shift+N",
      false,
      () => setFolderModalOpen(true)
    ),
    { key: "divider-1", type: "divider", label: "" },
    renderMenuItem(
      "file_upload",
      "File Upload",
      <Share2 size={16} className="text-[#5f6368]" />,
      true,
      "",
      false,
      () => setUploadModalOpen(true)
    ),
    renderMenuItem(
      "organize",
      "Organize",
      <FolderIcon size={16} className="text-[#5f6368]" />,
      true
    ),
    renderMenuItem(
      "info",
      "Folder information",
      <Info size={16} className="text-[#5f6368]" />,
      true
    ),
    { key: "divider-2", type: "divider", label: "" },
    renderMenuItem(
      "rename",
      "Rename",
      <Edit3 size={16} className="text-[#5f6368]" />,
      false,
      "⌘+E"
    ),
    renderMenuItem(
      "trash",
      "Move to trash",
      <Trash2 size={16} className="text-[#5f6368]" />,
      false,
      "Delete",
      true
    ),
  ];

  // Render upload progress indicator when files are uploading
  const renderUploadProgress = () => {
    if (Object.keys(uploadProgress).length === 0) return null;

    return (
      <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50 max-w-md w-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-[#202124]">Uploading files</h3>
          {!isUploading && (
            <button
              className="text-[#5f6368] hover:text-[#202124]"
              onClick={() => setUploadProgress({})}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {Object.entries(uploadProgress).map(([fileId, progress]) => (
          <div key={fileId} className="mb-2">
            <div className="flex justify-between text-xs text-[#5f6368] mb-1">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1a73e8] rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div
        {...getRootProps()}
        onClick={(e) => {
          e.preventDefault();
        }}
        onContextMenu={handleContextMenu}
        className="relative min-h-[calc(100vh-200px)]"
      >
        <input {...getInputProps()} />
        <BreadcrumbNavigation folder_id={folder_id} />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl text-[#202124]">
            {currentFolder?.name || "Untitled folder"}
          </h1>

          <Toggle
            onLeftClick={() => setFileViewMode("list")}
            onRightClick={() => setFileViewMode("grid")}
            defaultSelected={fileViewMode === "list" ? "left" : "right"}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-[calc(100vh-250px)]">
            <Spin size="large" />
          </div>
        ) : allItems.length === 0 ? (
          <div
            className={`flex flex-col items-center justify-center h-[calc(100vh-250px)] p-4 transition-all duration-300
              ${
                isDragActive
                  ? "bg-[#e8f0fe] border-2 border-dashed border-[#1a73e8] rounded-lg"
                  : ""
              }`}
          >
            <Image
              src="/new-folder.png"
              alt="Empty folder"
              className="w-40 md:w-60 mb-6"
              width={160}
              height={160}
            />
            <p className="text-[#5f6368] text-xl font-normal mb-2 text-center">
              {isDragActive ? "Drop files here" : "Folder is empty"}
            </p>
            <p className="text-[#5f6368] mb-4 text-center">
              Drop files here or use the "New" button
            </p>
            <p className="text-xs text-[#5f6368] mb-2">
              Maximum file size: {formatSize(MAX_FILE_SIZE)}
            </p>
          </div>
        ) : (
          <div
            className={`
              ${isDragActive ? "relative" : ""}
              ${
                fileViewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                  : "space-y-2"
              }
            `}
          >
            {allItems.map((item) => (
              <FileCard
                key={item.id}
                item={item}
                type={item.type}
                onSelect={() =>
                  rootStore.setSelectedItem({
                    id: item.id,
                    type: "file",
                  })
                }
              />
            ))}

            {isDragActive && (
              <div className="absolute inset-0 bg-[#e8f0fe]/80 border-2 border-dashed border-[#1a73e8] rounded-lg flex items-center justify-center z-10">
                <div className="text-center p-6 bg-white/90 rounded-lg shadow-md">
                  <Upload size={48} className="mx-auto mb-4 text-[#1a73e8]" />
                  <p className="text-xl font-medium text-[#202124] mb-2">
                    Drop files to upload
                  </p>
                  <p className="text-sm text-[#5f6368]">
                    Maximum file size: {formatSize(MAX_FILE_SIZE)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {renderUploadProgress()}
      </div>
      \
      {contextMenu.visible && (
        <div
          className="fixed bg-white shadow-lg rounded-md py-2 z-50 min-w-[240px]"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
        >
          {contextMenuItems.map((item) =>
            item.type === "divider" ? (
              <div
                key={item.key}
                className="border-t border-[#e0e0e0] my-1"
              ></div>
            ) : (
              <div
                key={item.key}
                className={`px-4 py-2 hover:bg-[#f1f3f4] cursor-pointer ${
                  item.danger ? "text-[#ea4335]" : ""
                }`}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (item.onClick) item.onClick();
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                {item.label}
              </div>
            )
          )}
        </div>
      )}
      <UploadModal
        visible={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        folder_id={folder_id || null}
        onUploadComplete={handleUploadComplete}
      />
      <CreateFolder
        parent_id={folder_id || null}
        visible={folderModalOpen}
        onClose={() => {
          setFolderModalOpen(false);
          handleFolderCreated();
        }}
      />
    </>
  );
};

export default withAuth(observer(FolderPage));
