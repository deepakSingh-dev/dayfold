'use client';

import { Select } from '@/components/ui/select';

/** Editable custom-field values in the task side-peek. */
export function CustomFields({ fields, values, onSet }) {
  if (!fields?.length) return null;

  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs font-medium">Custom fields</p>
      <div className="space-y-2">
        {fields.map((f) => {
          const value = values?.[f.id] ?? '';
          const inputClass =
            'h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
          return (
            <div key={f.id} className="grid grid-cols-[110px_1fr] items-center gap-2">
              <span className="text-muted-foreground truncate text-xs font-medium">{f.name}</span>
              {f.type === 'select' ? (
                <Select value={value} onChange={(e) => onSet(f.id, e.target.value || null)}>
                  <option value="">—</option>
                  {f.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  defaultValue={value}
                  onBlur={(e) => onSet(f.id, e.target.value || null)}
                  className={inputClass}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
