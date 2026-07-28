"use client";

// Desktop right-click menu (plan-0009 §3.2). Local UI state lives in
// Desktop; this renders at a desktop-space point and reports item picks.

export interface ContextMenuItem {
  label: string;
  disabled?: boolean;
  action?: () => void;
}

export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  return (
    <menu
      className="w98-raised absolute z-[60] w-[150px] p-[3px]"
      style={{ left: x, top: y }}
    >
      {items.map((item) => (
        <li key={item.label}>
          <button
            type="button"
            className="w98-menu-item block w-full px-2 py-1 text-left font-w98 text-[9px] text-w98-ink disabled:text-w98-chrome-dark"
            disabled={item.disabled}
            onClick={() => {
              item.action?.();
              onClose();
            }}
          >
            {item.label}
          </button>
        </li>
      ))}
    </menu>
  );
}
