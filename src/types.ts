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
  folderId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ViewMode = "grid" | "list";
