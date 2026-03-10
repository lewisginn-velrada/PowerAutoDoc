import { useState } from "react";

// MoSCoW: M = Must Have, S = Should Have, C = Could Have, W = Won't (for now)
const moscow = {
  M: { label: "MUST", color: "#E74C3C", bg: "#2a0808" },
  S: { label: "SHOULD", color: "#E8A838", bg: "#2a1800" },
  C: { label: "COULD", color: "#4A90D9", bg: "#0d1f35" },
  W: { label: "WON'T", color: "#4a6a90", bg: "#0d1520" },
};

const layers = [
  {
    id: "input",
    label: "01 — INPUT LAYER",
    color: "#4A90D9",
    bg: "#0d1f35",
    description: "What we consume from the Git repo",
    components: [
      { name: "Solution ZIPs", icon: "📦", detail: "Unpacked via pac CLI before the tool runs. Contains all component folders, solution.xml, relationships.", tags: ["XML", "pac CLI"], done: true, moscow: "M" },
      { name: "Flat XML Exports", icon: "🗂️", detail: "Pre-extracted XML files per component. Entities, forms, views, saved queries, relationships all parsed.", tags: ["XML", "Structured"], done: true, moscow: "M" },
      { name: "Power Automate Flows", icon: "🔄", detail: "Flow JSON exported with solution. Trigger, actions, conditions extracted into FlowModel IR.", tags: ["JSON"], done: true, moscow: "S" },
      { name: "Plugins & Assemblies", icon: "⚙️", detail: "Plugin step registrations from solution XML. Assembly metadata, entity/message/stage bindings.", tags: ["C#", "XML"], done: true, moscow: "S" },
      { name: "Web Resources (JS)", icon: "📜", detail: "JavaScript files from WebResources folder. JSDoc comments, Xrm API calls, event handler registrations extracted per file.", tags: ["JS", "XML"], done: false, moscow: "S" },
      { name: "PCF Controls", icon: "🧩", detail: "Power Apps Component Framework controls unpacked from solution. Manifest, component metadata extracted.", tags: ["JSON", "XML"], done: false, moscow: "C" },
      { name: "Canvas App Source", icon: "🎨", detail: "Unpacked .msapp source. Reads screens, controls, formulas.", tags: ["JSON", "Optional"], done: false, moscow: "W" },
    ]
  },
  {
    id: "parser",
    label: "02 — PARSER LAYER",
    color: "#E8A838",
    bg: "#2a1f00",
    description: "Typed extractors — one per source type, all emit IR objects",
    components: [
      { name: "Solution Manifest Parser", icon: "🔍", detail: "Reads Other/solution.xml. Extracts unique name, display name, version, managed flag, publisher and customization prefix.", tags: ["Core"], done: true, moscow: "M" },
      { name: "Entity / Table Parser", icon: "🗃️", detail: "Extracts table schema: columns, types, required flags, isCustom detection, maxLength, lookup targets. Base currency field filtering.", tags: ["Core"], done: true, moscow: "M" },
      { name: "View Parser", icon: "👁️", detail: "Parses SavedQuery XML. View type detection, columns, filter conditions including nested link-entity joins with depth tracking and alias resolution.", tags: ["Core"], done: true, moscow: "M" },
      { name: "Form Parser", icon: "📋", detail: "Parses FormXml for Main, Quick Create and Card forms. Extracts tabs, sections, fields and header fields. Inactive forms skipped.", tags: ["Core"], done: true, moscow: "M" },
      { name: "Relationship Parser", icon: "↔️", detail: "Reads Other/Relationships XML files. OneToMany resolved from both perspectives. Custom vs standard detection. Direction-aware rendering.", tags: ["Core"], done: true, moscow: "M" },
      { name: "Flow / Workflow Parser", icon: "🔄", detail: "Modern flows from JSON. Classic workflows from XML. Extracts trigger, steps, conditions into FlowModel.", tags: ["Core"], done: true, moscow: "S" },
      { name: "Plugin Parser", icon: "🔌", detail: "Plugin assemblies and SDK message processing steps. Entity, message, stage, order, filter expressions.", tags: ["Core"], done: true, moscow: "S" },
      { name: "Web Resource Analyser", icon: "📜", detail: "Parses JS files for JSDoc comments, Xrm.Page / Xrm.WebApi calls, form event registrations. Extracts function signatures.", tags: ["JS"], done: false, moscow: "S" },
      { name: "PCF Parser", icon: "🧩", detail: "Reads ControlManifest.xml. Extracts component name, properties, data types.", tags: ["XML"], done: false, moscow: "C" },
      { name: "Security Role Parser", icon: "🔐", detail: "Reads role XML. Builds privilege matrix per entity (Create/Read/Write/Delete/Append etc). Groups by functional area.", tags: ["Core"], done: false, moscow: "C" },
    ]
  },
  {
    id: "ir",
    label: "03 — IR LAYER",
    color: "#7B61FF",
    bg: "#170f35",
    description: "Intermediate Representation — domain-split TypeScript interfaces, single source of truth",
    components: [
      { name: "SolutionModel", icon: "🏗️", detail: "Top-level container. Publisher, version, managed flag, customization prefix. Tables attached post-parse.", tags: ["ir/solution.ts"], done: true, moscow: "M" },
      { name: "TableModel + ColumnModel", icon: "📊", detail: "Schema, columns with ColumnType union, isCustom flags, relationships, forms, views all nested.", tags: ["ir/table.ts"], done: true, moscow: "M" },
      { name: "FormModel + ViewModel", icon: "🖼️", detail: "Forms with tabs/sections/fields. Views with typed filter conditions, nested join support, isDefault/isQuickFind flags.", tags: ["ir/form.ts", "ir/view.ts"], done: true, moscow: "M" },
      { name: "RelationshipModel", icon: "↔️", detail: "OneToMany with referencing/referenced entity, lookup field, direction perspective, isCustom flag.", tags: ["ir/relationship.ts"], done: true, moscow: "M" },
      { name: "ViewFilterCondition", icon: "🔍", detail: "Filter conditions with depth tracking. isJoin flag for link-entity rows. joinField for readable column prefixing.", tags: ["ir/view.ts"], done: true, moscow: "M" },
      { name: "FlowModel", icon: "🔀", detail: "Trigger type, entity, steps with human-readable action descriptions. Mermaid-ready structure.", tags: ["ir/flow.ts"], done: true, moscow: "S" },
      { name: "PluginModel", icon: "🔌", detail: "Assembly, class, step registrations with entity + message + stage + order.", tags: ["ir/plugin.ts"], done: true, moscow: "S" },
      { name: "WebResourceModel", icon: "📜", detail: "Per-file model. Functions with JSDoc, Xrm API calls detected, event bindings, dependencies.", tags: ["ir/webresource.ts"], done: false, moscow: "S" },
      { name: "AISummaryBlock", icon: "🤖", detail: "Provider-agnostic summary model. Attached to FlowModel, PluginAssemblyModel, WebResourceModel and PCFModel. Contains summary text, model used, and generated timestamp.", tags: ["ir/summary.ts"], done: false, moscow: "S" },
      { name: "PCFModel", icon: "🧩", detail: "Component manifest metadata, property definitions, data types.", tags: ["ir/pcf.ts"], done: false, moscow: "C" },
      { name: "SecurityModel", icon: "🛡️", detail: "Roles with full privilege matrix. Ready for table rendering per entity.", tags: ["ir/security.ts"], done: false, moscow: "C" },
    ]
  },
  {
    id: "enrichment",
    label: "04 — ENRICHMENT LAYER",
    color: "#2ECC71",
    bg: "#0a2316",
    description: "Cross-cutting analysis — diagrams, metrics, change detection",
    components: [
      { name: "AI Summary Generator", icon: "🤖", detail: "Calls configurable LLM provider (Claude, Azure OpenAI etc) with component source and IR as context. Produces a plain-English summary block per component, prepended to each wiki page.", tags: ["AI", "Enrichment"], done: false, moscow: "S" },
      { name: "Mermaid Generator", icon: "📈", detail: "ER diagrams from TableModels. Flowcharts from FlowModels. Sequence diagrams for plugin chains.", tags: ["Diagram"], done: false, moscow: "S" },
      { name: "Dependency Resolver", icon: "🔗", detail: "Resolves plugin → entity, flow → table links. Surfaces in docs as 'Used By' / 'Related' sections.", tags: ["Analysis"], done: false, moscow: "C" },
      { name: "Complexity Scorer", icon: "📏", detail: "Flags high-complexity flows/plugins. Highlights what needs most attention in handover docs.", tags: ["Analysis"], done: false, moscow: "C" },
      { name: "Change Detector", icon: "📝", detail: "Git diff between commits → 'What changed since last release'. Generates change log wiki pages.", tags: ["Optional"], done: false, moscow: "C" },
    ]
  },
  {
    id: "output",
    label: "05 — OUTPUT LAYER",
    color: "#E74C3C",
    bg: "#2a0a0a",
    description: "Pluggable renderers — swap or combine without touching parsers or IR",
    components: [
      { name: "Markdown Renderer", icon: "✍️", detail: "Primary output. Produces .md files per table plus solution overview. Compact/detailed config toggle. Unix line endings enforced for ADO Wiki compatibility.", tags: ["Primary"], done: true, moscow: "M" },
      { name: "ADO Wiki Publisher", icon: "🌐", detail: "Azure DevOps REST API. Creates/updates wiki pages in the correct hierarchy. Handles page ordering.", tags: ["ADO"], done: true, moscow: "S" },
      { name: "Word / PDF Renderer", icon: "📄", detail: "Optional. Same IR → docx library → as-built document for client delivery.", tags: ["Optional"], done: false, moscow: "C" },
      { name: "Confluence Renderer", icon: "🔵", detail: "Same IR → Confluence storage format. For clients not on ADO. Low priority — most clients use ADO.", tags: ["Optional"], done: false, moscow: "W" },
    ]
  },
  {
    id: "pipeline",
    label: "06 — PIPELINE LAYER",
    color: "#1ABC9C",
    bg: "#0a2420",
    description: "Azure DevOps YAML templates — reusable across all client projects",
    components: [
      { name: "Pipeline Template", icon: "🏭", detail: "Reusable YAML template in vel-docgen repo. Client projects reference it by version. No copy-paste.", tags: ["ADO YAML"], done: false, moscow: "S" },
      { name: "doc-gen.config.yml", icon: "⚙️", detail: "Per-project config. Multi-solution support with roles (datamodel/plugins/flows). Filtering, render options, wiki target path.", tags: ["Config"], done: true, moscow: "M" },
      { name: "Trigger Strategy", icon: "⚡", detail: "On push to main, on PR, scheduled nightly, or manual dispatch. Configurable per project.", tags: ["Trigger"], done: false, moscow: "S" },
      { name: "IR Artifact Store", icon: "💾", detail: "IR JSON snapshot published as pipeline artifact. Enables diffing, debugging, re-runs from cache.", tags: ["Artefact"], done: false, moscow: "C" },
    ]
  }
];

