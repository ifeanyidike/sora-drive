import { supabase } from "@/lib/supabase";
import { type Folder } from "@/types";
import { makeAutoObservable, runInAction } from "mobx";

export class FolderStore {
  folders: Folder[] = [];
  currentFolder: Folder | null = null;
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setFolders(folders: Folder[]) {
    this.folders = folders;
  }

  setCurrentFolder(folder: Folder | null) {
    this.currentFolder = folder;
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }

  addFolder(folder: Folder) {
    this.folders.push(folder);
  }

  async fetchFolders(userId: string, parentId: string | null = null) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("userId", userId)
        .eq("parentId", parentId)
        .order("createdAt", { ascending: false });

      if (error) throw error;

      runInAction(() => this.setFolders(data as Folder[]));
    } catch (error: any) {
      runInAction(() => this.setError(error.message));
    } finally {
      runInAction(() => this.setLoading(false));
    }
  }

  async createFolder(folder: Folder) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { data, error } = await supabase
        .from("folders")
        .insert([folder])
        .select()
        .single();

      if (error) throw error;

      runInAction(() => {
        this.addFolder(data as Folder);
      });
    } catch (error: any) {
      runInAction(() => this.setError(error.message));
    } finally {
      runInAction(() => this.setLoading(false));
    }
  }

  async deleteFolder(folderId: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", folderId);

      if (error) throw error;

      runInAction(() => {
        this.folders = this.folders.filter((folder) => folder.id !== folderId);
      });
    } catch (error: any) {
      runInAction(() => this.setError(error.message));
    } finally {
      runInAction(() => this.setLoading(false));
    }
  }

  async renameFolder(folderId: string, newName: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { data, error } = await supabase
        .from("folders")
        .update({ name: newName })
        .eq("id", folderId)
        .select()
        .single();

      if (error) throw error;

      runInAction(() => {
        const index = this.folders.findIndex(
          (folder) => folder.id === folderId
        );
        if (index !== -1) {
          this.folders[index].name = newName;
        }
      });
    } catch (error: any) {
      runInAction(() => this.setError(error.message));
    } finally {
      runInAction(() => this.setLoading(false));
    }
  }
  async updateFolder(folderId: string, updatedFolder: Partial<Folder>) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { data, error } = await supabase
        .from("folders")
        .update(updatedFolder)
        .eq("id", folderId)
        .select()
        .single();

      if (error) throw error;

      runInAction(() => {
        const index = this.folders.findIndex(
          (folder) => folder.id === folderId
        );
        if (index !== -1) {
          this.folders[index] = { ...this.folders[index], ...data };
        }
      });
    } catch (error: any) {
      runInAction(() => this.setError(error.message));
    } finally {
      runInAction(() => this.setLoading(false));
    }
  }
  async moveFolder(folderId: string, newParentId: string | null) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { error } = await supabase
        .from("folders")
        .update({ parentId: newParentId })
        .eq("id", folderId);

      if (error) throw error;

      runInAction(() => {
        const index = this.folders.findIndex(
          (folder) => folder.id === folderId
        );
        if (index !== -1) {
          this.folders[index].parentId = newParentId;
        }
      });
    } catch (error: any) {
      runInAction(() => this.setError(error.message));
    } finally {
      runInAction(() => this.setLoading(false));
    }
  }

  getFolderPath(folderId: string): Folder[] {
    if (!folderId) return [];

    const path: Folder[] = [];
    let currentFolder = this.folders.find((folder) => folder.id === folderId);

    while (currentFolder) {
      path.unshift(currentFolder);
      if (!currentFolder.parentId) break;

      currentFolder = this.folders.find(
        (folder) => folder.id === currentFolder!.parentId
      );
    }

    return path;
  }
  getChildFolders(parentId: string | null): Folder[] {
    return this.folders.filter((folder) => folder.parentId === parentId);
  }
}
