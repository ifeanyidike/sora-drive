import { makeAutoObservable } from "mobx";
import { FileStore } from "./fileStore";
import { FolderStore } from "./folderStore";

class RootStore {
  selectedItem:
    | {
        id: string;
        type: "file" | "folder";
      }
    | undefined = undefined;
  fileStore: FileStore;
  folderStore: FolderStore;

  constructor() {
    this.fileStore = new FileStore();
    this.folderStore = new FolderStore();
    makeAutoObservable(this);
  }

  setSelectedItem(item: { id: string; type: "file" | "folder" } | undefined) {
    this.selectedItem = item;
  }
  clearSelection() {
    this.selectedItem = undefined;
  }
}

export const rootStore = new RootStore();
