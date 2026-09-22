import type { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';
import { Icon } from './Icon';

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ComponentChildren;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div class="sheet-backdrop" onClick={onClose}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div class="sheet-head">
          {title && <h2>{title}</h2>}
          <button class="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  format = (v: number) => String(v),
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  label: string;
}) {
  return (
    <div class="stepper" role="group" aria-label={label}>
      <button onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label={`Less ${label}`}>
        −
      </button>
      <output>{format(value)}</output>
      <button onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label={`More ${label}`}>
        +
      </button>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} class="toggle" onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div class="segmented" role="radiogroup">
      {options.map((o) => (
        <button role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ComponentChildren }) {
  return (
    <div class="field">
      <div class="field-label">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </div>
      {children}
    </div>
  );
}

export function Chips({
  options,
  value,
  onChange,
  format = (v: number) => `${v} min`,
}: {
  options: number[];
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div class="chips">
      {options.map((o) => (
        <button class={o === value ? 'chip on' : 'chip'} onClick={() => onChange(o)}>
          {format(o)}
        </button>
      ))}
    </div>
  );
}

const CALL_NAMES = ['Mum', 'Dad', 'Mom', 'Mama', 'Papa', 'Grandma', 'Grandad'];

/** "What do your kids call you?" Kids see this instead of the parent's real name. */
export function KidsCallField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="What do your kids call you?" hint="Kids see this, e.g. “Let's show Mum!”">
      <div class="call-pick">
        {CALL_NAMES.map((n) => (
          <button class={value === n ? 'chip on' : 'chip'} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
      </div>
      <input class="input" value={value} placeholder="Or type your own" onInput={(e) => onChange(e.currentTarget.value)} />
    </Field>
  );
}