const pages = [
  { emoji: "🏠", name: "Solution Overview", desc: "Publisher, version, managed/unmanaged, component counts, tables index", done: true, moscow: "M" },
  { emoji: "📋", name: "Table Pages", desc: "Custom & standard columns, relationships, forms with layout, views with filters", done: true, moscow: "M" },
  { emoji: "🔄", name: "Automations", desc: "AI summary at top, then Power Automate flows and classic workflows with triggers and actions", done: true, moscow: "S" },
  { emoji: "🔌", name: "Plugins", desc: "AI summary at top, then plugin assemblies with per-class subpages, step registrations, entity/message/stage bindings", done: true, moscow: "S" },
  { emoji: "📜", name: "Web Resources", desc: "AI summary at top, then JS files with function index, Xrm API usage, form event bindings", done: false, moscow: "S" },
  { emoji: "🧩", name: "PCF Controls", desc: "AI summary at top, then component manifest, properties, data types", done: false, moscow: "C" },
  { emoji: "🛡️", name: "Security", desc: "Role matrix, privilege summary per entity, business unit structure", done: false, moscow: "C" },
  { emoji: "🔗", name: "Integrations", desc: "Connection references, connectors, environment variables", done: false, moscow: "C" },
  { emoji: "📝", name: "Change Log", desc: "What changed per release — git-diff driven, auto-generated", done: false, moscow: "C" },
];

