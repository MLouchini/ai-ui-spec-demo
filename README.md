# Agent-UI Semantic Action Layer Demo

## Problem

Current agentic browsers simulate human interaction: they scrape pixels, synthesize clicks, and hope the DOM structure remains stable. This approach is **brittle** (breaks on minor UI changes), **slow** (requires full page rendering), and **opaque** (humans can't understand why agents made specific decisions).

## Solution Concept

A lightweight semantic layer that websites can expose alongside their normal UI:

- **Actions** — Declarative intent surfaces (e.g., `search_flights`, `submit_payment`)
- **Slots** — Machine-readable inputs/outputs with type information
- **Constraints** — Domain-level validation rules (regex, ranges, enums)
- **Goals** — Articulated success criteria
- **State Models** — Key domain objects and their lifecycle transitions
- **Explainable Execution Flows** — Traces that record why and when each action occurred

AI agents consume this manifest; humans continue using the normal UI. This dual-layer model provides stability, speed, and transparency.

## Dual-Layer Architecture

```
        +---------------------------+
        |   Human UI (HTML/DOM)     |
        |  visible to the user      |
        +-------------+-------------+
                      ↑
                DOM bindings
                      ↑
        +-------------+-------------+
        |   AI-UI Semantic Layer    |
        |  actions / slots / state  |
        |  manifest / traces        |
        +-------------+-------------+
                      ↑
                 AI Agent
```

## What This Repo Contains

- **`spec/action.schema.json`** — JSON Schema defining the structure of a semantic action manifest
- **`spec/trace.schema.json`** — Schema for execution traces with example
- **`spec/ai-ui.example.json`** — Complete manifest example describing a flight search action
- **`demo/index.html`** — Static HTML page with a flight search form and agent reasoning panel
- **`demo/demo.js`** — Vanilla JavaScript demonstrating goal-driven execution through semantic actions
- **`LICENSE`** — Apache-2.0 license

## How to Use

1. Open `demo/index.html` in any modern browser (no server required).
2. Click the **"Simulate Agent"** button.
3. Watch the agent reasoning panel as it:
   - Receives a goal: "Find a flight from SFO to JFK under $400"
   - Reads the semantic manifest (not scraping DOM)
   - Finds the matching `search_flights` action
   - Maps goal parameters to semantic action inputs
   - Validates constraints at the semantic level
   - Fills the form fields (UI can change; semantic action stays stable)
4. The execution trace shows the complete goal-driven flow with explainability.

## Internal Rationale

### Why Actions Matter

Actions provide stable, semantic identifiers (`id`, `title`, `description`) with structured inputs and outputs. Instead of heuristically searching for "that submit button," agents can reason at the intent level: "I need to execute `search_flights` with these slot values." The demo shows an agent receiving a goal, finding the matching semantic action, and executing it—all without touching DOM structure directly.

### Why Dry-Run vs Execute Distinction Exists

The `executionPolicy.dry_run_default` flag allows agents to:
- **Simulate** actions without side effects
- **Collect context** before committing
- **Plan** multi-step workflows safely

This separation enables safer exploration and better error recovery.

### Why State Models Matter

State models (e.g., `booking { id, status }`) let agents synchronize with business concepts rather than scraping UI for state. Agents can query: "What bookings are in `draft` status?" without parsing DOM classes or text.

### Why Explainable Traces Matter

Traces capture `traceId`, `goal`, `goalId`, `actionId`, `steps`, and `provenance`. This creates auditable logs that:
- Show **why** an agent took an action (which goal it was pursuing)
- Record **when** each step occurred
- Enable **replay** and debugging
- Provide **transparency** for human review
- Demonstrate goal-driven execution flow from intent to completion

## License

Apache-2.0 (see `LICENSE` file).

#

