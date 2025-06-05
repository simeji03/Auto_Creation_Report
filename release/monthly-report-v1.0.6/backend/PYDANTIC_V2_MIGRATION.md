# Pydantic v2 and SQLAlchemy 2.0 Migration Summary

## Changes Made

### 1. schemas.py - Pydantic v2 Updates
- **Import changes**: Added `field_validator` and `ConfigDict`
- **Config class**: Changed from `class Config:` to `model_config = ConfigDict(from_attributes=True)`
- **Field regex**: Changed `regex=` parameter to `pattern=`
- **Validators**: Changed `@validator` to `@field_validator` with `@classmethod`
- **Validator signature**: Changed from `(cls, v, values)` to `(cls, v, info)` and use `info.data` instead of `values`
- **Added compatibility aliases**: `UserLogin`, `UserResponse`, `MonthlyReportResponse`, etc.

### 2. database.py - SQLAlchemy 2.0 Updates
- **Import changes**: Moved `declarative_base` from `sqlalchemy.ext.declarative` to `sqlalchemy.orm`
- **datetime.utcnow**: Changed to `datetime.now(timezone.utc)` with lambda functions for column defaults

### 3. auth.py Updates
- **datetime.utcnow**: Changed to `datetime.now(timezone.utc)` for timezone-aware datetime

### 4. routers/reports.py Updates
- **Pydantic methods**: Changed `.dict()` to `.model_dump()`
- **Project handling**: Added checks for optional attributes and adjusted Project model usage

### 5. Requirements
- Already has Pydantic v2 (2.10.5) and SQLAlchemy 2.0 (2.0.31)

## Breaking Changes Fixed
1. Pydantic v2 no longer uses `orm_mode`, replaced with `from_attributes`
2. Field validation regex parameter renamed to pattern
3. Validator decorator and signature changes
4. Model methods renamed (.dict() → .model_dump(), .json() → .model_dump_json())
5. SQLAlchemy import path changes

## Notes
- The Project model in the database has a user_id foreign key, but the reports router was trying to use report_id. This has been temporarily patched with conditional checks.
- Some schema classes were referenced but not defined (UserLogin, UserResponse, etc.), so aliases were added for compatibility.