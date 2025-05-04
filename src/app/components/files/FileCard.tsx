import { observer } from "mobx-react-lite";
import React, { useState } from "react";

import { type File as FileType } from "@/types";
import { rootStore } from "@/store/rootStore";
import { Edit, File, FolderInput, MoreVertical, Trash2 } from "lucide-react";
import { Button, Card, Dropdown, message, Modal } from "antd";
import Link from "next/link";

type Props = {
  file: FileType;
};

const FileCard = ({ file }: Props) => {
  const { fileStore, folderStore } = rootStore;
  const [renameModal, toggleRenameModal] = useState(false);
  const [moveModal, toggleMoveModal] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    file.folderId
  );
  const getFileIcon = () => {
    if (file.type.includes("image"))
      return (
        <img
          src={file.url}
          alt={file.name}
          className="h-12 w-12 object-cover"
        />
      );
    if (file.type.includes("pdf"))
      return <File size={48} className="text-red-500" />;
    return <File size={48} className="text-blue-500" />;
  };

  const handleRename = async () => {
    try {
      await fileStore.renameFile(file.id, newName);
      message.success("File renamed successfully");
      toggleRenameModal(false);
    } catch (error) {
      message.error("Failed to rename file");
    }
  };

  const handleMove = async () => {
    try {
      await fileStore.moveFile(file.id, selectedFolderId);
      message.success("File moved successfully");
      toggleMoveModal(false);
    } catch (error) {
      message.error("Failed to move file");
    }
  };

  const handleDelete = async () => {
    try {
      await fileStore.deleteFile(file.id);
      message.success("File deleted successfully");
    } catch (error) {
      message.error("Failed to delete file");
    }
  };

  const menu = [
    {
      key: "1",
      label: "Rename",
      icon: <Edit size={16} />,
      onClick: () => toggleRenameModal(true),
    },
    {
      key: "2",
      label: "Move",
      icon: <FolderInput size={16} />,
      onClick: () => toggleMoveModal(true),
    },
    {
      key: "3",
      label: "Delete",
      icon: <Trash2 size={16} />,
      danger: true,
      onClick: handleDelete,
    },
  ];

  return (
    <>
      <Card
        hoverable
        className="w-full"
        actions={[
          <Dropdown menu={{ items: menu }} trigger={["click"]} key="more">
            <MoreVertical size={16} className="cursor-pointer" />
          </Dropdown>,
        ]}
      >
        <Link href={`/files/${file.id}`} className="flex flex-col items-center">
          <div className="flex justify-center mb-2">{getFileIcon()}</div>
          <div className="text-center truncate w-full">{file.name}</div>
          <div className="text-xs text-gray-500 mt-1">
            {(file.size / 1024).toFixed(2)} KB
          </div>
        </Link>
      </Card>

      <Modal
        title="Rename File"
        open={renameModal}
        onCancel={() => toggleRenameModal(false)}
        footer={[
          <Button key="cancel" onClick={() => toggleRenameModal(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleRename}>
            Rename
          </Button>,
        ]}
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </Modal>

      <Modal
        title="Move File"
        open={moveModal}
        onCancel={() => toggleMoveModal(false)}
        footer={[
          <Button key="cancel" onClick={() => toggleMoveModal(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleMove}>
            Move
          </Button>,
        ]}
      >
        <div className="mb-4">
          <label className="block mb-2">Select destination folder:</label>
          <select
            value={selectedFolderId || ""}
            onChange={(e) => setSelectedFolderId(e.target.value || null)}
            className="w-full p-2 border rounded"
          >
            <option value="">Root Directory</option>
            {folderStore.folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </>
  );
};

export default observer(FileCard);
