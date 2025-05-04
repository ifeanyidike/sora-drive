import { useAuth } from "@/lib/auth/context";
import { rootStore } from "@/store/rootStore";
import { Button, Input, message, Modal } from "antd";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";

type Props = {
  parentId: string | null;
  visible: boolean;
  onClose: () => void;
};

const CreateFolder = ({ parentId, visible, onClose }: Props) => {
  const { folderStore } = rootStore;
  const { user } = useAuth();
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      message.error("Folder name cannot be empty");
      return;
    }

    if (!user) {
      message.error("User is not logged in");
      return;
    }
    setLoading(true);
    try {
      await folderStore.createFolder({
        id: crypto.randomUUID(),
        name: folderName.trim(),
        userId: user.id,
        parentId: parentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      message.success("Folder created successfully");
      setFolderName("");
      onClose();
    } catch (error) {
      console.error("Error creating folder:", error);
      message.error("Failed to create folder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create Folder"
      open={visible}
      //   onOk={handleCreateFolder}
      onCancel={onClose}
      confirmLoading={loading}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="create"
          type="primary"
          loading={loading}
          onClick={handleCreateFolder}
        >
          Create
        </Button>,
      ]}
    >
      <Input
        placeholder="Enter folder name"
        value={folderName}
        onChange={(e) => setFolderName(e.target.value)}
        onPressEnter={handleCreateFolder}
        autoFocus
      />
    </Modal>
  );
};

export default observer(CreateFolder);
