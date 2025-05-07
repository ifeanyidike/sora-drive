"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Spin, App } from "antd";
import { useAuth } from "@/lib/auth/context";
import BreadcrumbNavigation from "@/app/components/layout/BreadCrumbNavigation";
import FileCard from "@/app/components/files/FileCard";
import FolderCard from "@/app/components/folders/FolderCard";
import FileListView from "@/app/components/files/FileList";
import { ViewMode } from "@/types";
import { rootStore } from "@/store/rootStore";
import Toggle from "@/app/components/layout/Toggle";
import SelectionManager from "@/app/components/layout/SelectionManager";
import Searchbar from "@/app/components/layout/Searchbar";
import { withAuth } from "@/lib/auth/withAuth";

const Dashboard = () => {
  const { fileStore, folderStore, selectedItem } = rootStore;
  const { user } = useAuth();
  const [fileViewMode, setFileViewMode] = useState<ViewMode>("grid");

  const { message } = App.useApp();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          await Promise.all([
            folderStore.fetchFolders(user.id),
            fileStore.fetchFiles(user.id, null),
          ]);
        } catch (error) {
          console.error("Error fetching data:", error);
          message.error("Failed to load files and folders");
        }
      }
    };

    fetchData();
  }, [user, fileStore, folderStore, message]);

  const rootFolders = folderStore.folders.filter((folder) => {
    const isRoot = folder.parent_id === null;
    const notTrashed = !folder.trashed;
    return isRoot && notTrashed;
  });

  const rootFiles = fileStore.files.filter((file) => {
    const isRoot = file.folder_id === null;
    const notTrashed = !file.trashed;
    return isRoot && notTrashed;
  });

  const loading = fileStore.loading || folderStore.loading;

  return (
    <>
      <BreadcrumbNavigation folder_id={null} />

      <div className="flex flex-col">
        <div className="w-full flex flex-col items-center mb-6">
          <span className="text-2xl mb-4 text-[#202124] font-normal">
            Welcome to Drive
          </span>
          <Searchbar />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-[calc(100vh-250px)]">
            <Spin size="large" />
          </div>
        ) : (
          <div>
            {rootFolders.length === 0 && rootFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] p-4">
                <h2 className="text-xl mb-2 text-center text-[#202124]">
                  Welcome to Drive
                </h2>
                <p className="text-[#5f6368] mb-6 text-center">
                  Upload files or create folders to get started
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="px-6 py-2 bg-[#1a73e8] text-white rounded hover:bg-[#1765cc] transition-colors">
                    New folder
                  </button>
                  <button className="px-6 py-2 border border-[#dadce0] rounded hover:bg-[#f1f3f4] transition-colors">
                    Upload files
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {rootFolders.length > 0 && (
                  <div>
                    {selectedItem?.type === "folder" ? (
                      <SelectionManager selectedItem={selectedItem} />
                    ) : (
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-medium text-[#5f6368]">
                          Suggested Folders
                        </h2>
                        {rootFolders.length > 10 && (
                          <button className="text-sm text-[#1a73e8] hover:text-[#1765cc] transition-colors">
                            View all
                          </button>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {rootFolders.map((folder) => (
                        <div key={folder.id} className="folder-card">
                          <FolderCard
                            folder={folder}
                            isSelected={selectedItem?.id === folder.id}
                            onSelect={() =>
                              rootStore.setSelectedItem({
                                id: folder.id,
                                type: "folder",
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rootFiles.length > 0 && (
                  <div>
                    {selectedItem?.type === "file" ? (
                      <SelectionManager selectedItem={selectedItem} />
                    ) : (
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-medium text-[#5f6368]">
                          Suggested Files
                        </h2>
                        <div className="flex items-center">
                          {rootFiles.length > 10 && (
                            <button className="text-sm text-[#1a73e8] hover:text-[#1765cc] transition-colors mr-4">
                              View all
                            </button>
                          )}
                          <Toggle
                            onLeftClick={() => setFileViewMode("list")}
                            onRightClick={() => setFileViewMode("grid")}
                            defaultSelected={
                              fileViewMode === "list" ? "left" : "right"
                            }
                          />
                        </div>
                      </div>
                    )}

                    {fileViewMode === "grid" ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {rootFiles.map((file) => (
                          <div key={file.id} className="file-card">
                            <FileCard
                              item={file}
                              type="file"
                              onSelect={() =>
                                rootStore.setSelectedItem({
                                  id: file.id,
                                  type: "file",
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <FileListView
                        items={rootFiles.map((f) => ({
                          ...f,
                          type: "file" as const,
                        }))}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default withAuth(observer(Dashboard));
