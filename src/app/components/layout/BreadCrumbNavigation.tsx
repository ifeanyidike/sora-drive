import React from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { rootStore } from "@/store/rootStore";

interface Props {
  folder_id?: string | null;
}

const BreadcrumbNavigation: React.FC<Props> = ({ folder_id }) => {
  const { folderStore } = rootStore;

  const folderPath = folder_id ? folderStore.getFolderPath(folder_id) : [];

  return (
    <div className="flex items-center text-[14px] text-[#5f6368] mb-6">
      <Link href="/dashboard" className="hover:text-[#1967d2] hover:underline">
        My Drive
      </Link>

      {folderPath.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronRight size={18} className="mx-2" />
          {index === folderPath.length - 1 ? (
            <span className="text-[#202124]">{folder.name}</span>
          ) : (
            <Link
              href={`/dashboard/folders/${folder.id}`}
              className="hover:text-[#1967d2] hover:underline"
            >
              {folder.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default observer(BreadcrumbNavigation);
