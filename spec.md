# Expense Tracker — Product Specification

## Overview

A REST API for tracking team expenses with approval workflows. Employees submit expenses, managers approve or reject them, and the system enforces budget limits per category.

## Tech Stack

Build with the stack you're most comfortable with:
- **Java:** Spring Boot 3 + Maven
- **Node.js:** Express
- **Python:** Flask

Use in-memory storage (no database). The app should start with seed data.

## Data Model

### Expense
| Field | Type | Description |
|-------|------|-------------|
| id | int | Auto-generated |
| description | string | What the expense is for |
| amount | number | Dollar amount (positive, max 2 decimal places) |
| category | enum | One of: travel, meals, software, equipment, other |
| submittedBy | string | Employee name |
| status | enum | pending, approved, rejected |
| submittedAt | datetime | When the expense was created |
| reviewedBy | string | nullable — Manager who approved/rejected |

### Category Budget
| Category | Monthly Limit |
|----------|--------------|
| travel | $5,000 |
| meals | $2,000 |
| software | $10,000 |
| equipment | $15,000 |
| other | $3,000 |

## API Endpoints

### Expenses

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/expenses | List all expenses. Supports query params: `status` (filter by status), `category` (filter by category) |
| GET | /api/expenses/:id | Get a single expense |
| POST | /api/expenses | Submit a new expense (status defaults to "pending") |
| PATCH | /api/expenses/:id/approve | Approve a pending expense. Requires `reviewedBy` in body |
| PATCH | /api/expenses/:id/reject | Reject a pending expense. Requires `reviewedBy` in body |

### Reports

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/reports/summary | Return total spent (approved only) per category, plus remaining budget |

## Business Rules

1. **Only pending expenses can be approved or rejected.** Attempting to approve/reject an already-reviewed expense returns 409 Conflict.
2. **Approving an expense that would exceed the category budget returns 400** with a message indicating the budget limit and current spend.
3. **Amount must be positive** and have at most 2 decimal places.
4. **Description is required** and must be at least 3 characters.
5. **Category must be valid** — reject unknown categories with 400.
6. **submittedBy is required** for creating expenses.

## Seed Data

Start with these expenses pre-loaded:

| id | description | amount | category | submittedBy | status |
|----|-------------|--------|----------|-------------|--------|
| 1 | Flight to NYC conference | 450.00 | travel | Alice | approved |
| 2 | Team lunch Friday | 85.50 | meals | Bob | approved |
| 3 | IDE license renewal | 299.99 | software | Alice | pending |
| 4 | Standing desk | 650.00 | equipment | Charlie | pending |
| 5 | Taxi to client site | 42.00 | travel | Bob | rejected |

## Validation Response Format

Error responses should use this structure:

```json
{
  "error": "Description of what went wrong"
}
```

For validation with multiple issues:

```json
{
  "errors": ["field1 is required", "amount must be positive"]
}
```

## Summary Report Format

The `/api/reports/summary` endpoint returns:

```json
{
  "categories": [
    {
      "category": "travel",
      "spent": 450.00,
      "budget": 5000,
      "remaining": 4550.00
    }
  ],
  "totalSpent": 535.50,
  "totalBudget": 35000
}
```

Only **approved** expenses count toward spend. Pending and rejected expenses are excluded.
