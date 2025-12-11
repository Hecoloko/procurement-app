# Product Requirements Document (PRD)

## Project Overview
A comprehensive Accounts Payable (AP) and Accounts Receivable (AR) system integrations for the Procurement App.

## Goals
1.  **AP**: Vendor invoice 3-way matching, approvals, and ledger.
2.  **AR**: Automated billable item creation from AP, invoice generation, and deep Stripe integration.
3.  **Stripe**: Webhooks, Invoices, and Payment Records.

## Functional Requirements (FRs)

### 1. Accounts Payable (Money Out)
- **Vendor Invoices**: Create, view, and manage vendor invoices.
- **3-Way Match**: Link Invoice Items to Purchase Order Items. Validate quantity and price.
- **Approvals**: Audit trail and status workflow (Draft -> Pending -> Approved).

### 2. Accounts Receivable (Money In)
- **Billable Items**: Auto-create billable items from approved AP invoices (if billable).
- **Invoicing**: Select billable items to generate Customer Invoices.
- **Payments**: Integrate Stripe for payment processing and status updates.

## Non-Functional Requirements (NFRs)
- **Security**: Row Level Security (RLS) on all new tables.
- **Performance**: Efficient queries for ledger and list views.
- **Reliability**: Webhook processing must be idempotent.

## Feature List (Epics)
- **Epic-1**: Database Schema & Core Tables (Completed)
- **Epic-2**: Frontend AP & AR Dashboards (Completed)
- **Epic-3**: Stripe Integration Deep-Dive (Next)
- **Epic-4**: Validation & QA
