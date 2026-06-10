# DareDash Design Handoff Rules

When implementing an approved layout with DareDash:

- Map design regions to DareDash layout primitives first.
- Preserve region order, hierarchy, copy, and interaction affordances.
- Do not add badges, helper text, cards, or actions not present in the approved layout or required by the module spec.
- Validate every chosen component against the DareDash operational docs from `ui.docs.source_url`.
- Prefer tokens and supported attrs before custom CSS.
- Document any visual mismatch that cannot be represented with public DareDash APIs.