const decisions = [
  { q: "AI summary provider?", a: "Configurable — any provider", reason: "Abstracted behind a SummaryProvider interface in the enrichment layer. Claude, Azure OpenAI or any compatible API configured in doc-gen.config.yml. Provider, model, and credentials all config-driven. Summaries are optional — if no provider is configured the tool runs as normal and summary blocks are omitted." },
  { q: "Where do AI summaries appear?", a: "Top of each component page", reason: "Each automation component page (flows, classic workflows, plugins, web resources, PCF) gets a plain-English summary block prepended before the detail tables. Gives non-technical readers an immediate understanding of what the component does without having to read the full technical breakdown." },
  { q: "Architecture pattern?", a: "IR as the contract", reason: "Parsers only produce IR. Renderers only consume IR. Neither knows about the other. Adding a new input format means a new parser emitting existing IR types. Adding a new output format means a new renderer reading existing IR types. The layers never cross." },
  { q: "Solution input format?", a: "pac unpack → flat XML", reason: "pac solution unpack runs before the tool. Unpacked XML is the working format. ZIPs and unpacked folders are gitignored. Keeps the tool simple — no ZIP extraction logic, no pac dependency at runtime." },
  { q: "Language / Runtime?", a: "TypeScript / Node.js", reason: "Typed IR interfaces catch errors at compile time. tsx for fast dev iteration. NodeNext module resolution. Type safety across the parser → IR → renderer boundary is the main benefit." },
  { q: "Markdown templating?", a: "String builder (no engine)", reason: "Pure TypeScript string arrays with a markdownTable() helper. No Handlebars or template engine dependency. Fully typed, easier to debug, and simpler to maintain than a templating DSL." },
  { q: "Multi-solution projects?", a: "Config-driven merge", reason: "doc-gen.config.yml lists multiple solutions. The tool parses each independently into IR then merges into a single wiki. Keeps solutions decoupled in source but unified in output." },
  { q: "How reusable across clients?", a: "npm package + pipeline template", reason: "vel-docgen is the shared tool repo. Each client project has doc-gen.config.yml and references the shared ADO pipeline template by version. No copy-paste, no drift between clients." },
  { q: "What gets rendered?", a: "Config-driven component toggles", reason: "Each component type (tables, flows, plugins, web resources etc) can be enabled/disabled per project in doc-gen.config.yml. Projects only document what's relevant — a plugin-only solution won't generate empty flow pages." },
  { q: "Custom vs standard components?", a: "Custom-first, standard optional", reason: "Standard OOTB columns, relationships and tables are hidden by default. Configurable per project via excludeStandardRelationships, customColumnsOnly, and DEFAULT_EXCLUDED_COLUMNS. Keeps docs focused on what the team actually built." },
  { q: "Plugin wiki structure?", a: "Per-class subpages", reason: "Each plugin class gets its own wiki page under the assembly index, rather than one flat page per assembly. Assemblies with 30+ classes would be unreadable as a single page. Subpages also get their own sidebar entry for direct navigation." },
  { q: "ADO wiki page ordering?", a: "Reverse-alpha publish order", reason: "ADO Wiki REST API orders pages by creation time, newest first. Publishing siblings in reverse-alphabetical order means the sidebar renders A→Z. No .order file or git repo access needed — just a sort before publish." },
  { q: "Where does the IR live?", a: "In-memory + JSON artifact", reason: "IR is built in memory each run. Pipeline artifact publishing is planned — enables diffing between releases, debugging parse output, and incremental re-runs without re-parsing unchanged solutions." },
];

