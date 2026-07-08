import { useCallback, useEffect, useState } from "react";

/**
 * プラグイン SDK: プラグイン専用の名前空間付き永続ストレージにアクセスするフック。
 * 他プラグインの領域には干渉できないよう pluginId でスコープされる。
 */
export function usePluginStore<T>(pluginId: string, key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    window.api.plugins.storeGet(pluginId, key).then((stored) => {
      if (!cancelled) {
        if (stored !== undefined) setValue(stored as T);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pluginId, key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      void window.api.plugins.storeSet(pluginId, key, next);
    },
    [pluginId, key]
  );

  return [value, update, loaded] as const;
}
