import { useRef, useState, useCallback } from 'react';
import { Palette, X } from 'lucide-react';
import DropdownPortal from './DropdownPortal';

interface ColorPickerProps {
  currentColor: string | null;
  onColorChange: (color: string | null) => void;
}

const PRESET_COLORS = [
  { label: 'White',  value: '#e7e5e5' },
  { label: 'Gray',   value: '#acabaa' },
  { label: 'Red',    value: '#e06c75' },
  { label: 'Orange', value: '#d19a66' },
  { label: 'Yellow', value: '#e5c07b' },
  { label: 'Green',  value: '#16c27d' },
  { label: 'Cyan',   value: '#56b6c2' },
  { label: 'Blue',   value: '#61afef' },
  { label: 'Purple', value: '#c678dd' },
  { label: 'Pink',   value: '#e0528a' },
];

export default function ColorPicker({ currentColor, onColorChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleColor = useCallback(
    (color: string | null) => {
      onColorChange(color);
      setOpen(false);
    },
    [onColorChange],
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-md transition-colors text-on-surface-variant hover:text-on-surface hover:bg-white/5 flex items-center gap-1"
        title="Text Color"
      >
        <Palette className="w-4 h-4" />
        {currentColor && (
          <span
            className="w-3 h-3 rounded-full border border-outline-variant/30"
            style={{ backgroundColor: currentColor }}
          />
        )}
      </button>

      <DropdownPortal triggerRef={btnRef} open={open} onClose={() => setOpen(false)}>
        <div className="bg-surface-highest/80 backdrop-blur-xl border border-outline-variant/20 rounded-md shadow-xl p-3">
          <div className="grid grid-cols-5 gap-1.5 mb-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => handleColor(c.value)}
                className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${
                  currentColor === c.value
                    ? 'border-secondary ring-1 ring-secondary'
                    : 'border-outline-variant/30'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleColor(null)}
            className="w-full flex items-center justify-center gap-1 text-xs text-on-surface-variant hover:text-secondary py-1 rounded hover:bg-secondary/10 transition-colors"
          >
            <X className="w-3 h-3" />
            Remove Color
          </button>
        </div>
      </DropdownPortal>
    </>
  );
}