const progress = [
  {
    phase: "Phase 1 — Core Data Model", color: "#4A90D9", status: "COMPLETE",
    items: [
      { label: "Solution manifest parser", done: true },
      { label: "Entity / table parser", done: true },
      { label: "Column type mapping + filtering", done: true },
      { label: "Relationship parser (1:N)", done: true },
      { label: "IR models split by domain", done: true },
      { label: "Barrel exports (parsers + renderers)", done: true },
      { label: "Config system with defaults", done: true },
      { label: "Markdown renderer", done: true },
      { label: "Solution overview page", done: true },
      { label: "Per-table documentation pages", done: true },
    ]
  },
  {
    phase: "Phase 2 — Forms, Views & Filters", color: "#E8A838", status: "COMPLETE",
    items: [
      { label: "Form parser (Main, Quick Create, Card)", done: true },
      { label: "View parser with type detection", done: true },
      { label: "View filter condition extraction", done: true },
      { label: "Nested join filter hierarchy + depth", done: true },
      { label: "Linked entity column prefixing", done: true },
      { label: "Compact / detailed form layout toggle", done: true },
      { label: "OOTB column exclusion defaults", done: true },
      { label: "Base currency field filtering", done: true },
    ]
  },
  {
    phase: "Phase 3 — Automation, Code & Security", color: "#7B61FF", status: "IN PROGRESS",
    items: [
      { label: "Flow parser (Power Automate)", done: true },
      { label: "Classic workflow parser", done: false },
      { label: "Plugin step parser", done: true },
      { label: "JavaScript WebResource parser", done: false },
      { label: "PCF component parser", done: false },
      { label: "Security role privilege matrix", done: false },
      { label: "Environment variables parser", done: false },
      { label: "Connection references parser", done: false },
      { label: "Mermaid ER diagram generation", done: false },
      { label: "AI summary generator (configurable provider)", done: false },
      { label: "AISummaryBlock in IR", done: false },
      { label: "AI summaries — flows + classic workflows", done: false },
      { label: "AI summaries — plugin assemblies", done: false },
      { label: "AI summaries — web resources", done: false },
      { label: "AI summaries — PCF controls", done: false },
    ]
  },
  {
    phase: "Phase 4 — Pipeline & Reusability", color: "#1ABC9C", status: "IN PROGRESS",
    items: [
      { label: "doc-gen.config.yml schema + parser", done: true },
      { label: "Multi-solution support (Option A)", done: true },
      { label: "ADO Wiki REST API publisher", done: true },
      { label: "Azure DevOps pipeline YAML template", done: false },
      { label: "CLI entry point (commander)", done: false },
      { label: "npm package publishing", done: false },
      { label: "Change log (git-diff driven)", done: false },
      { label: "IR JSON artifact publishing", done: false },
    ]
  },
];

