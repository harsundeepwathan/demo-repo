import { createContext, useContext, useRef, type ReactNode } from "react";
import { useSharedValue, type SharedValue } from "react-native-reanimated";
import type { TaskStatus } from "./types";

export type ZoneBound = { status: TaskStatus; y: number; height: number };

type DragContextValue = {
  boundsShared: SharedValue<ZoneBound[]>;
  registerZone: (status: TaskStatus, node: any) => void;
  measureZones: () => void;
  setScrollEnabled: (enabled: boolean) => void;
  onDrop: (taskId: string, status: TaskStatus) => void;
};

const DragContext = createContext<DragContextValue | null>(null);

export function useDragContext(): DragContextValue {
  const ctx = useContext(DragContext);
  if (!ctx) throw new Error("useDragContext must be used within a DragProvider");
  return ctx;
}

export function DragProvider({
  children,
  setScrollEnabled,
  onDrop,
}: {
  children: ReactNode;
  setScrollEnabled: (enabled: boolean) => void;
  onDrop: (taskId: string, status: TaskStatus) => void;
}) {
  const boundsShared = useSharedValue<ZoneBound[]>([]);
  const nodes = useRef<Partial<Record<TaskStatus, any>>>({});

  function registerZone(status: TaskStatus, node: any) {
    nodes.current[status] = node;
  }

  function measureZones() {
    const statuses: TaskStatus[] = ["now", "next", "someday"];
    const results: ZoneBound[] = [];
    let pending = statuses.length;
    const finish = () => {
      pending -= 1;
      if (pending === 0) {
        boundsShared.value = results.sort((a, b) => a.y - b.y);
      }
    };
    statuses.forEach((status) => {
      const node = nodes.current[status];
      if (!node || typeof node.measureInWindow !== "function") {
        finish();
        return;
      }
      node.measureInWindow((_x: number, y: number, _width: number, height: number) => {
        results.push({ status, y, height });
        finish();
      });
    });
  }

  return (
    <DragContext.Provider value={{ boundsShared, registerZone, measureZones, setScrollEnabled, onDrop }}>
      {children}
    </DragContext.Provider>
  );
}
