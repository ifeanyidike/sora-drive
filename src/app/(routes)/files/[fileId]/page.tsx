"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Layout, Spin, Button, App, Dropdown } from "antd";
import {
  ArrowLeft,
  Download,
  Star,
  Trash2,
  MoreVertical,
  Info,
  FileIcon,
  Edit3,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { withAuth } from "@/lib/auth/withAuth";
import { rootStore } from "@/store/rootStore";
import { useAuth } from "@/lib/auth/context";
import BreadcrumbNavigation from "@/app/components/layout/BreadCrumbNavigation";
import FilePreview from "@/app/components/files/FilePreview";
import { getThumbnailIcon } from "@/lib/utils";

const { Content } = Layout;

const FilePage = () => {
  const params = useParams();
  const router = useRouter();
  const fileId = params.fileId as string;
  const { folderStore, fileStore } = rootStore;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user && fileId) {
        try {
          setLoading(true);
          await Promise.all([
            folderStore.fetchFolders(user.id),
            fileStore.fetchFile(fileId, user.id),
          ]);
        } catch (error) {
          console.error("Error fetching file:", error);
          message.error("Failed to load file");
          router.push("/");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user, fileId]);

  const file = fileStore.currentFile;

  const handleDownload = () => {
    if (file) {
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success("Download started");
    }
  };

  const handleStar = async () => {
    if (file) {
      await fileStore.toggleStar(file.id);
      message.success(
        file.starred ? "Removed from starred" : "Added to starred"
      );
    }
  };

  const handleTrash = async () => {
    if (file) {
      await fileStore.moveToTrash(file.id);
      message.success("Moved to trash");
      router.push(file.folder_id ? `/${file.folder_id}` : "/");
    }
  };

  const handleBack = () => {
    if (file && file.folder_id) {
      router.push(`/${file.folder_id}`);
    } else {
      router.push("/");
    }
  };

  const menuItems = [
    {
      key: "rename",
      label: (
        <div className="flex items-center py-1">
          <Edit3 size={16} className="text-[#5f6368] mr-3" />
          <span>Rename</span>
        </div>
      ),
    },
    {
      key: "info",
      label: (
        <div className="flex items-center py-1">
          <Info size={16} className="text-[#5f6368] mr-3" />
          <span>File information</span>
        </div>
      ),
    },
    { type: "divider" },
    {
      key: "trash",
      label: (
        <div className="flex items-center py-1">
          <Trash2 size={16} className="text-[#5f6368] mr-3" />
          <span>Move to trash</span>
        </div>
      ),
      danger: true,
      onClick: handleTrash,
    },
  ];

  if (loading) {
    return (
      <Layout className="min-h-screen bg-[#f8f9fa]">
        <Content className="w-full mx-auto">
          <div className="flex justify-center items-center h-screen">
            <Spin size="large" />
          </div>
        </Content>
      </Layout>
    );
  }

  if (!file) {
    return (
      <Layout className="min-h-screen bg-[#f8f9fa]">
        <Content className="w-full mx-auto">
          <div className="flex justify-center items-center h-screen">
            <div className="text-center bg-white p-8 rounded-lg shadow-md">
              <FileIcon size={64} className="text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#202124] mb-4">
                File not found
              </h2>
              <p className="text-[#5f6368] mb-6">
                The file you're looking for may have been deleted or moved.
              </p>
              <Button
                type="primary"
                onClick={() => router.push("/")}
                className="bg-[#1a73e8] hover:bg-[#1765cc]"
              >
                Back to My Drive
              </Button>
            </div>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout
      className={`min-h-screen bg-[#f8f9fa] ${
        isFullscreen ? "overflow-hidden" : ""
      }`}
    >
      <div className="flex flex-col w-full">
        <div
          className={`bg-white border-b border-[#dadce0] sticky top-0 z-10 ${
            isFullscreen
              ? "opacity-0 pointer-events-none hover:opacity-100 hover:pointer-events-auto transition-opacity"
              : ""
          }`}
        >
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="p-2 rounded-full hover:bg-[#f1f3f4] mr-2"
                aria-label="Back"
              >
                <ArrowLeft size={20} className="text-[#5f6368]" />
              </button>
              <div className="flex items-center">
                {getThumbnailIcon("file", "24", file.type)}
                <h1 className="text-lg md:text-xl font-medium text-[#202124] truncate max-w-[160px] sm:max-w-xl md:max-w-2xl">
                  {file.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                type="text"
                icon={<Download size={18} />}
                onClick={handleDownload}
                className="text-[#5f6368] hover:bg-[#f1f3f4]"
                title="Download"
              >
                <span className="hidden sm:inline">Download</span>
              </Button>
              <Button
                type="text"
                icon={
                  <Star
                    size={18}
                    fill={file.starred ? "currentColor" : "none"}
                  />
                }
                onClick={handleStar}
                className={`hover:bg-[#f1f3f4] ${
                  file.starred ? "text-[#fbbc04]" : "text-[#5f6368]"
                }`}
                title={file.starred ? "Remove from Starred" : "Add to Starred"}
              />
              <Dropdown
                menu={{
                  //@ts-expect-error allow the use of divider
                  items: menuItems,
                  style: { minWidth: "200px" },
                }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  icon={<MoreVertical size={18} />}
                  className="text-[#5f6368] hover:bg-[#f1f3f4]"
                  title="More actions"
                />
              </Dropdown>
            </div>
          </div>

          <div className="px-4 pb-2">
            <BreadcrumbNavigation folder_id={file.folder_id} />
          </div>
        </div>

        <div
          className={`flex-1 bg-[#f8f9fa] ${isFullscreen ? "h-screen" : ""}`}
        >
          <div className="max-w-screen-2xl mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <FilePreview
                file={file}
                documentHeight={isFullscreen ? "h-screen" : "h-[80vh]"}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(observer(FilePage));
