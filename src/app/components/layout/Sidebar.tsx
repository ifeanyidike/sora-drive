import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Star, Trash2, Plus } from "lucide-react";
import { Progress } from "antd";
import { observer } from "mobx-react-lite";
import { rootStore } from "@/store/rootStore";
import { formatSize } from "@/lib/utils";
import {
  FileUploadIcon,
  GoogleDocsIcon,
  GoogleFormsIcon,
  GoogleSheetsIcon,
  GoogleSlidesIcon,
  NewFolderIcon,
} from "@/app/icons";

interface SidebarProps {
  onUploadClick: () => void;
  onFolderClick: () => void;
  classNames?: string;
  showNew?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  onUploadClick,
  onFolderClick,
  classNames = "",
  showNew = false,
}) => {
  const { fileStore } = rootStore;
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const storageUsed = fileStore.totalSize || 0;
  const storageLimit = 15 * 1024 * 1024 * 1024;
  const storagePercentage = Math.min(100, (storageUsed / storageLimit) * 100);

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/" || pathname.startsWith("/");
    }
    return pathname === path;
  };

  const toggleCreateMenu = () => {
    setCreateMenuOpen(!createMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className={`fixed top-16 bottom-0 left-0 w-64 bg-slate-50 hidden lg:block overflow-y-auto z-10 ${classNames}`}
    >
      <div className="flex flex-col h-full">
        <div className="p-2">
          <div className="relative" ref={menuRef}>
            {showNew && (
              <button
                onClick={toggleCreateMenu}
                className="flex items-center cursor-pointer justify-center w-28 h-12 rounded-2xl border border-[#dadce0] hover:bg-[#f1f3f4] hover:shadow-sm transition-all font-medium text-[#202124]"
              >
                <Plus size={20} className="mr-2 text-[#202124]" />
                New
              </button>
            )}

            {createMenuOpen && (
              <div className="absolute top-14 left-0 w-60 bg-white rounded-lg shadow-lg border border-[#dadce0] z-20">
                <div className="py-2">
                  <button
                    onClick={onFolderClick}
                    className="flex items-center w-full px-4 py-2 hover:bg-[#f1f3f4] text-sm text-[#202124]"
                  >
                    {NewFolderIcon()}
                    New folder
                  </button>
                  <div className="mx-4 my-1 border-b border-[#e0e0e0]"></div>
                  <button
                    onClick={onUploadClick}
                    className="flex items-center w-full px-4 py-2 hover:bg-[#f1f3f4] text-sm text-[#202124]"
                  >
                    {FileUploadIcon()}
                    File upload
                  </button>
                  <button className="flex items-center w-full px-4 py-2 hover:bg-[#f1f3f4] text-sm text-[#202124]">
                    {GoogleDocsIcon()}
                    Google Docs
                  </button>
                  <button className="flex items-center w-full px-4 py-2 hover:bg-[#f1f3f4] text-sm text-[#202124]">
                    {GoogleSheetsIcon()}
                    Google Sheets
                  </button>
                  <button className="flex items-center w-full px-4 py-2 hover:bg-[#f1f3f4] text-sm text-[#202124]">
                    {GoogleSlidesIcon()}
                    Google Slides
                  </button>
                  <button className="flex items-center w-full px-4 py-2 hover:bg-[#f1f3f4] text-sm text-[#202124]">
                    {GoogleFormsIcon()}
                    Google Forms
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-2 flex flex-col gap-4">
          <Link href="/dashboard">
            <div
              className={`flex items-center rounded-full px-6 py-2 text-sm ${
                isActive("/dashboard")
                  ? "bg-[#e8f0fe] text-[#1a73e8] font-medium"
                  : "text-[#202124] hover:bg-[#f1f3f4]"
              }`}
            >
              <svg className="mr-3" width="24" height="24" viewBox="0 0 24 24">
                <path
                  d="M19 12h-7V5h-2v7H3v2h7v7h2v-7h7v-2z"
                  fill={isActive("/") ? "#1a73e8" : "#5f6368"}
                />
              </svg>
              My Drive
            </div>
          </Link>
          <Link href="/dashboard/">
            <div
              className={`flex items-center rounded-full px-6 py-2 text-sm text-[#202124] hover:bg-[#f1f3f4]`}
            >
              <Users size={20} className={`mr-3 text-[#5f6368]`} />
              Shared with me
            </div>
          </Link>

          <Link href="/dashboard/starred">
            <div
              className={`flex items-center rounded-full px-6 py-2 text-sm ${
                isActive("/dashboard/starred")
                  ? "bg-[#e8f0fe] text-[#1a73e8] font-medium"
                  : "text-[#202124] hover:bg-[#f1f3f4]"
              }`}
            >
              <Star
                size={20}
                className={`mr-3 ${
                  isActive("/starred") ? "text-[#1a73e8]" : "text-[#5f6368]"
                }`}
              />
              Starred
            </div>
          </Link>
          <Link href="/dashboard/trashed">
            <div
              className={`flex items-center rounded-full px-6 py-2 text-sm ${
                isActive("/trashed")
                  ? "bg-[#e8f0fe] text-[#1a73e8] font-medium"
                  : "text-[#202124] hover:bg-[#f1f3f4]"
              }`}
            >
              <Trash2
                size={20}
                className={`mr-3 ${
                  isActive("/trash") ? "text-[#1a73e8]" : "text-[#5f6368]"
                }`}
              />
              Trash
            </div>
          </Link>
        </div>

        <div className="mt-auto p-4">
          <div className="flex justify-between items-center mb-1 text-xs text-[#5f6368]">
            <span>Storage</span>
            <span>
              {formatSize(storageUsed)} of {formatSize(storageLimit)} used
            </span>
          </div>
          <Progress
            percent={storagePercentage}
            showInfo={false}
            strokeColor="#1a73e8"
            trailColor="#e8eaed"
            className="mb-1"
            size="small"
          />
          <div className="text-xs text-[#5f6368]">
            <Link href="#" className="text-[#1a73e8] hover:underline">
              Buy storage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(Sidebar);
