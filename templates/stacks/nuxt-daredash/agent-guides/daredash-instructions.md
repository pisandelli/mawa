# DareDash instruction resolution

When DareDash is selected, its instructions are authoritative for its public API and
component conventions. Resolve them in this order:

1. the installed package `AGENTS.md`, when present;
2. the installed package `SKILL.md`, when the current agent runtime supports skills;
3. the installed package `llms.txt`, or the recorded official remote source when no
   installed copy is available.

MAWA global rules still govern gates, audit, security, and project workflow. DareDash
instructions govern DareDash usage only. Never invent component APIs, import internal
package paths, or silently override a library rule. Record the resolved instruction
source and package version in the setup evidence.
