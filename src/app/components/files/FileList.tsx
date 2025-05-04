import { rootStore } from "@/store/rootStore";
import { File } from "@/types";
import { Dropdown, Table } from "antd";
import { MoreVertical } from "lucide-react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import React from "react";

type Props = {
  files: File[];
};
const FileList = ({ files }: Props) => {
  const fileStore = rootStore.fileStore;

  const handleRename = (file: File) => {};

  const handleMove = (file: File) => {};

  const handleDelete = async (fileId: string) => {};

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: File) => (
        <Link href={`/files/${record.id}`} className="flex items-center">
          {text}
        </Link>
      ),
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Last Modified",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: File) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "1",
                label: "Rename",
                onClick: () => handleRename(record),
              },
              {
                key: "2",
                label: "Move",
                onClick: () => handleMove(record),
              },
              {
                key: "3",
                label: "Delete",
                onClick: () => handleDelete(record.id),
                danger: true,
              },
            ],
          }}
          trigger={["click"]}
        >
          <MoreVertical size={16} className="cursor-pointer" />
        </Dropdown>
      ),
    },
  ];
  return <Table dataSource={files} columns={columns} rowKey="id" />;
};

export default observer(FileList);
