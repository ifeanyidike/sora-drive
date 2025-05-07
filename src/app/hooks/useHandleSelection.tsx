import { rootStore } from "@/store/rootStore";
import React, { useEffect } from "react";

const useHandleSelection = () => {
  const clearSelection = () => {
    rootStore.setSelectedItem(undefined);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest(".file-card") &&
        !target.closest(".folder-card") &&
        !target.closest(".selection-manager") &&
        !target.closest(".ant-dropdown") &&
        !target.closest(".ant-modal")
      ) {
        clearSelection();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
};

export default useHandleSelection;
