import React, { useState } from "react";
import { Modal, Input, App } from "antd";
import { Folder } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { rootStore } from "@/store/rootStore";
import { observer } from "mobx-react-lite";

interface Props {
  parent_id: string | null;
  visible: boolean;
  onClose: () => void;
}

const CreateFolder: React.FC<Props> = ({ parent_id, visible, onClose }) => {
  const { folderStore } = rootStore;
  const { user } = useAuth();
  const [folderName, setFolderName] = useState("Untitled folder");
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      message.error("Folder name cannot be empty");
      return;
    }

    if (!user) {
      message.error("You must be logged in");
      return;
    }

    setLoading(true);

    try {
      const newFolder = {
        id: crypto.randomUUID(),
        name: folderName.trim(),
        parent_id: parent_id,
        user_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
        trashed: false,
        starred: false,
      };

      await folderStore.createFolder(newFolder);
      message.success("Folder created");
      setFolderName("Untitled folder");
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
      title={
        <div className="flex items-center gap-3">
          <Folder size={20} className="text-[#5f6368]" />
          <span className="text-[#202124]">New folder</span>
        </div>
      }
      open={visible}
      onCancel={() => {
        setFolderName("Untitled folder");
        onClose();
      }}
      onOk={handleCreateFolder}
      confirmLoading={loading}
      okText="Create"
      cancelText="Cancel"
      okButtonProps={{
        className:
          "bg-[#1a73e8] text-white hover:bg-[#1765cc] border-[#1a73e8]",
      }}
      width={400}
      centered
    >
      <div className="mt-6">
        <Input
          placeholder="Untitled folder"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className="border border-[#dadce0] focus:border-[#1a73e8] focus:shadow-none rounded-md"
          onPressEnter={handleCreateFolder}
          autoFocus
          onFocus={(e) => e.target.select()}
        />
      </div>
    </Modal>
  );
};

export default observer(CreateFolder);
