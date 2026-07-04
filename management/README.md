# Atlas Management Operating System

This directory is the management layer for Atlas.

Atlas is not managed only by chat. GitHub is the source of truth for:

- Vision
- Roadmap
- Programs
- Epics
- Architecture decisions
- Reviews
- Engineering reports
- Product direction

## Operating Model

```text
Vision
  -> Roadmap
    -> Program
      -> Epic
        -> PR
          -> Review
            -> Merge
```

## Core Directories

- `roadmap/` — long-term and annual roadmap.
- `programs/` — major engineering programs.
- `reviews/` — CTO reviews and milestone retrospectives.
- `reports/` — daily / weekly engineering reports.
- `playbooks/` — repeatable operating procedures.

## Principle

If it matters, write it down. If it guides the future, put it in the repository.
