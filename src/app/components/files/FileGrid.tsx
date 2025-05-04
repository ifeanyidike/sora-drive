import { type File } from "@/types";
import React from "react";
import FileCard from "./FileCard";
import { observer } from "mobx-react-lite";

type Props = {
  files: File[];
};
const FileGrid = ({ files }: Props) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {files.map((file) => (
        <FileCard key={file.id} file={file} />
      ))}
    </div>
  );
};

export default observer(FileGrid);
