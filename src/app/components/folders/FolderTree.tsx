import { rootStore } from "@/store/rootStore";
import { Tree } from "antd";
import { FolderIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import React from "react";

type Props = {
  currentFolderId: string | null;
};
const FolderTree = ({ currentFolderId }: Props) => {
  const { folderStore } = rootStore;
  const { folders } = folderStore;

  const renderTree = (parentId: string | null): any[] => {
    return folders
      .filter((folder) => folder.parentId === parentId)
      .map((folder) => ({
        key: folder.id,
        title: (
          <Link
            href={`/dashboard/${folder.id}`}
            className="hover:text-blue-500"
          >
            {folder.name}
          </Link>
        ),
        icon: <FolderIcon size={16} className="text-yellow-500" />,
        children: renderTree(folder.id),
      }));
  };

  const tree = [
    {
      key: "root",
      title: (
        <Link href={`/dashboard`} className="hover:text-blue-500">
          Root
        </Link>
      ),
      icon: <FolderIcon size={16} className="text-yellow-500" />,
      children: renderTree(null),
    },
  ];

  return (
    <div className="py-2">
      <Tree
        treeData={tree}
        defaultExpandedKeys={["root"]}
        selectedKeys={currentFolderId ? [currentFolderId] : ["root"]}
        showIcon
      />
    </div>
  );
};

export default observer(FolderTree);
