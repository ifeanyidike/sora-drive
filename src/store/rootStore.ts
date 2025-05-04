import { FileStore } from "./fileStore";
import { FolderStore } from "./folderStore";

class RootStore {
  fileStore: FileStore;
  folderStore: FolderStore;

  constructor() {
    this.fileStore = new FileStore();
    this.folderStore = new FolderStore();
  }
}

export const rootStore = new RootStore();
