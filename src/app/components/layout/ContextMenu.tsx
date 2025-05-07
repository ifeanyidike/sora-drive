import { rootStore } from "@/store/rootStore";
import { File, Folder } from "@/types";
import { App, Dropdown, Input, Modal } from "antd";
import {
  ChevronRight,
  Download,
  Edit3,
  FolderIcon,
  Info,
  MoreVertical,
  Star,
  Trash2,
} from "lucide-react";
import { usePathname } from "next/navigation";
import React, { FC, useState } from "react";

type Props = {
  item: File | Folder;
  type: "file" | "folder";
  onSelect: (id: string) => void;
  inTrash?: boolean;
  onDelete?: () => Promise<void>;
  className?: string;
  left?: string;
};
const ContextMenu: FC<Props> = ({
  item,
  type,
  onSelect,
  inTrash,
  onDelete,
  className,
  left = "left-56",
}) => {
  const pathname = usePathname();
  const { fileStore, folderStore } = rootStore;
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const { message } = App.useApp();

  const inTrashRoute = pathname.includes("trashed");
  const inStarred = pathname.includes("starred");

  const handleStar = async () => {
    try {
      if (type === "file") {
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

  const handleTrash = async () => {
    try {
      if (type === "file") {
        await fileStore.moveOrRestoreTrash(item.id);
      } else {
        await folderStore.moveOrRestoreTrash(item.id);
      }
      message.success("Moved to trash");
    } catch (error) {
      message.error(`Failed to move ${type} to trash`);
    }
  };

  const handleRename = async () => {
    if (!newName.trim()) {
      message.error("Name cannot be empty");
      return;
    }

    try {
      if (type === "file") {
        await fileStore.renameFile(item.id, newName);
      } else {
        await folderStore.renameFolder(item.id, newName);
      }
      message.success("Renamed successfully");
      setRenameModalOpen(false);
    } catch (error) {
      message.error(`Failed to rename ${type}`);
    }
  };

  const handleDownload = () => {
    if (type === "file") {
      const file = item as File;
      if (file.url) {
        window.open(file.url, "_blank");
      } else {
        message.error("Download link not available");
      }
    }
  };

  const renderMenuItem = (
    key: string,
    label: string,
    icon: React.ReactNode,
    hasSubmenu?: boolean,
    shortcut?: string,
    danger?: boolean,
    onClick?: (e: React.MouseEvent) => void,
    disabled?: boolean
  ) => {
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
      disabled,
      onClick,
    };
  };

  const menuItems = [
    renderMenuItem(
      "open",
      "Open with",
      <FolderIcon size={16} className="text-[#5f6368]" />,
      true
    ),
    renderMenuItem(
      "download",
      "Download",
      <Download size={16} className="text-[#5f6368]" />,
      false,
      undefined,
      false,
      handleDownload,
      type === "folder"
    ),
    renderMenuItem(
      "rename",
      "Rename",
      <Edit3 size={16} className="text-[#5f6368]" />,
      false,
      "⌘+E",
      false,
      () => setRenameModalOpen(true)
    ),

    renderMenuItem(
      "organize",
      "Organize",
      <FolderIcon size={16} className="text-[#5f6368]" />,
      true
    ),
    renderMenuItem(
      "info",
      `${type.charAt(0).toUpperCase() + type.slice(1)} information`,
      <Info size={16} className="text-[#5f6368]" />,
      true
    ),
    { type: "divider" },
  ];

  if (!inStarred) {
    menuItems.push(
      renderMenuItem(
        "star",
        "Star",
        <Star size={16} className="text-[#5f6368]" />,
        true,
        "",
        false,
        () => handleStar()
      )
    );
  }

  if (!inTrash && !inTrashRoute) {
    menuItems.push(
      renderMenuItem(
        "trash",
        "Move to trash",
        <Trash2 size={16} className="text-[#5f6368]" />,
        false,
        "Delete",
        true,
        handleTrash
      )
    );
  }

  if (inTrash) {
    menuItems.push(
      renderMenuItem(
        "delete",
        "Delete permanently",
        <Trash2 size={16} />,
        false,
        "",
        true,
        (e: any) => {
          e.stopPropagation();
          onDelete?.();
        }
      )
    );
  }

  return (
    <>
      <Dropdown
        menu={{
          //@ts-expect-error allow the use of divider
          items: menuItems,
          style: { minWidth: "240px" },
          className: `${left} top-0`,
        }}
        trigger={["click"]}
        placement="bottomRight"
      >
        <button
          className={`${className} cursor-pointer`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item.id);
          }}
        >
          <MoreVertical size={14} className="text-[#5f6368]" />
        </button>
      </Dropdown>
      <Modal
        title="Rename"
        open={renameModalOpen}
        onCancel={() => setRenameModalOpen(false)}
        onOk={handleRename}
        okText="Rename"
        cancelText="Cancel"
        okButtonProps={{ className: "bg-[#1a73e8] hover:bg-[#1765cc]" }}
      >
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="mt-4"
          autoFocus
        />
      </Modal>
    </>
  );
};

export default ContextMenu;
