# ADR 001: Obsidian Vault Architecture for Financial Knowledge Graph

## Status: Accepted

## Context
The platform requires a persistent, human-readable, and version-controllable data store for global sovereign metadata, central bank policies, payment rails, and currency cross-rates that functions offline and integrates cleanly with analytical tools.

## Decision
We adopted the Obsidian Markdown Vault architecture with automated background daemon ingestion:
- **Human-Readable & Editable**: Plain Markdown with YAML frontmatter.
- **Bi-directional Knowledge Graph**: Wikilinks `[[Link]]` forming an explicit institutional topology.
- **Git-Native Version Control**: Zero proprietary database lock-in; diffable on GitHub.
- **Dataview Interoperability**: Compatible with desktop Obsidian research workflows.

## Consequences
- **Positive**: Complete data ownership, offline accessibility, git versioning.
- **Negative**: Requires filesystem synchronization and managed file write mutexes to prevent write tearing.

## Alternatives Considered
1. PostgreSQL + GraphQL API (High hosting footprint for static sovereign data)
2. MongoDB JSON Store (Lacks native human-readable hyperlinked note interface)
