import { makeAutoObservable, runInAction } from "mobx";
import { supabase } from "../lib/supabase";
import { type File as FileType } from "../types";
import {
  removeFromObjectStorage,
  uploadFile as uploadFileToCloudinary,
} from "@/actions/upload";

export class FileStore {
  files: FileType[] = [];
  currentFile: FileType | null = null;
  loading = false;
  error: string | null = null;
  uploadProgress: { [key: string]: number } = {};

  constructor() {
    makeAutoObservable(this);
  }

  setFiles(files: FileType[]) {
    this.files = files;
  }

  addFile(file: FileType) {
    this.files.push(file);
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }

  setCurrentFile(file: FileType | null) {
    this.currentFile = file;
  }

  setUploadProgress(fileId: string, progress: number) {
    runInAction(() => {
      this.uploadProgress[fileId] = progress;
    });
  }

  async fetchFiles(user_id: string, folder_id: string | null = null) {
    this.setLoading(true);
    this.setError(null);
    try {
      let query = supabase.from("files").select("*").eq("user_id", user_id);

      if (folder_id !== null) {
        query = query.eq("folder_id", folder_id);
      } else {
        query = query.is("folder_id", null);
      }

      query = query.or("trashed.is.null,trashed.eq.false");

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        console.error("Error fetching files:", error);
        throw error;
      }

      console.log("Fetched files:", data);

      runInAction(() => {
        this.files = data as FileType[];
      });
    } catch (error: any) {
      console.error("Error in fetchFiles:", error);
      runInAction(() => {
        this.setError(error.message);
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  async fetchStarredFiles(user_id: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("user_id", user_id)
        .eq("starred", true)
        .or("trashed.is.null,trashed.eq.false")
        .order("created_at", { ascending: false });

      if (error) throw error;

      runInAction(() => {
        this.files = data as FileType[];
      });
    } catch (error: any) {
      runInAction(() => {
        this.setError(error.message);
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  async fetchTrashedFiles(user_id: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("user_id", user_id)
        .eq("trashed", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      runInAction(() => {
        this.files = data as FileType[];
      });
    } catch (error: any) {
      runInAction(() => {
        this.setError(error.message);
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  async toggleStar(fileId: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const file = this.files.find((f) => f.id === fileId);
      if (!file) throw new Error("File not found");

      const { error } = await supabase
        .from("files")
        .update({ starred: !file.starred })
        .eq("id", fileId);

      if (error) throw error;

      runInAction(() => {
        const index = this.files.findIndex((f) => f.id === fileId);
        if (index !== -1) {
          this.files[index] = {
            ...this.files[index],
            starred: !this.files[index].starred,
          };
        }
      });
    } catch (error: any) {
      runInAction(() => {
        this.setError(error.message);
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  async moveOrRestoreTrash(fileId: string) {
    this.setLoading(true);
    this.setError(null);

    try {
      const item = this.files.find((i) => i.id === fileId);

      if (!item) throw new Error("No item to restore");

      const { error } = await supabase
        .from("files")
        .update({ trashed: !item.trashed, updated_at: new Date() })
        .eq("id", fileId);

      if (error) throw error;

      runInAction(() => {
        const index = this.files.findIndex((f) => f.id === fileId);
        if (index !== -1) {
          this.files[index] = {
            ...this.files[index],
            trashed: !item.trashed,
            updated_at: new Date(),
          };
          this.files = this.files.filter((f) => f.id !== fileId);
        }
      });
    } catch (error: any) {
      console.log("error", error);
      runInAction(() => {
        this.setError(error.message);
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  async uploadFile(file: File, user_id: string, folder_id: string | null) {
    this.setLoading(true);
    this.setError(null);

    const fileId = crypto.randomUUID();
    const formData = new FormData();

    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size exceeds the maximum allowed size of 5 MB");
      }

      this.setUploadProgress(fileId, 0);

      formData.append("file", file);
      let data;
      try {
        data = await uploadFileToCloudinary(formData, "files");
      } catch (uploadError: any) {
        console.error("Server action error:", uploadError);

        if (
          uploadError.message &&
          uploadError.message.includes("Body exceeded")
        ) {
          throw new Error("File size exceeds the maximum allowed size of 5 MB");
        }

        throw uploadError;
      }

      this.setUploadProgress(fileId, 50);

      const publicUrl = data.url as string;

      const fileData = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: publicUrl,
        folder_id,
        user_id,
        created_at: new Date(),
        updated_at: new Date(),
        starred: false,
        trashed: false,
      };

      await this.saveFile(fileData);
      this.setUploadProgress(fileId, 100);

      setTimeout(() => {
        runInAction(() => {
          delete this.uploadProgress[fileId];
        });
      }, 1000);

      return data;
    } catch (error: any) {
      console.error("Error uploading file:", error);
      runInAction(() => {
        this.setError(error.message);
        delete this.uploadProgress[fileId];
      });
      return { status: error, message: error.message };
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  async fetchFile(fileId: string, user_id: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("id", fileId)
        .eq("user_id", user_id)
        .single();

      if (error) throw error;

      runInAction(() => {
        this.currentFile = data as FileType;
      });
    } catch (error: any) {
      runInAction(() => {
        this.setError(error.message);
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  async uploadFiles(files: File[], user_id: string, folder_id: string | null) {
    this.setLoading(true);
    this.setError(null);
    console.log("folder-Id", folder_id);
    try {
      const uploadPromises = files.map((file) =>
        this.uploadFile(file, user_id, folder_id)
      );
      return await Promise.all(uploadPromises);
    } catch (error: any) {
      runInAction(() => {
        this.setError(error.message);
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  async saveFile(file: FileType) {
    try {
      const { data, error } = await supabase
        .from("files")
        .insert([file])
        .select()
        .single();

      if (error) {
        console.error("Error saving file:", error);
        throw error;
      }

      console.log("File saved:", data);

      runInAction(() => {
        this.addFile(data as FileType);
      });
    } catch (error: any) {
      console.error("Error in saveFile:", error);
      throw error;
    }
  }

  async renameFile(fileId: string, newName: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { error } = await supabase
        .from("files")
        .update({ name: newName, updated_at: new Date() })
        .eq("id", fileId);

      if (error) throw error;

      runInAction(() => {
        const fileIndex = this.files.findIndex((file) => file.id === fileId);
        if (fileIndex !== -1) {
          this.files[fileIndex] = {
            ...this.files[fileIndex],
            name: newName,
            updated_at: new Date(),
          };
        }
      });
    } catch (error: any) {
      runInAction(() => {
        this.setError(error.message);
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  async permanentlyDeleteFile(fileId: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const file = this.files.find((f) => f.id === fileId);
      if (!file) throw new Error("File not found");
      const result = await removeFromObjectStorage(file.url, fileId);

      if (result.status !== "success") {
        throw new Error("An error occurred when deleting file");
      }
      const { error } = await supabase.from("files").delete().eq("id", fileId);
      if (error) throw error;

      runInAction(() => {
        this.files = this.files.filter((f) => f.id !== fileId);
      });

      return { status: "success" };
    } catch (error: any) {
      console.error("Error permanently deleting file:", error);
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
      if (this.files.filter((f) => f.trashed).length === 0) {
        await this.fetchTrashedFiles(userId);
      }

      const trashedFiles = this.files.filter((f) => f.trashed);

      if (trashedFiles.length === 0) {
        return { status: "success", message: "No files to delete" };
      }
      const deletePromises = trashedFiles.map(async (file) => {
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

      await Promise.all(deletePromises);

      runInAction(() => {
        this.files = this.files.filter((file) => !file.trashed);
      });

      return { status: "success", message: "Files deleted successfully" };
    } catch (error: any) {
      console.error("Error emptying trash:", error);
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

  get totalSize() {
    return this.files.reduce((acc, file) => acc + file.size, 0);
  }
}
