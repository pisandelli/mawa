# MAWA Config Schema

MAWA stores project workflow decisions in `.mawa-config.yaml` (plain YAML at the project root).

This file is the workflow manifest. A filled, copy-ready example lives at
`resources/templates/mawa-config.example.yaml`.

```yaml
mawa:
  project_name: ""
  human_language: "pt-BR"
  artifact_language: "en"
  interaction_mode: "interactive" # interactive | continuous
  execution_mode: "ide" # ide | web

state:
  current_stage: "00-project-init" # next pending Stage ID; see workflow/orchestration.md
  completed_stages: [] # e.g. ["00-project-init", "01-project-briefing"]
  active_module: null # object during module stages; null outside module work
  # Example during module work:
  # active_module:
  #   name: "billing"
  #   implementation_path: null # 06 | 06a | null
  #   design_handoff: null # used | skipped | null

core:
  framework: "nuxt4"
  package_manager: "pnpm"
  state_management: "pinia"
  template_language: "pug" # pug | html

ui:
  adapter: "daredash"
  docs:
    # Adapter operational docs are loaded from source_url when required.
    # Cache is session-scoped only; if docs are not available in the current session,
    # fetch them again or ask the human to provide them in web mode.
    source_url: "https://raw.githubusercontent.com/pisandelli/daredash/main/llms.txt"
    load_from: "url" # fetch/load from source_url when required
    cache: "session" # reuse only while available in the current session
    required: true
  config:
    prefix: "dd"
    debug: false
    tokens_path: null
  setup_status: "pending" # pending | confirmed | skipped

design:
  enabled: true # false skips the design phase; the agent structures UI from spec + adapter docs
  adapter: "pencil"
  mcp_required: true
  mcp_status: "unknown" # preconfigured | missing | unknown — default unknown; do not assume preconfigured
  handoff_required: true
  setup_status: "pending" # pending | confirmed | skipped

paths:
  raw_briefing: "inputs/raw-briefing.md"
  project_briefing: "specs/briefing/project-briefing.md"
  discovery_spec: "specs/discovery/discovery.spec.md"
  domain_map: "specs/domain/domain-map.md"
  module_specs: "specs/modules"
  approved_layouts: "specs/layouts"
  reviews: "specs/reviews"
```

## Rules

- `core.framework` is fixed as `nuxt4`.
- `paths.raw_briefing` points to the seed artifact.
- `paths.project_briefing` is generated from the Raw Briefing.
- UI and design adapters may vary.
- Setup status must be confirmed by the human in interactive mode.
- `state.current_stage` is the next pending stage, not a history label.
- Design signals have a clear precedence (do not conflate them):
  - `design.enabled` — global capability: is the design phase available at all.
  - `design.setup_status` / `design.mcp_status` — readiness of the design tooling.
  - `state.active_module.design_handoff` — the actual per-module outcome (`used` / `skipped`), and the source of truth for what happened to a given module.
- `design.enabled = false` skips Stage 05a; implementation runs through Stage 06.
