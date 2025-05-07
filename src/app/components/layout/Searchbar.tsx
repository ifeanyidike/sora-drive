import React, { useState, useEffect, useRef } from "react";
import { Search, X, ChevronDown, ChevronLeft } from "lucide-react";
import { observer } from "mobx-react-lite";
import { rootStore } from "@/store/rootStore";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth/context";
import { formatDate, getThumbnailIcon } from "@/lib/utils";

interface SearchResultItem {
  id: string;
  name: string;
  type: "file" | "folder";
  created_at: Date;
  updated_at: Date;
  starred?: boolean;
  url?: string;
  size?: number;
  fileType?: string;
  owner?: string;
}

const Searchbar: React.FC = observer(() => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredResults, setFilteredResults] = useState<SearchResultItem[]>(
    []
  );
  const [activeFilter, setActiveFilter] = useState<"all" | "folders" | "files">(
    "all"
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  // Function to search files and folders directly from the database
  const searchDatabase = async (query: string) => {
    if (!user || !query.trim()) {
      setFilteredResults([]);
      return;
    }

    setIsLoading(true);

    try {
      // Search for folders
      const { data: folderData, error: folderError } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .or("trashed.is.null,trashed.eq.false")
        .ilike("name", `%${query}%`);

      if (folderError) throw folderError;

      // Search for files
      const { data: fileData, error: fileError } = await supabase
        .from("files")
        .select("*")
        .eq("user_id", user.id)
        .or("trashed.is.null,trashed.eq.false")
        .ilike("name", `%${query}%`);

      if (fileError) throw fileError;

      // Transform folder data to SearchResultItem format
      const folderResults: SearchResultItem[] = (folderData || []).map(
        (folder) => ({
          id: folder.id,
          name: folder.name,
          type: "folder",
          created_at: folder.created_at,
          updated_at: folder.updated_at || folder.created_at,
          starred: folder.starred,
          owner: "Me", // In a real app, you'd get the owner name
        })
      );

      // Transform file data to SearchResultItem format
      const fileResults: SearchResultItem[] = (fileData || []).map((file) => ({
        id: file.id,
        name: file.name,
        type: "file",
        created_at: file.created_at,
        updated_at: file.updated_at || file.created_at,
        starred: file.starred,
        url: file.url,
        size: file.size,
        fileType: file.type,
        owner: "Me", // In a real app, you'd get the owner name
      }));

      // Combine results based on the active filter
      let combinedResults: SearchResultItem[] = [];

      if (activeFilter === "all") {
        combinedResults = [...folderResults, ...fileResults];
      } else if (activeFilter === "folders") {
        combinedResults = folderResults;
      } else if (activeFilter === "files") {
        combinedResults = fileResults;
      }

      // Sort by relevance (exact match first, then by how early the match occurs)
      const lowercaseQuery = query.toLowerCase();
      combinedResults.sort((a, b) => {
        const aNameLower = a.name.toLowerCase();
        const bNameLower = b.name.toLowerCase();

        // Exact matches first
        const aExactMatch = aNameLower === lowercaseQuery;
        const bExactMatch = bNameLower === lowercaseQuery;

        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;

        // Then sort by how early the match occurs
        const aIndex = aNameLower.indexOf(lowercaseQuery);
        const bIndex = bNameLower.indexOf(lowercaseQuery);

        if (aIndex !== bIndex) return aIndex - bIndex;

        // If match position is the same, sort by recency
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });

      setFilteredResults(combinedResults);
    } catch (error) {
      console.error("Error searching database:", error);
      setFilteredResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger search when query or filter changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        searchDatabase(searchQuery);
      } else {
        setFilteredResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, activeFilter, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFocus = (): void => {
    setIsExpanded(true);
    if (searchQuery.trim().length > 0) {
      searchDatabase(searchQuery);
    }
  };

  const handleClear = (): void => {
    setSearchQuery("");
    setFilteredResults([]);
  };

  const handleItemClick = (item: SearchResultItem) => {
    if (item.type === "folder") {
      window.location.href = `/dashboard/folders/${item.id}`;
    } else {
      window.location.href = `/files/${item.id}`;
    }
    setIsExpanded(false);
  };

  return (
    <div className="max-w-3xl w-full relative" ref={searchRef}>
      <div
        className={`${
          isExpanded ? "rounded-t-3xl" : "rounded-full"
        } bg-slate-100 transition-all duration-200 relative z-10`}
      >
        <div className="flex items-center px-6 py-3">
          <Search className="text-gray-500 mr-3" size={22} />
          <input
            type="text"
            placeholder="Search in Drive"
            className="bg-transparent w-full outline-none text-gray-800 text-base"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
              setSearchQuery(e.target.value)
            }
            onFocus={handleFocus}
          />
          {searchQuery && (
            <button onClick={handleClear} className="text-gray-500">
              <X size={22} />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="bg-white rounded-b-3xl shadow-lg border-t border-gray-200 absolute w-full z-20">
          <div className="flex items-center gap-2 p-2 border-b border-gray-100">
            <div
              className={`flex items-center gap-1 px-4 py-2 rounded-full ${
                activeFilter === "all"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100 cursor-pointer"
              }`}
              onClick={() => setActiveFilter("all")}
            >
              <span>All items</span>
              <ChevronDown size={16} />
            </div>
            <div
              className={`flex items-center gap-1 px-4 py-2 rounded-full ${
                activeFilter === "folders"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100 cursor-pointer"
              }`}
              onClick={() => setActiveFilter("folders")}
            >
              <span>Folders</span>
              <ChevronDown size={16} />
            </div>
            <div
              className={`flex items-center gap-1 px-4 py-2 rounded-full ${
                activeFilter === "files"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100 cursor-pointer"
              }`}
              onClick={() => setActiveFilter("files")}
            >
              <span>Files</span>
              <ChevronDown size={16} />
            </div>
          </div>

          {searchQuery ? (
            <div>
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredResults.length > 0 ? (
                <ul>
                  {filteredResults.map((item, index) => (
                    <li
                      key={item.id}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="flex items-start">
                        <div className="text-gray-400 mr-4 mt-1">
                          {getThumbnailIcon(item.type, "20", item.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-800 font-medium truncate">
                            {item.name}
                          </h3>
                          <p className="text-gray-500 text-sm">{item.owner}</p>
                        </div>
                        <span className="text-gray-500 text-sm ml-4">
                          {formatDate(item.updated_at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                  <p>No items match your search</p>
                </div>
              )}

              <div className="flex justify-between items-center px-6 py-4">
                <button className="text-blue-600 font-medium hover:underline">
                  Advanced search
                </button>
                <div className="flex items-center text-blue-600 hover:underline cursor-pointer">
                  <ChevronLeft size={20} className="mr-1" />
                  <span className="font-medium">All results</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
});

export default Searchbar;
