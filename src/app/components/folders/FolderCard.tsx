import { rootStore } from "@/store/rootStore";
import { Folder as FolderType } from "@/types";
import { Button, Card, Dropdown, message, Modal } from "antd";
import { Edit, Folder, MoreVertical, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import React, { useState } from "react";

type Props = {
  folder: FolderType;
};
const FolderCard = ({ folder }: Props) => {
  const { folderStore } = rootStore;
  const [renameModal, toggleRenameModal] = useState(false);
  const [newName, setNewName] = useState(folder.name);

  const handleRename = async () => {
    try {
      await folderStore.renameFolder(folder.id, newName);
      message.success("Folder renamed successfully");
      toggleRenameModal(false);
    } catch (error) {
      message.error("Failed to rename folder");
      console.error("Failed to rename folder", error);
    }
  };

  const handleDelete = async () => {
    try {
      await folderStore.deleteFolder(folder.id);
      message.success("Folder deleted successfully");
    } catch (error) {
      message.error("Failed to delete folder");
      console.error("Failed to delete folder", error);
    }
  };

  const handleMove = async () => {
    try {
      await folderStore.moveFolder(folder.id, folder.parentId);
      message.success("Folder moved successfully");
    } catch (error) {
      message.error("Failed to move folder");
      console.error("Failed to move folder", error);
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
      key: "3",
      label: "Delete",
      icon: <Trash2 size={16} />,
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
        <Link
          href={`/dashboard/${folder.id}`}
          className="flex flex-col items-center"
        >
          <div className="flex justify-center mb-2">
            <Folder size={48} className="text-yellow-500" />
          </div>
          <div className="text-center truncate w-full">{folder.name}</div>
        </Link>
      </Card>
      <Modal
        title="Rename Folder"
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
    </>
  );
};

export default observer(FolderCard);
