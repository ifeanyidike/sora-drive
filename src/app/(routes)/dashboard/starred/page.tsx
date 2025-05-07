"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Spin } from "antd";
import { useAuth } from "@/lib/auth/context";
import { withAuth } from "@/lib/auth/withAuth";
import FileCard from "@/app/components/files/FileCard";
import { ViewMode } from "@/types";
import { rootStore } from "@/store/rootStore";
import Image from "next/image";
import Toggle from "@/app/components/layout/Toggle";
import SelectionManager from "@/app/components/layout/SelectionManager";

const StarredPage = () => {
  const { fileStore, folderStore, selectedItem, clearSelection } = rootStore;
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    if (user) {
      fileStore.fetchStarredFiles(user.id);
      folderStore.fetchStarredFolders(user.id);
    }
  }, [user]);

  const starredItems = [
    ...folderStore.folders
      .filter((f) => f.starred)
      .map((f) => ({ ...f, type: "folder" })),
    ...fileStore.files
      .filter((f) => f.starred)
      .map((f) => ({ ...f, type: "file" })),
  ];

  const loading = fileStore.loading || folderStore.loading;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl text-[#202124]">Starred</h1>

        <Toggle
          onLeftClick={() => setViewMode("list")}
          onRightClick={() => setViewMode("grid")}
          defaultSelected={viewMode === "list" ? "left" : "right"}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[calc(100vh-250px)]">
          <Spin size="large" />
        </div>
      ) : starredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] p-4">
          <Image
            src="/starred.png"
            alt="No starred items"
            className="w-48 md:w-64 mb-6"
            width={192}
            height={192}
          />
          <h2 className="text-xl mb-2 text-center text-[#202124]">
            No starred items
          </h2>
          <p className="text-[#5f6368] text-center">
            Add stars to things that you want to easily find later
          </p>
        </div>
      ) : (
        <div>
          {selectedItem && <SelectionManager selectedItem={selectedItem} />}
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                : "space-y-2"
            }
          >
            {starredItems.map((item) => (
              <FileCard
                key={item.id}
                item={item}
                type={item.type as "file" | "folder"}
                onSelect={() =>
                  rootStore.setSelectedItem({
                    id: item.id,
                    type: "file",
                  })
                }
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default withAuth(observer(StarredPage));
