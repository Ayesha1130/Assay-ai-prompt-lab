"use client";

import { LIMITS } from "@/lib/engine/runner";
import { getModel, MODELS, type ModelInfo } from "@/lib/engine/pricing";
import type { Side, Variant } from "@/lib/engine/types";
import { SIDE_STYLE } from "@/lib/side";

interface Props {
  side: Side;
  value: Variant;
  onChange: (next: Variant) => void;
  disabled?: boolean;
  /** Limit the model list, for example to the free demo model for visitors. */
  models?: ModelInfo[];
}

export function VariantEditor({ side, value, onChange, disabled, models = MODELS }: Props) {
  const style = SIDE_STYLE[side];
  const model = getModel(value.model);
  const base = `variant-${side}`;

  return (
    <fieldset
      disabled={disabled}
      className={`min-w-0 rounded-r-xl border-l-4 ${style.leftRule} bg-panel/70 py-5 pl-5 pr-4 sm:pr-5`}
    >
      <legend className="sr-only">Prompt {side}</legend>
      <h2 className={`text-xl font-extrabold tracking-tight ${style.text}`}>Prompt {side}</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${base}-name`} className="mb-1.5 block text-sm font-semibold">
            Name
          </label>
          <input
            id={`${base}-name`}
            className="field"
            value={value.name}
            maxLength={60}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor={`${base}-model`} className="mb-1.5 block text-sm font-semibold">
            Model
          </label>
          <select
            id={`${base}-model`}
            className="field"
            value={value.model}
            onChange={(e) => onChange({ ...value, model: e.target.value })}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          {model ? <p className="mt-1.5 text-xs text-mute">{model.note}</p> : null}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor={`${base}-text`} className="mb-1.5 block text-sm font-semibold">
          Prompt text
        </label>
        <textarea
          id={`${base}-text`}
          className="field field-mono"
          rows={7}
          maxLength={LIMITS.maxTemplate}
          value={value.template}
          spellCheck={false}
          onChange={(e) => onChange({ ...value, template: e.target.value })}
        />
        <p className="mt-1.5 text-xs text-mute">
          Put <code className="rounded bg-raised px-1 py-0.5 font-mono text-fg">{"{{input}}"}</code> where each test input goes.{" "}
          {value.template.length} of {LIMITS.maxTemplate} characters.
        </p>
      </div>
    </fieldset>
  );
}
