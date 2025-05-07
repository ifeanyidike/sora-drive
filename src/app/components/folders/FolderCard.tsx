import React from "react";
import { Star } from "lucide-react";
import { App } from "antd";
import Link from "next/link";
import { Folder } from "@/types";
import { observer } from "mobx-react-lite";
import { rootStore } from "@/store/rootStore";
import ContextMenu from "../layout/ContextMenu";

interface Props {
  folder: Folder;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const FolderCardGrid: React.FC<Props> = ({ folder, isSelected, onSelect }) => {
  const { folderStore } = rootStore;
  const { message } = App.useApp();

  const handleStar = async () => {
    try {
      await folderStore.toggleStar(folder.id);
      message.success(
        folder.starred ? "Removed from starred" : "Added to starred"
      );
    } catch (error) {
      message.error("Failed to update star status");
      console.error("Failed to update star status", error);
    }
  };

  return (
    <>
      <div
        className={`flex items-center p-2 ${
          isSelected ? "bg-blue-100" : "bg-gray-200/80 hover:bg-gray-300"
        } cursor-pointer rounded-xl transition-colors`}
      >
        <div className="flex items-center flex-grow">
          <div className="mr-3">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="#5f6368"
              className="flex-shrink-0"
            >
              <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
            </svg>
          </div>
          <Link
            href={`/dashboard/folders/${folder.id}`}
            className="flex-grow truncate text-sm !text-[#202124]"
            onClick={(e) => e.stopPropagation()}
          >
            {folder.name}
          </Link>
        </div>

        <div className="flex items-center">
          {folder.starred && (
            <button
              className="p-2 rounded-full hover:bg-[#f1f3f4]"
              onClick={handleStar}
            >
              <Star size={16} className="text-[#fbbc04]" fill="#fbbc04" />
            </button>
          )}

          <ContextMenu
            item={folder}
            type="folder"
            onSelect={onSelect}
            className="p-2 rounded-full hover:bg-[#f1f3f4]"
          />
        </div>
      </div>
    </>
  );
};

export default observer(FolderCardGrid);
