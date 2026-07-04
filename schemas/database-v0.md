# Atlas Database Direction v0.1

## Core Entity Groups

### Company

- company
- company_identifier
- company_listing
- company_segment
- company_product
- company_management
- company_competitor

### Industry

- industry
- industry_sector
- industry_value_chain
- industry_metric

### Research

- research_note
- research_report
- research_evidence
- research_version
- research_hypothesis
- decision_journal

### Financial

- financial_statement
- financial_metric
- valuation_metric
- estimate
- guidance

### Scoring

- score_model
- score_factor
- company_score
- score_history
- score_evidence

### Intelligence

- news_item
- transcript
- filing
- source_document
- alert
- watchlist

### Knowledge Graph

- entity
- relationship
- relationship_evidence

## Database Principles

- Every important value needs source metadata.
- Scores must be versioned.
- Research reports must be reproducible.
- Manual overrides must be logged.
- Avoid deleting historical research.
