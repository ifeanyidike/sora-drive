"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import "@ant-design/v5-patch-for-react-19";
import { Spin, Button, App, Modal } from "antd";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { withAuth } from "@/lib/auth/withAuth";
import FileCard from "@/app/components/files/FileCard";
import { ViewMode } from "@/types";
import { rootStore } from "@/store/rootStore";
import Image from "next/image";
import Toggle from "@/app/components/layout/Toggle";
import SelectionManager from "@/app/components/layout/SelectionManager";

const { confirm } = Modal;

const TrashPage = () => {
  const { fileStore, folderStore, selectedItem, clearSelection } = rootStore;
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { message } = App.useApp();

  useEffect(() => {
    if (user) {
      fileStore.fetchTrashedFiles(user.id);
      folderStore.fetchTrashedFolders(user.id);
    }
  }, [user]);

  const trashedItems = [
    ...folderStore.folders
      .filter((f) => f.trashed)
      .map((f) => ({ ...f, type: "folder" })),
    ...fileStore.files
      .filter((f) => f.trashed)
      .map((f) => ({ ...f, type: "file" })),
  ];

  const loading = fileStore.loading || folderStore.loading;

  const emptyTrash = async () => {
    if (!user) return;

    confirm({
      title: "Empty Trash",
      content:
        "Are you sure you want to permanently delete all items in the trash? This action cannot be undone.",
      okText: "Delete All",
      okType: "danger",
      cancelText: "Cancel",
      async onOk() {
        try {
          message.loading("Emptying trash...");
          const fileResult = await fileStore.emptyTrash(user.id);
          const folderResult = await folderStore.emptyTrash(user.id);

          if (
            fileResult.status === "success" &&
            folderResult.status === "success"
          ) {
            message.success("Trash emptied successfully");
          } else {
            message.error("Failed to empty trash");
          }
        } catch (error) {
          console.error("Error emptying trash:", error);
          message.error("Failed to empty trash");
        }
      },
    });
  };

  const permanentlyDeleteItem = async (
    itemId: string,
    itemType: "file" | "folder"
  ) => {
    if (!user) return;

    confirm({
      title: "Delete Permanently",
      content:
        "Are you sure you want to permanently delete this item? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      async onOk() {
        try {
          message.loading("Deleting item...");

          let result;
          if (itemType === "file") {
            result = await fileStore.permanentlyDeleteFile(itemId);
          } else {
            result = await folderStore.permanentlyDeleteFolder(itemId);
          }

          if (result && result.status === "success") {
            message.success("Item deleted permanently");
            clearSelection();
          } else {
            message.error(
              (result && result.message) || "Failed to delete item"
            );
          }
        } catch (error) {
          console.error("Error deleting item:", error);
          message.error("Failed to delete item");
        }
      },
    });
  };

  const renderSelectionManager = () => {
    if (!selectedItem) return null;

    return (
      <SelectionManager
        selectedItem={selectedItem}
        onDelete={() =>
          permanentlyDeleteItem(selectedItem.id, selectedItem.type)
        }
      />
    );
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl text-[#202124]">Trash</h1>

        <div className="flex items-center gap-4">
          {trashedItems.length > 0 && (
            <Button onClick={emptyTrash} danger icon={<Trash2 size={16} />}>
              Empty trash
            </Button>
          )}
          <Toggle
            onLeftClick={() => setViewMode("list")}
            onRightClick={() => setViewMode("grid")}
            defaultSelected={viewMode === "list" ? "left" : "right"}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[calc(100vh-250px)]">
          <Spin size="large" />
        </div>
      ) : trashedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] p-4">
          <Image
            src="/trashed.png"
            alt="Trash is empty"
            className="w-48 md:w-64 mb-6"
            width={192}
            height={192}
          />
          <h2 className="text-xl mb-2 text-center text-[#202124]">
            Trash is empty
          </h2>
          <p className="text-[#5f6368] text-center">
            Items moved to trash will be deleted forever after 30 days
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-[#5f6368] mb-4">
            Items in trash are deleted forever after 30 days
          </p>
          {renderSelectionManager()}
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                : "space-y-2"
            }
          >
            {trashedItems.map((item) => (
              <FileCard
                key={item.id}
                item={item}
                type={item.type as "file" | "folder"}
                onSelect={() =>
                  rootStore.setSelectedItem({
                    id: item.id,
                    type: item.type as "file" | "folder",
                  })
                }
                inTrash={true}
                onDelete={() =>
                  permanentlyDeleteItem(item.id, item.type as "file" | "folder")
                }
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default withAuth(observer(TrashPage));
