# Setup Summary

This file is now a short pointer to avoid duplicated setup instructions.

## Canonical Setup Guide

Use README.md as the source of truth for:

- Windows and macOS SQL Server installation
- environment configuration (`sample.env.local` -> `.env.local`)
- database script order (`01` -> `02` -> `03` -> `04`)
- local run, validation, and contribution workflow

## Quick Links

- `README.md`
- `DATABASE_SETUP.md`
- `MAC_SETUP_GUIDE.md`
- `SQL_SERVER_QUICK_REFERENCE.md`
- `DATABASE_ARCHITECTURE.md`

## Current Database Setup Assets

- `scripts/01-create-database.sql`
- `scripts/02-seed-data.sql`
- `scripts/03-seed-catalog.sql`
- `scripts/04-seed-course-content.sql`
- `setup-db.ps1` (Windows helper; runs first two scripts)

## Note

If you update setup steps, update README.md first and keep this file as a pointer-only summary.
