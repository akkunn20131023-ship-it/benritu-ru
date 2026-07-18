import { NavLink } from "react-router-dom";
import { Home, Settings, PanelLeftClose, PanelLeftOpen, Puzzle, Bot, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { useLayoutStore } from "@/stores/useLayoutStore";
import { useFavoritesStore } from "@/stores/useFavoritesStore";
import { usePlugins } from "@/plugins/usePlugins";

/** 左サイドバー: ホーム・お気に入り・プラグイン一覧・設定への導線 */
export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore();
  const { plugins } = usePlugins();
  const { favoriteIds } = useFavoritesStore();

  const favorites = plugins.filter((p) => favoriteIds.includes(p.manifest.id));
  const enabledPlugins = plugins.filter((p) => p.enabled);

  return (
    <aside
      className={clsx(
        "flex shrink-0 flex-col border-r border-black/5 bg-white/50 py-2 transition-[width] duration-200 dark:border-white/5 dark:bg-neutral-900/50",
        sidebarCollapsed ? "w-14" : "w-56"
      )}
    >
      <nav className="flex-1 space-y-4 overflow-y-auto px-2">
        <div>
          <SidebarLink to="/app" icon={Home} label="ホーム" collapsed={sidebarCollapsed} />
        </div>

        {favorites.length > 0 && (
          <SidebarSection title="お気に入り" collapsed={sidebarCollapsed}>
            {favorites.map((p) => (
              <SidebarLink key={p.manifest.id} to={`/plugin/${p.manifest.id}`} icon={p.icon} label={p.manifest.name} collapsed={sidebarCollapsed} />
            ))}
          </SidebarSection>
        )}

        <SidebarSection title="機能" collapsed={sidebarCollapsed}>
          {enabledPlugins.map((p) => (
            <SidebarLink key={p.manifest.id} to={`/plugin/${p.manifest.id}`} icon={p.icon} label={p.manifest.name} collapsed={sidebarCollapsed} />
          ))}
        </SidebarSection>
      </nav>

      <div className="space-y-1 border-t border-black/5 px-2 pt-2 dark:border-white/5">
        <SidebarLink to="/settings/ai" icon={Bot} label="AI設定" collapsed={sidebarCollapsed} />
        <SidebarLink to="/settings/plugins" icon={Puzzle} label="プラグイン管理" collapsed={sidebarCollapsed} />
        <SidebarLink to="/settings" icon={Settings} label="設定" collapsed={sidebarCollapsed} />
        <button
          onClick={toggleSidebar}
          className="app-no-drag flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10"
        >
          {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          {!sidebarCollapsed && "折りたたむ"}
        </button>
      </div>
    </aside>
  );
}

function SidebarSection({ title, collapsed, children }: { title: string; collapsed: boolean; children: React.ReactNode }) {
  return (
    <div>
      {!collapsed && <p className="px-2.5 pb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">{title}</p>}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarLink({
  to,
  icon: Icon,
  label,
  collapsed,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/app"}
      className={({ isActive }) =>
        clsx(
          "app-no-drag flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
          isActive ? "bg-accent/15 text-accent font-medium" : "text-neutral-700 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
        )
      }
      title={collapsed ? label : undefined}
    >
      <Icon size={17} />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}
