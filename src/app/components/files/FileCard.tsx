import React from "react";
import { Star } from "lucide-react";
import Link from "next/link";
import { File, Folder } from "@/types";
import { observer } from "mobx-react-lite";
import FilePreview from "./FilePreview";
import { getThumbnailIcon } from "@/lib/utils";
import ContextMenu from "../layout/ContextMenu";

type Props = {
  item: File | Folder;
  type: "file" | "folder";
  onSelect: (id: string) => void;
  inTrash?: boolean;
  onDelete?: () => Promise<void>;
};

const FileCard: React.FC<Props> = ({
  item,
  type,
  onSelect,
  inTrash,
  onDelete,
}) => {
  return (
    <>
      <div className="group relative h-64 rounded-lg border border-[#dadce0] bg-white hover:bg-[#f8f9fa] hover:shadow-md transition-all overflow-hidden">
        <Link
          href={
            type === "folder"
              ? `/dashboard/folders/${item.id}`
              : `/files/${item.id}`
          }
          className="block h-full no-underline"
        >
          <div className="flex  py-2">
            <div className="flex w-[calc(100%-80px) items-center truncate">
              {getThumbnailIcon(type, "16", (item as File).type)}

              <div className="text-sm text-[#202124] truncate max-w-[calc(100%-20px)]">
                {item.name}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center mx-3 h-40 bg-gray-100 border border-[#e0e0e0] rounded overflow-hidden">
            <FilePreview
              file={item as File}
              documentHeight="h-auto"
              width="w-auto"
              minimal
            />
          </div>
        </Link>

        <ContextMenu
          item={item}
          type={type}
          onSelect={onSelect}
          inTrash={inTrash}
          onDelete={onDelete}
          className="absolute top-2 right-2 w-6 h-6 flex cursor-pointer items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-[#e8eaed] transition-all"
        />

        {item.starred && (
          <div className="absolute top-0 left-0 w-0 h-0 border-t-[24px] border-t-[#fbbc04] border-r-[24px] border-r-transparent">
            <Star
              size={10}
              className="absolute -top-[18px] -left-[14px] text-white"
              fill="white"
            />
          </div>
        )}
      </div>
    </>
  );
};

export default observer(FileCard);
