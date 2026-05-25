import { useEffect, useRef, useState, useCallback, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

interface DropdownPortalProps {
  triggerRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Portal 下拉菜单 — 固定到 body 层，跟随触发按钮位置
 * 监听 resize + scroll 实时更新位置
 */
export default function DropdownPortal({ triggerRef, open, onClose, children }: DropdownPortalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  /** 根据 trigger 按钮实时计算位置 */
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
    });
  }, [triggerRef]);

  // 打开时计算初始位置
  useEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  // 监听 resize + scroll → 实时跟随
  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
