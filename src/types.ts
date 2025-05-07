export type User = {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
};

export type File = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  folder_id: string | null;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  starred?: boolean;
  trashed?: boolean;
};

export type Folder = {
  id: string;
  name: string;
  parent_id: string | null;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  starred?: boolean;
  trashed?: boolean;
};

export type ViewMode = "grid" | "list";

export type RejectedFile = {
  name: string;
  reason: string;
};
