import React, { useState, useEffect } from "react";
import { Trash2, Download, Share2, Star, X, TrashIcon } from "lucide-react";
import { App } from "antd";
import { rootStore } from "@/store/rootStore";
import { usePathname } from "next/navigation";
import { observer } from "mobx-react-lite";

interface SelectionManagerProps {
  selectedItem: { id: string; type: "file" | "folder" };
  onDelete?: () => void;
}

const SelectionManager: React.FC<SelectionManagerProps> = ({
  selectedItem,
  onDelete,
}) => {
  const { fileStore, folderStore } = rootStore;
  const { message } = App.useApp();
  const [visible, setVisible] = useState(false);

  const pathname = usePathname();
  const inTrashRoute = pathname.includes("trashed");
  const inStarred = pathname.includes("starred");

  useEffect(() => {
    setVisible(!!selectedItem);
  }, [selectedItem]);

  const handleTrash = async () => {
    try {
      if (selectedItem.type === "file") {
        await fileStore.moveToTrash(selectedItem.id);
      } else {
        await folderStore.moveToTrash(selectedItem.id);
      }
      rootStore.clearSelection();
      message.success(`${selectedItem.type}  moved to trash`);
    } catch (error) {
      console.log("error", error);
      message.error("Failed to move items to trash");
    }
  };

  const handleDownload = () => {
    if (selectedItem.type !== "file") {
      message.info("No files selected for download");
      return;
    }

    const file = fileStore.files.find((f) => f.id === selectedItem.id);
    if (file && file.url) {
      window.open(file.url, "_blank");
    }
  };

  const handleStar = async () => {
    try {
      if (selectedItem.type === "file") {
        const file = fileStore.files.find((f) => f.id === selectedItem.id);
        if (file) {
          await fileStore.toggleStar(selectedItem.id);
        }
      } else {
        const folder = folderStore.folders.find(
          (f) => f.id === selectedItem.id
        );
        if (folder) {
          await folderStore.toggleStar(selectedItem.id);
        }
      }

      message.success(`${selectedItem.type}  updated`);
    } catch (error) {
      message.error("Failed to update star status");
    }
  };

  if (!visible) return null;

  return (
    <div className="selection-manager w-full h-16 bg-white border-b border-[#dadce0] z-50 shadow-sm flex items-center justify-between px-4">
      <div className="flex items-center">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f1f3f4] transition-all mr-4"
          onClick={() => {
            rootStore.clearSelection();
          }}
          aria-label="Clear selection"
        >
          <X size={20} className="text-[#5f6368]" />
        </button>
        <span className="text-[#202124] font-medium">1 item selected</span>
      </div>

      <div className="flex items-center space-x-2">
        {!inStarred && (
          <button
            className="h-10 flex items-center justify-center rounded-md px-3 hover:bg-[#f1f3f4] transition-all"
            onClick={handleStar}
            title="Star"
          >
            <Star size={18} className="text-[#5f6368] mr-2" />
            <span className="text-[#5f6368] text-sm">Star</span>
          </button>
        )}

        <button
          className="h-10 flex items-center justify-center rounded-md px-3 hover:bg-[#f1f3f4] transition-all"
          onClick={handleDownload}
          title="Download"
        >
          <Download size={18} className="text-[#5f6368] mr-2" />
          <span className="text-[#5f6368] text-sm">Download</span>
        </button>

        <button
          className="h-10 flex items-center justify-center rounded-md px-3 hover:bg-[#f1f3f4] transition-all"
          onClick={handleTrash}
          title="Move to trash"
        >
          <Trash2 size={18} className="text-[#5f6368] mr-2" />
          <span className="text-[#5f6368] text-sm">
            {inTrashRoute ? "Restore from trash" : "Move to trash"}
          </span>
        </button>

        {onDelete && (
          <button
            className="h-10 flex items-center justify-center  rounded-md px-3 hover:bg-[#f1f3f4] transition-all"
            onClick={handleTrash}
            title="Delete permanently"
          >
            <TrashIcon size={18} className="text-red-500 mr-2" />
            <span className="text-[#5f6368] text-sm">Delete</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default observer(SelectionManager);
