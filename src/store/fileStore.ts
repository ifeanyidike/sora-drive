import { makeAutoObservable, runInAction } from "mobx";
import { supabase } from "../lib/supabase";
import { type File as FileType } from "../types";

export class FileStore {
  files: FileType[] = [];
  currentFile: FileType | null = null;
  loading = false;
  error: string | null = null;

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

  async fetchFiles(userId: string, folderId: string | null = null) {
    this.setLoading(true);
    this.setError(null);
    try {
      let query = supabase.from("files").select("*").eq("userId", userId);
      // .eq("folderId", folderId);

      if (folderId) {
        query = query.eq("folderId", folderId);
      } else {
        query = query.is("folderId", null);
      }
      const { data, error } = await query.order("createdAt", {
        ascending: false,
      });

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

  async uploadFile(file: File, userId: string, folderId: string | null) {
    this.setLoading(true);
    this.setError(null);
    const fileId = crypto.randomUUID();
    const filePath = `${userId}/${fileId}-${file.name}`;
    try {
      const { data, error } = await supabase.storage
        .from("files")
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("files")
        .getPublicUrl(data.path);

      if (!urlData) throw new Error("Failed to get public URL");

      const fileData = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: urlData.publicUrl,
        folderId: folderId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await this.saveFile(fileData, userId);
      return true;
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
  async uploadFiles(files: File[], userId: string, folderId: string | null) {
    this.setLoading(true);
    this.setError(null);
    try {
      const uploadPromises = files.map((file) =>
        this.uploadFile(file, userId, folderId)
      );
      await Promise.all(uploadPromises);
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

  async saveFile(file: FileType, userId: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { data, error } = await supabase
        .from("files")
        .insert([file])
        .select();

      if (error) throw error;

      runInAction(() => {
        this.files.push(data[0]);
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

  async deleteFile(fileId: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { error } = await supabase.from("files").delete().eq("id", fileId);

      if (error) throw error;

      runInAction(() => {
        this.files = this.files.filter((file) => file.id !== fileId);
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

  async renameFile(fileId: string, newName: string) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { error } = await supabase
        .from("files")
        .update({ name: newName })
        .eq("id", fileId)
        .select();

      if (error) throw error;

      runInAction(() => {
        const fileIndex = this.files.findIndex((file) => file.id === fileId);
        if (fileIndex !== -1) {
          this.files[fileIndex].name = newName;
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

  async moveFile(fileId: string, newFolderId: string | null) {
    this.setLoading(true);
    this.setError(null);
    try {
      const { error } = await supabase
        .from("files")
        .update({ folderId: newFolderId })
        .eq("id", fileId)
        .select();

      if (error) throw error;

      runInAction(() => {
        const fileIndex = this.files.findIndex((file) => file.id === fileId);
        if (fileIndex !== -1) {
          this.files[fileIndex].folderId = newFolderId;
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
}
