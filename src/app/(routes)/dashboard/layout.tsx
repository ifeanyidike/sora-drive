"use client";

import React, { useState } from "react";
import { Layout, App } from "antd";
import { observer } from "mobx-react-lite";
import { useParams, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import Header from "@/app/components/layout/Header";
import Sidebar from "@/app/components/layout/Sidebar";
import MobileSidebar from "@/app/components/layout/MobileSidebar";
import UploadModal from "@/app/components/files/UploadModal";
import CreateFolder from "@/app/components/folders/CreateFolder";
import { rootStore } from "@/store/rootStore";
import useHandleSelection from "@/app/hooks/useHandleSelection";

const { Content } = Layout;

function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  const folderId = params.folderId as string;
  const pathname = usePathname();
  const { user } = useAuth();
  const { fileStore, folderStore } = rootStore;
  const { message } = App.useApp();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useHandleSelection();

  const handleFolderCreated = async () => {
    if (user) {
      await folderStore.fetchFolders(user.id);
      message.success("Folder created successfully");
    }
  };

  const handleUploadComplete = async () => {
    setUploadModalOpen(false);
    if (user) {
      await fileStore.fetchFiles(user.id, folderId || null);
      message.success("Files uploaded successfully");
    }
  };

  return (
    <Layout className="min-h-screen !bg-white h-screen">
      <Header
        onMenuToggle={() => setMobileSidebarOpen(true)}
        hasSearch={!!folderId}
      />

      <div className="flex pt-16">
        <Sidebar
          onUploadClick={() => setUploadModalOpen(true)}
          onFolderClick={() => setFolderModalOpen(true)}
          showNew={pathname === "/dashboard" || !!folderId}
        />

        <Content className="flex-1 lg:ml-64 p-4">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </Content>
      </div>

      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      >
        <Sidebar
          onUploadClick={() => {
            setMobileSidebarOpen(false);
            setUploadModalOpen(true);
          }}
          onFolderClick={() => {
            setMobileSidebarOpen(false);
            setFolderModalOpen(true);
          }}
          classNames="!block"
        />
      </MobileSidebar>

      <UploadModal
        visible={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        folder_id={folderId || null}
        onUploadComplete={handleUploadComplete}
      />

      <CreateFolder
        parent_id={folderId || null}
        visible={folderModalOpen}
        onClose={() => {
          setFolderModalOpen(false);
          handleFolderCreated();
        }}
      />
    </Layout>
  );
}

export default observer(RootLayout);
