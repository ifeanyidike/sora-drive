import { removeFromObjectStorage } from "@/actions/upload";
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

  async fetchFolders(user_id: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      // Fetch all folders for the user, excluding trashed ones
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user_id)
        .or("trashed.is.null,trashed.eq.false")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching folders:", error);
        throw error;
      }

      console.log("Fetched folders:", data);

      runInAction(() => this.setFolders(data as Folder[]));
    } catch (error: any) {
      console.error("Error in fetchFolders:", error);
      runInAction(() => this.setError(error.message));
    } finally {
      runInAction(() => this.setLoading(false));
    }
  }

  async fetchStarredFolders(user_id: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user_id)
        .eq("starred", true)
        .or("trashed.is.null,trashed.eq.false")
        .order("created_at", { ascending: false });

      if (error) throw error;

      runInAction(() => this.setFolders(data as Folder[]));
    } catch (error: any) {
      runInAction(() => this.setError(error.message));
    } finally {
      runInAction(() => this.setLoading(false));
    }
  }

  async fetchTrashedFolders(user_id: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user_id)
        .eq("trashed", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      runInAction(() => this.setFolders(data as Folder[]));
    } catch (error: any) {
      runInAction(() => this.setError(error.message));
    } finally {
      runInAction(() => this.setLoading(false));
    }
  }

  async toggleStar(folder_id: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const folder = this.folders.find((f) => f.id === folder_id);
      if (!folder) throw new Error("Folder not found");

      const { error } = await supabase
        .from("folders")
        .update({ starred: !folder.starred, updated_at: new Date() })
        .eq("id", folder_id);

      if (error) throw error;

      runInAction(() => {
        const index = this.folders.findIndex((f) => f.id === folder_id);
        if (index !== -1) {
          this.folders[index] = {
            ...this.folders[index],
            starred: !this.folders[index].starred,
            updated_at: new Date(),
          };
        }
      });
    } catch (error: any) {
      runInAction(() => this.setError(error.message));
    } finally {
      runInAction(() => this.setLoading(false));
    }
  }

  async moveOrRestoreTrash(folder_id: string) {
    this.setLoading(true);
    this.setError(null);

    try {
      const item = this.folders.find((f) => f.id === folder_id);
      if (!item) throw new Error("no folder to restore");
      const { error } = await supabase
        .from("folders")
        .update({ trashed: !item.trashed, updated_at: new Date() })
        .eq("id", folder_id);

      if (error) throw error;

      runInAction(() => {
        const index = this.folders.findIndex((f) => f.id === folder_id);
        if (index !== -1) {
          this.folders[index] = {
            ...this.folders[index],
            trashed: !item.trashed,
            updated_at: new Date(),
          };
          this.folders = this.folders.filter((f) => f.id !== folder_id);
        }
      });
    } catch (error: any) {
      runInAction(() => this.setError(error.message));
    } finally {
      runInAction(() => this.setLoading(false));
    }
  }

  async createFolder(folder: Folder) {
    this.setLoading(true);
    this.setError(null);
    console.log("Creating folder:", folder);

    try {
      const { data, error } = await supabase
        .from("folders")
        .insert([folder])
        .select()
        .single();

      if (error) {
        console.error("Error creating folder:", error);
        throw error;
      }

      console.log("Folder created:", data);

      runInAction(() => {
        this.addFolder(data as Folder);
      });
    } catch (error: any) {
      console.error("Error in createFolder:", error);
      runInAction(() => this.setError(error.message));
    } finally {
      runInAction(() => this.setLoading(false));
    }
  }

  async renameFolder(folder_id: string, newName: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { data, error } = await supabase
        .from("folders")
        .update({ name: newName, updated_at: new Date() })
        .eq("id", folder_id)
        .select()
        .single();

      if (error) throw error;

      runInAction(() => {
        const index = this.folders.findIndex(
          (folder) => folder.id === folder_id
        );
        if (index !== -1) {
          this.folders[index] = {
            ...this.folders[index],
            name: newName,
            updated_at: new Date(),
          };
        }
      });
    } catch (error: any) {
      runInAction(() => this.setError(error.message));
    } finally {
      runInAction(() => this.setLoading(false));
    }
  }

  getFolderPath(folder_id: string): Folder[] {
    if (!folder_id) return [];

    const path: Folder[] = [];
    let currentFolder = this.folders.find((folder) => folder.id === folder_id);

    while (currentFolder) {
      path.unshift(currentFolder);
      if (!currentFolder.parent_id) break;

      currentFolder = this.folders.find(
        (folder) => folder.id === currentFolder!.parent_id
      );
    }

    return path;
  }

  async permanentlyDeleteFolder(folderId: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const folder = this.folders.find((f) => f.id === folderId);
      if (!folder) throw new Error("Folder not found");

      const { data: filesData, error: filesError } = await supabase
        .from("files")
        .select("*")
        .eq("folder_id", folderId);

      if (filesError) throw filesError;

      const filePromises = (filesData || []).map(async (file) => {
        const result = await removeFromObjectStorage(file.url, file.id);

        if (result.status !== "success") {
          throw new Error(`An error occurred when deleting file ${file.id}`);
        }

        const { error } = await supabase
          .from("files")
          .delete()
          .eq("id", file.id);
        if (error) throw error;
      });

      await Promise.all(filePromises);

      const { data: subfoldersData, error: subfoldersError } = await supabase
        .from("folders")
        .select("*")
        .eq("parent_id", folderId);

      if (subfoldersError) throw subfoldersError;

      const subfolderPromises = (subfoldersData || []).map(
        async (subfolder) => {
          await this.permanentlyDeleteFolder(subfolder.id);
        }
      );

      await Promise.all(subfolderPromises);
      const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", folderId);
      if (error) throw error;

      runInAction(() => {
        this.folders = this.folders.filter((f) => f.id !== folderId);
      });

      return { status: "success" };
    } catch (error: any) {
      console.error("Error permanently deleting folder:", error);
      runInAction(() => {
        this.setError(error.message);
      });
      return { status: "error", message: error.message };
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  async emptyTrash(userId: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      if (this.folders.filter((f) => f.trashed).length === 0) {
        await this.fetchTrashedFolders(userId);
      }

      const trashedFolders = this.folders.filter((f) => f.trashed);
      if (trashedFolders.length === 0) {
        return { status: "success", message: "No folders to delete" };
      }
      const deletePromises = trashedFolders.map(async (folder) => {
        await this.permanentlyDeleteFolder(folder.id);
      });

      await Promise.all(deletePromises);

      return { status: "success", message: "Folders deleted successfully" };
    } catch (error: any) {
      console.error("Error emptying trash for folders:", error);
      runInAction(() => {
        this.setError(error.message);
      });
      return { status: "error", message: error.message };
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  getChildFolders(parent_id: string | null): Folder[] {
    return this.folders.filter((folder) => folder.parent_id === parent_id);
  }
}
