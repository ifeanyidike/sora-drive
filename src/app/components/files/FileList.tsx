import React from "react";
import { observer } from "mobx-react-lite";
import { Star } from "lucide-react";
import Link from "next/link";
import { File, Folder } from "@/types";
import { App } from "antd";
import { rootStore } from "@/store/rootStore";
import { formatDate, formatSize, getThumbnailIcon } from "@/lib/utils";
import ContextMenu from "../layout/ContextMenu";

interface FileListProps {
  items: (File | (Folder & { type: "file" | "folder" }))[];
}

const FileListView: React.FC<FileListProps> = ({ items }) => {
  const { fileStore, folderStore } = rootStore;
  const { message } = App.useApp();

  const handleStar = async (
    e: React.MouseEvent,
    item: File | (Folder & { type: "file" | "folder" })
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (item.type === "file") {
        await fileStore.toggleStar(item.id);
      } else {
        await folderStore.toggleStar(item.id);
      }
      message.success(
        item.starred ? "Removed from starred" : "Added to starred"
      );
    } catch (error) {
      message.error("Failed to update star status");
    }
  };
  return (
    <div className="rounded-lg border border-[#dadce0] overflow-hidden bg-white">
      <div className="flex items-center py-2 px-4 bg-[#f8f9fa] border-b border-[#dadce0]">
        <div className="w-10"></div>
        <div className="flex-grow text-sm font-medium text-[#5f6368]">Name</div>
        <div className="flex items-center">
          <div className="text-sm font-medium text-[#5f6368] w-32 text-right mr-4 hidden md:block">
            Last modified
          </div>
          <div className="text-sm font-medium text-[#5f6368] w-24 text-right mr-4 hidden md:block">
            File size
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          className="group flex items-center min-w-0 border-b last:border-b-0 border-[#dadce0] hover:bg-[#f8f9fa] transition-colors"
        >
          <div className="flex items-center py-2 px-4 w-full">
            <div className="mr-3 flex-shrink-0">
              {getThumbnailIcon(item.type as any, "18", (item as File).type)}
            </div>

            <Link
              href={
                item.type === "folder"
                  ? `/dashboard/folders/${item.id}`
                  : `/files/${item.id}`
              }
              className="max-w-[180px] sm:max-w-[220px] md:max-w-full flex-grow min-w-0 overflow-hidden whitespace-nowrap text-ellipsis truncate md:whitespace-normal md:overflow-visible md:text-clip text-sm text-[#202124] hover:text-[#1a73e8]"
              title={item.name}
            >
              {item.name}
            </Link>

            <div className="flex items-center ml-auto">
              {item.starred && (
                <button
                  className="p-2 rounded-full hover:bg-[#f1f3f4]"
                  onClick={(e) => handleStar(e, item)}
                >
                  <Star size={16} className="text-[#fbbc04]" fill="#fbbc04" />
                </button>
              )}

              <div className="text-sm text-[#5f6368] w-32 text-right mr-4 hidden md:block">
                {formatDate(item.updated_at || item.created_at)}
              </div>

              {item.type === "file" && (
                <div className="text-sm text-[#5f6368] w-24 text-right mr-4 hidden md:block">
                  {formatSize((item as File).size || 0)}
                </div>
              )}
              {item.type !== "file" && (
                <div className="text-sm text-[#5f6368] w-24 text-right mr-4">
                  -
                </div>
              )}

              <div className="relative">
                <ContextMenu
                  item={item}
                  onSelect={() => {}}
                  type={item.type as any}
                  left="left-28"
                  className="p-2 rounded-full hover:bg-[#f1f3f4]"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default observer(FileListView);
