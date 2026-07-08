import { useState } from "react";
import { FolderOpen, Folder, File as FileIcon, Star, ChevronRight, ExternalLink, FolderSearch, RefreshCw, Search } from "lucide-react";
import type { FileEntry } from "@shared/types";
import { formatBytes } from "@/lib/formatBytes";
import { usePluginStore } from "../../usePluginStore";
import type { PluginModule } from "../../types";

const PLUGIN_ID = "file-browser";

interface FileMeta {
  tags: string[];
  favorite: boolean;
}

function FileBrowserPage() {
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [metaMap, setMetaMap] = usePluginStore<Record<string, FileMeta>>(PLUGIN_ID, "meta", {});

  async function loadDir(dirPath: string) {
    setLoading(true);
    try {
      const list = await window.api.files.listDir(dirPath);
      setEntries(list);
      setCurrentPath(dirPath);
    } finally {
      setLoading(false);
    }
  }

  async function openFolder() {
    const folder = await window.api.files.pickFolder();
    if (folder) {
      setRootPath(folder);
      void loadDir(folder);
    }
  }

  function toggleFavorite(path: string) {
    const meta = metaMap[path] ?? { tags: [], favorite: false };
    setMetaMap({ ...metaMap, [path]: { ...meta, favorite: !meta.favorite } });
  }

  const sep = rootPath?.includes("\\") ? "\\" : "/";
  const segments = currentPath && rootPath ? currentPath.replace(rootPath, "").split(/[\\/]/).filter(Boolean) : [];

  const filtered = search.trim() ? entries.filter((e) => e.name.toLowerCase().includes(search.toLowerCase())) : entries;

  const favorites = Object.entries(metaMap)
    .filter(([, m]) => m.favorite)
    .map(([p]) => p);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={openFolder}
          className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <FolderOpen size={14} /> フォルダを開く
        </button>
        {currentPath && (
          <button
            onClick={() => loadDir(currentPath)}
            className="app-no-drag rounded-lg bg-black/5 p-2 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
            title="更新"
          >
            <RefreshCw size={14} />
          </button>
        )}
        <div className="app-no-drag flex flex-1 items-center gap-2 rounded-lg glass-panel px-3 py-1.5">
          <Search size={14} className="text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="このフォルダ内を検索..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {rootPath && (
        <div className="flex items-center gap-1 overflow-x-auto text-xs text-neutral-500">
          <button onClick={() => loadDir(rootPath)} className="app-no-drag shrink-0 hover:text-accent">
            {rootPath.split(/[\\/]/).pop()}
          </button>
          {segments.map((seg, i) => (
            <span key={i} className="flex shrink-0 items-center gap-1">
              <ChevronRight size={12} />
              <button
                onClick={() => loadDir([rootPath, ...segments.slice(0, i + 1)].join(sep))}
                className="app-no-drag hover:text-accent"
              >
                {seg}
              </button>
            </span>
          ))}
        </div>
      )}

      {favorites.length > 0 && !currentPath && (
        <div className="glass-panel rounded-lg p-3">
          <h3 className="mb-1.5 text-xs font-medium text-neutral-500">お気に入り</h3>
          <div className="flex flex-wrap gap-1.5">
            {favorites.map((p) => (
              <span key={p} className="rounded-full bg-black/5 px-2.5 py-1 text-xs dark:bg-white/10">
                {p.split(/[\\/]/).pop()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto rounded-lg glass-panel p-1.5">
        {!currentPath && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-neutral-500">
            <FolderSearch size={28} />
            「フォルダを開く」から閲覧するフォルダを選択してください
          </div>
        )}
        {currentPath && filtered.length === 0 && !loading && <p className="p-4 text-center text-sm text-neutral-500">ファイルがありません</p>}
        {filtered.map((entry) => {
          const meta = metaMap[entry.path];
          return (
            <div
              key={entry.path}
              onClick={() => entry.isDirectory && loadDir(entry.path)}
              className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 ${
                entry.isDirectory ? "cursor-pointer" : ""
              }`}
            >
              {entry.isDirectory ? <Folder size={16} className="shrink-0 text-accent" /> : <FileIcon size={16} className="shrink-0 text-neutral-400" />}
              <span className="flex-1 truncate">{entry.name}</span>
              {!entry.isDirectory && <span className="shrink-0 text-xs text-neutral-400">{formatBytes(entry.size)}</span>}
              <Star
                size={14}
                className={`shrink-0 cursor-pointer ${meta?.favorite ? "text-amber-400" : "opacity-0 group-hover:opacity-60 hover:opacity-100"}`}
                fill={meta?.favorite ? "currentColor" : "none"}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(entry.path);
                }}
              />
              {!entry.isDirectory && (
                <ExternalLink
                  size={14}
                  className="shrink-0 cursor-pointer opacity-0 group-hover:opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    void window.api.files.openPath(entry.path);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const FileBrowserPlugin: PluginModule = {
  manifest: {
    id: "file-browser",
    name: "ファイルブラウザ",
    version: "0.1.0",
    description: "フォルダ閲覧・検索・お気に入り登録",
    category: "files",
    entry: "file-browser",
  },
  icon: FolderOpen,
  Component: FileBrowserPage,
};
