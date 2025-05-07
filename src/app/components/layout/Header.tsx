import React, { useState } from "react";
import { Menu, HelpCircle, Settings, User } from "lucide-react";
import { Avatar, Dropdown } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useAuth } from "@/lib/auth/context";
import { authService } from "@/lib/auth/service";
import Searchbar from "./Searchbar";

interface HeaderProps {
  onMenuToggle: () => void;
  hasSearch?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, hasSearch }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState("");

  const userMenuItems = [
    {
      key: "profile",
      label: "My Profile",
      icon: <User size={16} />,
    },
    {
      key: "settings",
      label: "Settings",
      icon: <Settings size={16} />,
    },
    {
      key: "divider",
    },
    {
      key: "logout",
      label: "Sign out",
      danger: true,
      onClick: () => authService.signOut(),
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-200 z-20 px-2 flex items-center justify-between">
      <div className="flex items-center flex-1">
        <div className="flex items-center mr-2">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-full hover:bg-[#f1f3f4] mr-1"
          >
            <Menu size={20} className="text-[#5f6368]" />
          </button>

          <Link href="/dashboard" className="flex items-center">
            <img
              src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png"
              alt="Google Drive"
              className="h-10 w-auto"
            />
            <span className="text-[#5f6368] font-medium ml-1 hidden sm:inline">
              Drive
            </span>
          </Link>
        </div>
        {hasSearch && (
          <div className="ml-20 flex-1 hidden md:flex">
            <Searchbar />
          </div>
        )}
      </div>

      <div className="flex items-center ml-2">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f1f3f4]"
          title="Support"
        >
          <HelpCircle size={20} className="text-[#5f6368]" />
        </button>
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f1f3f4]"
          title="Settings"
        >
          <Settings size={20} className="text-[#5f6368]" />
        </button>
        <div className="mx-1 w-10 h-10 flex items-center justify-center">
          <svg
            className="text-[#5f6368]"
            width="24px"
            height="24px"
            viewBox="0 0 24 24"
          >
            <path
              d="M6,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM16,6c0,1.1 0.9,2 2,2s2,-0.9 2,-2 -0.9,-2 -2,-2 -2,0.9 -2,2zM12,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2z"
              fill="currentColor"
            ></path>
          </svg>
        </div>

        <Dropdown
          menu={{ items: userMenuItems }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <button className="ml-1">
            <Avatar
              src={user?.photoURL || undefined}
              className="cursor-pointer"
              style={{
                backgroundColor: user?.photoURL ? "transparent" : "#1a73e8",
              }}
              size={32}
            >
              {!user?.photoURL &&
                (user?.displayName?.[0] || user?.email?.[0] || "U")}
            </Avatar>
          </button>
        </Dropdown>
      </div>
    </header>
  );
};

export default observer(Header);
