import { useMemo, useState } from "react"
import { buildDefaultComponent, sumComponentWeight } from "../lib/componentsBuilder"
import { buildPresetExport, parsePresetImport } from "../lib/presetIO"
import { decodeShareParams, encodeShareParams } from "../lib/share"
import type { ArrowComponentItem, Preset } from "../lib/types"
import { useAppStore } from "../store/useAppStore"

export function PresetsPage() {
  const setup = useAppStore((state) => state.activeSetup)
  const advanced = useAppStore((state) => state.advanced)
  const presets = useAppStore((state) => state.presets)
  const components = useAppStore((state) => state.components)

  const applyPreset = useAppStore((state) => state.applyPreset)
  const removePreset = useAppStore((state) => state.removePreset)
  const saveCurrentAsPreset = useAppStore((state) => state.saveCurrentAsPreset)
  const replacePresets = useAppStore((state) => state.replacePresets)
  const setComponents = useAppStore((state) => state.setComponents)
  const updateComponentWeightAsSetup = useAppStore((state) => state.updateComponentWeightAsSetup)
  const updateSetup = useAppStore((state) => state.updateSetup)
  const updateAdvanced = useAppStore((state) => state.updateAdvanced)

  const [mergeMode, setMergeMode] = useState<"overwrite" | "copy">("overwrite")

  const totalWeight = useMemo(() => sumComponentWeight(components), [components])

  const exportPresets = () => {
    const exportData = buildPresetExport(presets)
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "presets.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const importPresets = async (file: File) => {
    const text = await file.text()
    const imported = parsePresetImport(text)

    const merged: Preset[] = mergeMode === "overwrite"
      ? [...presets.filter((preset) => preset.isSystem), ...imported]
      : [...presets, ...imported.map((preset) => ({ ...preset, id: `${preset.id}-copy-${Date.now()}` }))]

    replacePresets(merged)
  }

  const copyShareLink = async () => {
    const params = encodeShareParams({ setup, advanced })
    const base = `${window.location.origin}${window.location.pathname}`
    const hash = window.location.hash || "#/flight"
    const url = `${base}?${params.toString()}${hash}`
    await navigator.clipboard.writeText(url)
    window.alert("Share Link kopiert")
  }

  const importFromCurrentQuery = () => {
    const params = new URLSearchParams(window.location.search)
    if (!params.toString()) {
      window.alert("Keine Query Parameter vorhanden")
      return
    }

    const decoded = decodeShareParams(params, { setup, advanced })
    updateSetup(decoded.setup)
    updateAdvanced(decoded.advanced)
  }

  const updateComponent = (id: string, patch: Partial<ArrowComponentItem>) => {
    setComponents(components.map((component) => (component.id === id ? { ...component, ...patch } : component)))
  }

  return (
    <main className="page">
      <header className="hero">
        <h2>Preset Manager</h2>
        <p>Presets verwalten, importieren/exportieren, teilen und Komponenten summieren.</p>
      </header>

      <section className="card inline-actions">
        <button type="button" onClick={exportPresets}>Presets exportieren</button>
        <label className="field">
          <span>Merge Modus</span>
          <select value={mergeMode} onChange={(event) => setMergeMode(event.target.value as "overwrite" | "copy")}>
            <option value="overwrite">Gleiche ID überschreiben</option>
            <option value="copy">Als Kopie importieren</option>
          </select>
        </label>
        <label className="field">
          <span>Import Datei</span>
          <input type="file" accept="application/json" onChange={(event) => event.target.files?.[0] && importPresets(event.target.files[0])} />
        </label>
        <button type="button" onClick={copyShareLink}>Share Link kopieren</button>
        <button type="button" onClick={importFromCurrentQuery}>Share Query laden</button>
        <button
          type="button"
          onClick={() => {
            const name = window.prompt("Preset Name")
            if (name) {
              saveCurrentAsPreset(name)
            }
          }}
        >
          Aktuelles Setup als Preset
        </button>
      </section>

      <section className="card">
        <h3>Presets</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>v_fps</th>
                <th>d_mm</th>
                <th>m_grain</th>
                <th>angle_deg</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {presets.map((preset) => (
                <tr key={preset.id}>
                  <td>{preset.name}</td>
                  <td>{preset.setup.v_fps}</td>
                  <td>{preset.setup.d_mm}</td>
                  <td>{preset.setup.m_grain}</td>
                  <td>{preset.setup.angle_deg}</td>
                  <td className="inline-actions">
                    <button type="button" onClick={() => applyPreset(preset.id)}>Aktivieren</button>
                    {!preset.isSystem && <button type="button" onClick={() => removePreset(preset.id)}>Loeschen</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Komponenten Builder</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Grain</th>
                <th>Kategorie</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {components.map((component) => (
                <tr key={component.id}>
                  <td>
                    <input value={component.name} onChange={(event) => updateComponent(component.id, { name: event.target.value })} />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={component.weight_grain}
                      onChange={(event) => updateComponent(component.id, { weight_grain: Number(event.target.value) || 0 })}
                    />
                  </td>
                  <td>
                    <select
                      value={component.category}
                      onChange={(event) =>
                        updateComponent(component.id, {
                          category: event.target.value as ArrowComponentItem["category"],
                        })
                      }
                    >
                      <option>Shaft</option>
                      <option>Spitze</option>
                      <option>Insert</option>
                      <option>Nocke</option>
                      <option>Vanes</option>
                      <option>Wrap</option>
                      <option>Sonstiges</option>
                    </select>
                  </td>
                  <td>
                    <button type="button" onClick={() => setComponents(components.filter((entry) => entry.id !== component.id))}>
                      Entfernen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="inline-actions">
          <button type="button" onClick={() => setComponents([...components, buildDefaultComponent()])}>Komponente hinzufügen</button>
          <button type="button" onClick={() => updateComponentWeightAsSetup(totalWeight)}>Total als Pfeilgewicht übernehmen</button>
        </div>
        <p>Total: {totalWeight.toFixed(2)} grain</p>
      </section>
    </main>
  )
}