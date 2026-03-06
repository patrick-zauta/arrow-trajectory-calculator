import { useMemo, useState } from "react"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { buildDefaultComponent, sumComponentWeight, sumComponentWeightByCategory } from "../lib/componentsBuilder"
import { buildPresetExport, parsePresetImport } from "../lib/presetIO"
import { decodeShareParams, encodeShareParams } from "../lib/share"
import type { ArrowComponentItem, Preset } from "../lib/types"
import { useAppStore } from "../store/useAppStore"

type MergeMode = "overwrite" | "copy"

interface ImportDialogState {
  fileName: string
  imported: Preset[]
  mergeMode: MergeMode
  conflictIds: string[]
}

const PIE_COLORS = ["#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316"]

function mergeImportedPresets(currentPresets: Preset[], imported: Preset[], mergeMode: MergeMode): Preset[] {
  const systemPresets = currentPresets.filter((preset) => preset.isSystem)
  const customPresets = currentPresets.filter((preset) => !preset.isSystem)

  if (mergeMode === "overwrite") {
    const importedIds = new Set(imported.map((preset) => preset.id))
    return [...systemPresets, ...customPresets.filter((preset) => !importedIds.has(preset.id)), ...imported]
  }

  const copied = imported.map((preset) => ({
    ...preset,
    id: `${preset.id}-copy-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    name: `${preset.name} (Import)`,
    isSystem: false,
  }))

  return [...systemPresets, ...customPresets, ...copied]
}

export function PresetsPage() {
  const setup = useAppStore((state) => state.activeSetup)
  const advanced = useAppStore((state) => state.advanced)
  const presets = useAppStore((state) => state.presets)
  const components = useAppStore((state) => state.components)
  const arrowBuilds = useAppStore((state) => state.arrowBuilds)
  const activeArrowBuildId = useAppStore((state) => state.activeArrowBuildId)

  const applyPreset = useAppStore((state) => state.applyPreset)
  const removePreset = useAppStore((state) => state.removePreset)
  const saveCurrentAsPreset = useAppStore((state) => state.saveCurrentAsPreset)
  const replacePresets = useAppStore((state) => state.replacePresets)
  const setComponents = useAppStore((state) => state.setComponents)
  const updateComponentWeightAsSetup = useAppStore((state) => state.updateComponentWeightAsSetup)
  const updateSetup = useAppStore((state) => state.updateSetup)
  const updateAdvanced = useAppStore((state) => state.updateAdvanced)
  const saveCurrentComponentsAsArrowBuild = useAppStore((state) => state.saveCurrentComponentsAsArrowBuild)
  const applyArrowBuild = useAppStore((state) => state.applyArrowBuild)
  const removeArrowBuild = useAppStore((state) => state.removeArrowBuild)

  const [importDialog, setImportDialog] = useState<ImportDialogState | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const totalWeight = useMemo(() => sumComponentWeight(components), [components])
  const componentBreakdown = useMemo(() => sumComponentWeightByCategory(components), [components])
  const activeArrowBuild = useMemo(
    () => arrowBuilds.find((build) => build.id === activeArrowBuildId) ?? null,
    [activeArrowBuildId, arrowBuilds],
  )

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

  const queuePresetImport = async (file: File) => {
    try {
      const text = await file.text()
      const imported = parsePresetImport(text)
      const existingIds = new Set(presets.map((preset) => preset.id))

      setImportError(null)
      setImportDialog({
        fileName: file.name,
        imported,
        mergeMode: "overwrite",
        conflictIds: imported.filter((preset) => existingIds.has(preset.id)).map((preset) => preset.id),
      })
    } catch (error) {
      setImportDialog(null)
      setImportError(error instanceof Error ? error.message : "Import fehlgeschlagen")
    }
  }

  const confirmPresetImport = () => {
    if (!importDialog) {
      return
    }

    replacePresets(mergeImportedPresets(presets, importDialog.imported, importDialog.mergeMode))
    setImportDialog(null)
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

  const saveArrowBuild = () => {
    const name = window.prompt("Name fuer diesen Pfeil")
    if (!name) {
      return
    }

    saveCurrentComponentsAsArrowBuild(name)
  }

  return (
    <main className="page">
      <header className="hero">
        <h2>Preset Manager</h2>
        <p>Presets verwalten, Pfeile konfigurieren, importieren/exportieren und teilen.</p>
        <div className="hero-meta">
          <span>Aktiver Pfeil: {activeArrowBuild?.name ?? "Kein Pfeil"}</span>
          <span>Gespeicherte Pfeile: {arrowBuilds.length}</span>
          <span>Presets gesamt: {presets.length}</span>
        </div>
      </header>

      <section className="card inline-actions accent-card accent-primary">
        <button type="button" onClick={exportPresets}>Presets exportieren</button>
        <label className="field">
          <span>Import Datei</span>
          <input
            type="file"
            accept="application/json"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                void queuePresetImport(file)
              }
              event.target.value = ""
            }}
          />
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

      {importError && (
        <section className="error">
          <strong>Importfehler:</strong> {importError}
        </section>
      )}

      {importDialog && (
        <section className="card modal-like">
          <div className="table-header">
            <div>
              <h3>Preset Import</h3>
              <p>
                Datei: <strong>{importDialog.fileName}</strong> mit {importDialog.imported.length} Presets.
              </p>
            </div>
            <button type="button" onClick={() => setImportDialog(null)}>
              Abbrechen
            </button>
          </div>
          <div className="layout-grid compact-grid">
            <article className="card">
              <h4>Konflikte</h4>
              <p>{importDialog.conflictIds.length} IDs existieren bereits im lokalen Bestand.</p>
              {importDialog.conflictIds.length > 0 && (
                <ul className="pill-list">
                  {importDialog.conflictIds.map((id) => (
                    <li key={id}>{id}</li>
                  ))}
                </ul>
              )}
            </article>
            <article className="card">
              <h4>Merge Strategie</h4>
              <div className="radio-row">
                <label>
                  <input
                    type="radio"
                    checked={importDialog.mergeMode === "overwrite"}
                    onChange={() => setImportDialog((current) => (current ? { ...current, mergeMode: "overwrite" } : current))}
                  />
                  Gleiche ID ueberschreiben
                </label>
                <label>
                  <input
                    type="radio"
                    checked={importDialog.mergeMode === "copy"}
                    onChange={() => setImportDialog((current) => (current ? { ...current, mergeMode: "copy" } : current))}
                  />
                  Als Kopie importieren
                </label>
              </div>
            </article>
          </div>
          <div className="inline-actions">
            <button type="button" onClick={confirmPresetImport}>Import bestaetigen</button>
          </div>
        </section>
      )}

      <section className="dashboard-strip">
        <article className="dashboard-stat">
          <span className="dashboard-label">Aktiver Builder</span>
          <strong>{activeArrowBuild?.name ?? "Kein Profil"}</strong>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-label">Komponenten</span>
          <strong>{components.length}</strong>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-label">Gesamtgewicht</span>
          <strong>{totalWeight.toFixed(2)} grain</strong>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-label">Active Setup</span>
          <strong>{setup.m_grain.toFixed(1)} grain</strong>
        </article>
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

      <section className="card accent-card accent-cyan">
        <div className="table-header">
          <div>
            <h3>Arrow Builder</h3>
            <p>
              Aktiver Pfeil: <strong>{activeArrowBuild?.name ?? "Kein Pfeil"}</strong> | Gesamtgewicht {totalWeight.toFixed(2)} grain
            </p>
          </div>
          <div className="inline-actions">
            <button type="button" onClick={saveArrowBuild}>Als Pfeil speichern</button>
            <button type="button" onClick={() => updateComponentWeightAsSetup(totalWeight)}>Total als Pfeilgewicht uebernehmen</button>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Pfeil</th>
                <th>Komponenten</th>
                <th>Total (grain)</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {arrowBuilds.map((build) => {
                const buildWeight = sumComponentWeight(build.components)

                return (
                  <tr key={build.id}>
                    <td>{build.name}</td>
                    <td>{build.components.length}</td>
                    <td>{buildWeight.toFixed(2)}</td>
                    <td className="inline-actions">
                      <button type="button" onClick={() => applyArrowBuild(build.id)}>Als aktiven Pfeil verwenden</button>
                      {!build.isSystem && <button type="button" onClick={() => removeArrowBuild(build.id)}>Loeschen</button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card accent-card accent-amber">
        <div className="table-header">
          <div>
            <h3>Komponenten Builder</h3>
            <p>Bearbeitet immer den aktuell ausgewaehlten Pfeil und macht ihn fuer alle Rechner verfuegbar.</p>
          </div>
          <div className="inline-actions">
            <button type="button" onClick={() => setComponents([...components, buildDefaultComponent()])}>Komponente hinzufügen</button>
            <button type="button" onClick={() => updateComponentWeightAsSetup(totalWeight)}>Gewicht ins Active Setup</button>
          </div>
        </div>

        <div className="layout-grid">
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

          <article className="card">
            <h4>Gewichtsverteilung</h4>
            <div className="chart-wrapper mini-chart">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={componentBreakdown}
                    dataKey="weight_grain"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={86}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  >
                    {componentBreakdown.map((entry, index) => (
                      <Cell key={entry.category} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)} grain`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
