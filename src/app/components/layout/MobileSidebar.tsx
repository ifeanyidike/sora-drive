import React from "react";
import { Drawer } from "antd";
import Link from "next/link";

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MobileSidebar: React.FC<Props> = ({ open, onClose, children }) => {
  return (
    <Drawer
      placement="left"
      open={open}
      onClose={onClose}
      width={280}
      className="lg:hidden"
      styles={{
        body: { padding: 0 },
        header: { display: "none" },
      }}
    >
      <div className="flex  ml-5 items-center gap-2 mt-3 mb-3">
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
        <span className="text-2xl">Sora Drive</span>
      </div>
      {children}
    </Drawer>
  );
};

export default MobileSidebar;