export default function App() {
  const [activeLayer, setActiveLayer] = useState(null);
  const [activeTab, setActiveTab] = useState("architecture");
  const [moscowFilter, setMoscowFilter] = useState(null);

  const active = layers.find(l => l.id === activeLayer);
  const totalComponents = layers.flatMap(l => l.components).length;
  const doneComponents = layers.flatMap(l => l.components).filter(c => c.done).length;
  const pct = Math.round(doneComponents / totalComponents * 100);

  const filteredComponents = active
    ? (moscowFilter ? active.components.filter(c => c.moscow === moscowFilter) : active.components)
    : [];

  return (
    <div style={{
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      background: "#080c14",
      minHeight: "100vh",
      color: "#c8d8f0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d1520; }
        ::-webkit-scrollbar-thumb { background: #2a4060; border-radius: 2px; }
        .layer-card {
          border: 1px solid #1a2540;
          background: #0d1520;
          border-radius: 4px;
          padding: 14px 18px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .layer-card:hover { border-color: var(--color); transform: translateX(3px); }
        .layer-card.active { border-color: var(--color); background: var(--bg); }
        .layer-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: var(--color);
        }
        .tag {
          display: inline-block;
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 2px;
          border: 1px solid currentColor;
          opacity: 0.6;
          margin: 2px;
          letter-spacing: 0.04em;
        }
        .comp-card {
          background: #0a1220;
          border: 1px solid #1a2540;
          border-radius: 4px;
          padding: 12px 14px;
          margin-bottom: 8px;
          transition: border-color 0.2s;
        }
        .comp-card.done { background: #0a1a12; border-color: #1a3020; }
        .comp-card:hover { border-color: #2a4060; }
        .tab-btn {
          background: none;
          border: none;
          color: #4a6a90;
          cursor: pointer;
          padding: 10px 18px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .tab-btn:hover { color: #90b0d8; }
        .tab-btn.active { color: #90b0d8; border-bottom-color: #4A90D9; }
        .decision-row {
          display: grid;
          grid-template-columns: 190px 170px 1fr;
          gap: 16px;
          padding: 11px 16px;
          border-bottom: 1px solid #0f1a2a;
          align-items: start;
        }
        .decision-row:last-child { border-bottom: none; }
        .pill {
          display: inline-block;
          font-size: 9px;
          padding: 1px 7px;
          border-radius: 2px;
          letter-spacing: 0.08em;
          font-weight: 500;
        }
        .moscow-btn {
          background: #0d1520;
          border: 1px solid #1a2540;
          border-radius: 3px;
          cursor: pointer;
          padding: 3px 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          transition: all 0.15s;
          color: #4a6a90;
        }
        .moscow-btn:hover { border-color: #4A90D9; color: #90b0d8; }
        .moscow-btn.active { color: white; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "28px 40px 0", borderBottom: "1px solid #1a2540" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            background: "#1a2540", color: "#90b0d8",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontWeight: 600, fontSize: 13, padding: "4px 12px",
            borderRadius: 3, letterSpacing: "0.05em",
            border: "1px solid #2a4060"
          }}>Lewis Ginn</div>
        </div>

        <h1 style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 26,
          fontWeight: 300,
          color: "#e0eeff",
          letterSpacing: "-0.02em",
          marginBottom: 6
        }}>
          Automated As-Built Documentation Generator
        </h1>
        <p style={{ fontSize: 12, color: "#4a6a90", maxWidth: 660, lineHeight: 1.65, marginBottom: 16 }}>
          A reusable pipeline that reads Power Platform solution artifacts directly from Git
          and produces structured, cross-linked wiki documentation in Azure DevOps and other formats.
        </p>

        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 260, height: 3, background: "#1a2540", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #4A90D9, #7B61FF)", borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 10, color: "#4a6a90", letterSpacing: "0.08em" }}>
            <span style={{ color: "#90b0d8" }}>{doneComponents}</span>/{totalComponents} components built &nbsp;·&nbsp;
            <span style={{ color: "#2ECC71" }}>Phases 1 & 2 complete · Phases 3 & 4 in progress</span>
          </span>
        </div>

        <div style={{ display: "flex", gap: 0 }}>
          {["architecture", "progress", "wiki structure", "decisions"].map(tab => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "28px 40px" }}>

        {/* ARCHITECTURE TAB */}
        {activeTab === "architecture" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <span style={{ fontSize: 9, color: "#3a5a80", letterSpacing: "0.15em", marginRight: 4 }}>FILTER BY PRIORITY:</span>
              <button className={`moscow-btn ${moscowFilter === null ? "active" : ""}`}
                style={{ borderColor: moscowFilter === null ? "#4A90D9" : undefined, background: moscowFilter === null ? "#0d1f35" : undefined, color: moscowFilter === null ? "#90b0d8" : undefined }}
                onClick={() => setMoscowFilter(null)}>ALL</button>
              {Object.entries(moscow).map(([key, val]) => (
                <button key={key}
                  className={`moscow-btn ${moscowFilter === key ? "active" : ""}`}
                  style={{ borderColor: moscowFilter === key ? val.color : undefined, background: moscowFilter === key ? val.color : undefined, color: moscowFilter === key ? "white" : undefined }}
                  onClick={() => setMoscowFilter(moscowFilter === key ? null : key)}>
                  {val.label}
                </button>
              ))}
              <span style={{ fontSize: 10, color: "#2a4060", marginLeft: 8 }}>Must · Should · Could · Won't (for now)</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "start" }}>
              <div>
                <div style={{ fontSize: 9, color: "#3a5a80", letterSpacing: "0.15em", marginBottom: 12 }}>
                  SELECT A LAYER
                </div>
                {layers.map((layer, i) => {
                  const dc = layer.components.filter(c => c.done).length;
                  const tot = layer.components.length;
                  const visibleCount = moscowFilter ? layer.components.filter(c => c.moscow === moscowFilter).length : tot;
                  return (
                    <div key={layer.id}>
                      <div
                        className={`layer-card ${activeLayer === layer.id ? "active" : ""}`}
                        style={{ "--color": layer.color, "--bg": layer.bg }}
                        onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                          <div style={{ fontSize: 10, color: layer.color, letterSpacing: "0.1em" }}>{layer.label}</div>
                          <span style={{ fontSize: 9, color: dc === tot ? "#2ECC71" : dc > 0 ? "#E8A838" : "#3a5a80" }}>
                            {dc}/{tot}{moscowFilter && visibleCount !== tot ? ` (${visibleCount} ${moscow[moscowFilter].label})` : ""}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#6080a0", lineHeight: 1.4, marginBottom: 8 }}>{layer.description}</div>
                        <div style={{ height: 2, background: "#1a2540", borderRadius: 1, overflow: "hidden" }}>
                          <div style={{ width: `${dc / tot * 100}%`, height: "100%", background: layer.color, opacity: 0.5 }} />
                        </div>
                      </div>
                      {i < layers.length - 1 && (
                        <div style={{ fontSize: 11, color: "#1e3050", textAlign: "center", margin: "2px 0 6px", letterSpacing: "0.05em" }}>↓</div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div>
                {!activeLayer && (
                  <div style={{
                    background: "#0d1520", border: "1px solid #1a2540", borderRadius: 4,
                    padding: 40, textAlign: "center", color: "#2a4060", fontSize: 12
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.4 }}>←</div>
                    Select a layer to explore its components
                  </div>
                )}
                {activeLayer && active && (
                  <div>
                    <div style={{ fontSize: 9, color: active.color, letterSpacing: "0.15em", marginBottom: 12 }}>
                      {active.label} — {filteredComponents.length} COMPONENT{filteredComponents.length !== 1 ? "S" : ""}
                      {moscowFilter && <span style={{ color: moscow[moscowFilter].color }}> · {moscow[moscowFilter].label} ONLY</span>}
                    </div>
                    {filteredComponents.length === 0 && (
                      <div style={{ background: "#0d1520", border: "1px solid #1a2540", borderRadius: 4, padding: 24, textAlign: "center", color: "#2a4060", fontSize: 11 }}>
                        No {moscow[moscowFilter]?.label} components in this layer
                      </div>
                    )}
                    {filteredComponents.map(comp => {
                      const m = moscow[comp.moscow];
                      return (
                        <div key={comp.name} className={`comp-card ${comp.done ? "done" : ""}`}>
                          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{comp.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 13, color: comp.done ? "#a0d8b0" : "#c0d8f0" }}>{comp.name}</span>
                                <span className="pill" style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}50` }}>{m.label}</span>
                                {comp.done
                                  ? <span className="pill" style={{ background: "#0a2016", color: "#2ECC71", border: "1px solid #2ECC7130" }}>BUILT</span>
                                  : <span className="pill" style={{ background: "#0a1220", color: "#3a5a80", border: "1px solid #1a2540" }}>PLANNED</span>
                                }
                              </div>
                              <div style={{ fontSize: 11, color: "#4a6a90", lineHeight: 1.55, marginBottom: 7 }}>{comp.detail}</div>
                              <div>{comp.tags.map(t => <span key={t} className="tag" style={{ color: active.color }}>{t}</span>)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PROGRESS TAB */}
        {activeTab === "progress" && (
          <div style={{ maxWidth: 880 }}>
            <div style={{ fontSize: 9, color: "#3a5a80", letterSpacing: "0.15em", marginBottom: 20 }}>BUILD PROGRESS</div>
            {progress.map(p => {
              const dc = p.items.filter(i => i.done).length;
              const tot = p.items.length;
              const statusStyle = {
                "COMPLETE":    { bg: "#0a2016", color: "#2ECC71", border: "#2ECC7130" },
                "IN PROGRESS": { bg: "#2a1800", color: "#E8A838", border: "#E8A83830" },
                "NEXT":        { bg: "#170f35", color: "#7B61FF", border: "#7B61FF30" },
                "PLANNED":     { bg: "#0d1520", color: "#4a6a90", border: "#2a4060" },
              }[p.status];
              return (
                <div key={p.phase} style={{
                  background: "#0d1520",
                  borderLeft: `3px solid ${p.color}`,
                  border: `1px solid ${p.color}25`,
                  borderRadius: 4, padding: 18, marginBottom: 14
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 10, color: p.color, letterSpacing: "0.1em" }}>{p.phase}</span>
                      <span className="pill" style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>{p.status}</span>
                    </div>
                    <span style={{ fontSize: 10, color: "#4a6a90" }}>{dc}/{tot}</span>
                  </div>
                  <div style={{ height: 2, background: "#1a2540", borderRadius: 1, overflow: "hidden", marginBottom: 14 }}>
                    <div style={{ width: `${dc / tot * 100}%`, height: "100%", background: p.color, opacity: 0.6 }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 20px" }}>
                    {p.items.map(item => (
                      <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 0", fontSize: 11 }}>
                        <span style={{ color: item.done ? "#2ECC71" : "#2a4060", fontSize: 13 }}>{item.done ? "●" : "○"}</span>
                        <span style={{ color: item.done ? "#8aaed4" : "#3a5a80" }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div style={{ background: "#0a2020", border: "1px solid #1ABC9C25", borderRadius: 4, padding: 14, fontSize: 11, color: "#1ABC9C70", lineHeight: 1.7 }}>
              💡 <strong style={{ color: "#1ABC9C" }}>Phases 1 & 2 are complete. Phases 3 & 4 are both in progress.</strong> Flows and plugins are parsing and publishing to ADO Wiki. Multi-solution config and the wiki publisher are working. Next up: web resource parser, then end-to-end Azure DevOps pipeline for demo.
            </div>
          </div>
        )}

        {/* WIKI STRUCTURE TAB */}
        {activeTab === "wiki structure" && (
          <div style={{ maxWidth: 820 }}>
            <div style={{ fontSize: 9, color: "#3a5a80", letterSpacing: "0.15em", marginBottom: 20 }}>ADO WIKI PAGE HIERARCHY</div>
            <div style={{ background: "#0d1520", border: "1px solid #1a2540", borderRadius: 4, padding: 24, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#4a6a90", marginBottom: 18, lineHeight: 1.6 }}>
                Each solution gets its own top-level wiki section. Pages are generated from the IR layer and cross-linked automatically.
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
                {[
                  { indent: 0, text: "📁 [Solution Name]", color: "#4A90D9", done: true },
                  { indent: 1, text: "🏠 Overview", color: "#8aaed4", done: true },
                  { indent: 1, text: "📁 Data Model", color: "#8aaed4", done: true },
                  { indent: 2, text: "📊 Entity Relationship Diagram", color: "#6080a0", done: false },
                  { indent: 2, text: "📋 [Table Name] × N", color: "#8aaed4", done: true },
                  { indent: 1, text: "📁 Automation", color: "#8aaed4", done: true },
                  { indent: 2, text: "🔄 Power Automate Flows", color: "#8aaed4", done: true },
                  { indent: 2, text: "⚙️ Classic Workflows", color: "#6080a0", done: false },
                  { indent: 1, text: "📁 Custom Code", color: "#8aaed4", done: true },
                  { indent: 2, text: "🔌 Plugin Assemblies", color: "#8aaed4", done: true },
                  { indent: 2, text: "📜 Web Resources (JS)", color: "#6080a0", done: false },
                  { indent: 2, text: "🧩 PCF Controls", color: "#6080a0", done: false },
                  { indent: 1, text: "📁 Security", color: "#6080a0", done: false },
                  { indent: 2, text: "🛡️ Security Roles", color: "#6080a0", done: false },
                  { indent: 1, text: "📁 Integrations", color: "#6080a0", done: false },
                  { indent: 2, text: "🔗 Connection References", color: "#6080a0", done: false },
                  { indent: 2, text: "🌍 Environment Variables", color: "#6080a0", done: false },
                  { indent: 1, text: "📝 Change Log", color: "#2ECC71", done: false },
                ].map((item, i) => (
                  <div key={i} style={{
                    paddingLeft: item.indent * 20,
                    paddingTop: 5, paddingBottom: 5,
                    color: item.done ? item.color : "#2a4060",
                    borderLeft: item.indent > 0 ? "1px solid #1a2540" : "none",
                    marginLeft: item.indent > 0 ? (item.indent - 1) * 20 + 10 : 0,
                    display: "flex", alignItems: "center", gap: 10
                  }}>
                    <span>{item.text}</span>
                    {item.done && <span className="pill" style={{ background: "#0a2016", color: "#2ECC71", border: "1px solid #2ECC7125" }}>BUILT</span>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 9, color: "#3a5a80", letterSpacing: "0.15em", marginBottom: 12 }}>PAGES BUILT SO FAR</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {pages.map(page => {
                const m = moscow[page.moscow];
                return (
                  <div key={page.name} className={`comp-card ${page.done ? "done" : ""}`}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{page.emoji}</span>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: page.done ? "#a0d8b0" : "#c0d8f0" }}>{page.name}</span>
                          <span className="pill" style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}50` }}>{m.label}</span>
                          {page.done && <span className="pill" style={{ background: "#0a2016", color: "#2ECC71", border: "1px solid #2ECC7125" }}>BUILT</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#4a6a90", lineHeight: 1.5 }}>{page.desc}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DECISIONS TAB */}
        {activeTab === "decisions" && (
          <div style={{ maxWidth: 900 }}>
            <div style={{ fontSize: 9, color: "#3a5a80", letterSpacing: "0.15em", marginBottom: 20 }}>KEY ARCHITECTURAL DECISIONS — CONFIRMED IN BUILD</div>
            <div style={{ background: "#0d1520", border: "1px solid #1a2540", borderRadius: 4, overflow: "hidden", marginBottom: 20 }}>
              <div style={{
                display: "grid", gridTemplateColumns: "190px 170px 1fr",
                gap: 16, padding: "10px 16px",
                borderBottom: "1px solid #1a2540", background: "#0a1220"
              }}>
                {["Decision", "Choice", "Rationale"].map(h => (
                  <div key={h} style={{ fontSize: 9, color: "#3a5a80", letterSpacing: "0.15em" }}>{h}</div>
                ))}
              </div>
              {decisions.map(d => (
                <div key={d.q} className="decision-row">
                  <div style={{ fontSize: 11, color: "#6a8aaa" }}>{d.q}</div>
                  <div style={{ fontSize: 11, color: "#7B61FF", fontWeight: 500 }}>{d.a}</div>
                  <div style={{ fontSize: 11, color: "#4a6a90", lineHeight: 1.6 }}>{d.reason}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#0a2020", border: "1px solid #1ABC9C25", borderRadius: 4, padding: 14, fontSize: 11, color: "#1ABC9C70", lineHeight: 1.7 }}>
              💡 <strong style={{ color: "#1ABC9C" }}>These decisions are locked in.</strong> They represent deliberate tradeoffs made during the build — not preferences, not defaults. Changing any of them would have cascading effects across the architecture.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
