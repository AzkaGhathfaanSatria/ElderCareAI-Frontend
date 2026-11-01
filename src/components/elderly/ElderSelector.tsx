"use client";

import type { BackendElder } from "../../services/backendApi";
import { SelectField } from "../ui/SelectField";

interface ElderSelectorProps {
  elders: BackendElder[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** Dropdown pemilih lansia. Disembunyikan kalau hanya ada satu lansia. */
function ElderSelector({ elders, selectedId, onSelect }: ElderSelectorProps) {
  if (elders.length < 2) return null;

  return (
    <SelectField
      id="elder-selector"
      label="Lansia yang ditampilkan"
      wrapperClassName="mb-6 max-w-sm"
      value={selectedId}
      onChange={(event) => onSelect(event.target.value)}
    >
      {elders.map((elder) => (
        <option key={elder.id} value={elder.id}>
          {elder.name}
        </option>
      ))}
    </SelectField>
  );
}

export default ElderSelector;
