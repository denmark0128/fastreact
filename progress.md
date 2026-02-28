# HR Management System Progress

## Setup
- [x] Backend scaffolded with FastAPI modular structure
- [x] Frontend scaffolded with Vite React TypeScript and Bun
- [x] Root `.gitignore` added
- [x] Backend and frontend `.env` templates added

## Backend Modules
- [x] Auth module (JWT login/logout/me, register, role checks)
- [x] Employees module (CRUD with role-based permissions)
- [ ] Leave module
- [ ] Payroll module
- [ ] Recruitment module
- [ ] Performance module
- [ ] Settings module

## Frontend Modules
- [x] Auth module (login page + auth context + protected routes)
- [x] Employees module (list/create/update/delete UI)
- [x] Profile module UI polish (card-style profile summary + edit layout)
- [ ] Leave module
- [ ] Payroll module
- [ ] Recruitment module
- [ ] Performance module
- [ ] Dashboard enrichment
- [x] Settings profile UI polish (card-based company profile presentation)

## Quality
- [x] Frontend build passes (`bun run build`)
- [x] Backend syntax compile passes (`python -m compileall backend/app`)
- [x] Backend API tests added (`pytest`)

## Next
1. Implement Leave backend (models, schemas, service, router)
2. Implement Leave frontend (API, hooks, pages/components)
3. Add migration scripts for stable DB schema management

## Recent Updates (2026-02-27)
- Refactored frontend `My Profile` page into a cleaner card layout with:
	- dedicated profile summary card (avatar, name, email, role)
	- separate edit card for full name and profile image upload
	- improved spacing and alignment for a more production-ready look
- Refactored frontend `Settings` company profile display into card-style detail blocks with improved hierarchy.
- Kept existing profile/logo image preview modal behavior and update API integration unchanged.
- Extended user profile data model and API to support: `contact_number`, `street`, `city`, and `region`.
- Added SQLite schema compatibility updates so existing databases auto-add the new user profile columns.
- Updated profile UI behavior:
	- fields are read-only by default and enabled via `Edit Profile` button
	- `Cancel` returns form to current saved values
	- profile image drag/drop area is now more rectangular
	- profile image can be removed directly from the upload component
- Refactored employee detail page into card-based sections with:
	- profile card (employee code, status, employment type, rate)
	- department card (department and position)
	- full-week schedule map card (Mon-Sun visual schedule tiles)
- Refactored department detail page into card-based overview and team member cards.
- Extended employee API responses to include linked user profile contact/address fields.
- Updated employee detail page to display contact number and full address in the profile card.
- Updated dashboard to show unavailable/day-off employees for today based on employment status and weekly schedule.
- Expanded employee seed data with more Filipino names and increased baseline records.
- Updated seeded compensation amounts to Philippine peso-aligned monthly/daily rates.
- Replaced table row action buttons with compact shadcn-style dropdown actions for Employees and Departments pages.
- Fixed table action dropdown page-shift issue by using non-modal dropdown behavior (prevents scrollbar lock/jump).
- Updated Employees action trigger icon to square-pen style for clearer edit affordance.
- Added Department edit support (backend update endpoint + frontend update action/modal).
- Added Change Password capability (backend auth endpoint + frontend profile password form).
- Fixed `401` issue on authenticated endpoints by allowing backend auth to resolve token from either Bearer header or `access_token` cookie.
- Aligned Company Profile with Personal Profile structure and UX (summary + editable card with edit/cancel flow).
- Added company contact/address fields (`contact_number`, `street`, `city`, `region`) across backend model/schema, frontend types, and settings form.
- Expanded seeded employees further with mixed scheduling/status scenarios:
	- weekday offs (including weekday `Off` via null schedule entries)
	- WFH schedules (`WFH` in selected workdays)
	- leave statuses (`sick_leave`, `vacation_leave`)
- Updated employee status badge colors for readability and compact leave labels:
	- `VL` now uses info color
	- `SL` now uses danger color
- Aligned Departments page card top spacing with Employees page so search bars have consistent top padding.
- Made team member rows in Department Details fully clickable (including keyboard Enter/Space) to open employee profiles.
- Made the Department Overview `Head` value clickable to open the head employee profile when assigned.
- Added employee personal details fields end-to-end: `birth_date`, `civil_status`, `emergency_contact_name`, `emergency_contact_number`.
- Updated employee create/update forms and employee detail page to capture/display these personal details.
- Grouped form fields into labeled sections for readability:
	- Employee form: Basic Information, Personal Details, Employment Details, Compensation
	- Department form: Department Information, Assignment
- Reduced Employee form vertical height by converting grouped sections into a compact two-column section layout with tighter spacing.
- Separated Employee form into tabbed sections (`Basic`, `Personal`, `Employment`, `Compensation`) for easier step-by-step editing.
- Replaced Employee `Birth Date` input with shadcn-style date picker.
- Added editable weekly schedule section in Employee form with per-day inputs and quick Off/default toggles.
- Changed Employee form `Department` field to dropdown sourced from departments.
- Changed Department form `Department Head` field to employee dropdown (name + code options).
- Moved profile/company edit actions into card headers with top-right Edit/Cancel buttons.
- Updated Employee `Birth Date` picker to shadcn dropdown-style month/year selector for faster year selection.
- Aligned Employee birth date picker behavior with provided DatePickerSimple pattern (dropdown caption + close-on-select) adapted for React Vite imports/components.
- Fixed calendar dropdown UI duplication by hiding caption label/navigation in dropdown mode to remove repeated month/year text and floating arrows.
- Added top-right Edit/Cancel buttons on Profile Summary and Company Summary cards for consistent per-card editing controls.
- Removed top-right Edit/Cancel button from Profile Summary card per UX preference; kept edit controls on editable form cards.
- Implemented full payroll backend module with cutoff processing, late/undertime/overtime computation, allowances/deductions, and persisted payroll records.
- Added payroll endpoints: `POST /api/v1/payroll/process`, `GET /api/v1/payroll/records`, and `GET /api/v1/payroll/summary` with role-aware access.
- Replaced Payroll frontend placeholder with cutoff form, optional per-employee adjustments, summary cards, and processed records table.
- Added payroll frontend API/hooks/types and backend test coverage (`backend/tests/test_payroll.py`).
- Validation: backend tests passed (`10 passed`), frontend build passed (`bun run build`).
- Added attendance ingestion backend for biometric devices with API-key auth: `POST /api/v1/leave/attendance/punches/ingest`.
- Added employee biometric mapping (`employees.biometric_id`) for resolving biometric punches to employees.
- Added attendance computation service that summarizes scheduled/actual/late/undertime/overtime from ingested punches per cutoff.
- Integrated payroll processing to use attendance summaries by default (manual adjustments still supported as overrides).
- Added attendance tests (`backend/tests/test_attendance.py`) covering ingest deduplication, auth, and payroll attendance integration.
- Validation: backend tests passed (`12 passed`), frontend build passed (`bun run build`).
- Added persisted Admin Settings in backend (`admin_settings`) for policy, permission, and default controls.
- Added Admin Settings endpoints: `GET /api/v1/settings/admin` (admin/hr read) and `PUT /api/v1/settings/admin` (admin only).
- Added Admin Settings UI section in Settings page with grouped cards for Policies, Permissions, and Defaults (admin editable, HR read-only).
- Added frontend admin settings API/hooks/types integration and backend test coverage for admin settings management.
- Validation: backend tests passed (`13 passed`), frontend build passed (`bun run build`).
- Refactored Admin Settings edit flow to open grouped settings form in a modal (card now shows read-only summary with top-right Edit button).
- Reverted Admin Settings edit back to inline non-modal form due to form length preference.
- Updated Employee form schedule defaults (`Set Default`) to use global Admin Settings (`default_shift_start`, `default_shift_end`, `default_work_days`) with safe fallback values.
- Fixed Employee create-form schedule initialization to actively sync with global default schedule template.
- Updated schedule input placeholders to display per-day global defaults (e.g., `Default: 08:30-17:30` or `Default: Off`).
- Added backend audit trail module with persisted `audit_logs` records and secured listing endpoint: `GET /api/v1/audit/logs` (admin/hr).
- Added audit logging for key write actions across auth, employees, settings, payroll processing, and biometric attendance ingestion.
- Added backend audit tests (`backend/tests/test_audit.py`) for log creation, filtering, and role-based access control.
- Split frontend settings into dedicated pages:
	- `Settings` for Company Profile only
	- `Admin Settings` for policy/permission/default controls
	- `Audit Trail` for viewing audit logs with action/entity filters
- Added frontend routes for `settings/admin` and `settings/audit-trail`, and separate sidebar entries for admin/hr users.
- Updated status display UX consistency:
	- Dashboard unavailable list now shows specific leave/status reason (`SL`/`VL`/etc.) instead of generic `Unavailable`.
	- Employee Details status badge now shows human-readable labels (e.g., `Sick Leave`) instead of raw underscored values (`SICK_LEAVE`).

## Recent Updates (2026-02-28)
- Initialized official shadcn CLI setup for frontend (`components.json`, aliases, theme tokens) to support `bunx --bun shadcn@latest add ...` workflow.
- Added and integrated shadcn components: `sonner`, `sidebar`, `dialog`, `avatar`, `collapsible`, `textarea`, and date-picker support pieces.
- Replaced custom notification card with shadcn Sonner toast integration while preserving existing `showNotification` context API.
- Replaced custom sidebar layout with shadcn sidebar primitives and added a dedicated `AppSidebar` composition.
- Restored all expected navigation entries in sidebar:
	- Departments
	- Admin Settings
	- Audit Trail (role-aware for admin/hr)
- Fixed sidebar collapsed-mode text clipping by switching to icon-first rows and controlled label hiding.
- Added smooth label transition on sidebar collapse/expand (opacity/transform/width transition) without reintroducing clipping.
- Replaced custom modal internals with shadcn Dialog primitives while preserving existing `Modal` component API usage across pages.
- Standardized select/dropdown behavior to shadcn/radix-based implementation compatible with existing app form usage.
- Fixed layout stability issues:
	- removed `scrollbar-gutter: stable` reservation mismatch
	- enforced consistent vertical scrollbar lane with `overflow-y: scroll`
	- removed sidebar width tween transitions that caused skipped text during resize.
- Validation: frontend build passes (`bun run build`).
- Tuned sidebar interaction/animation UX:
	- increased collapse/expand timing for smoother transitions
	- removed fade-in/out behavior for sidebar labels/icons per preference
	- fixed temporary wrapped label glitch (`Main Navigation`) during expand by enforcing no-wrap label transitions.
- Fixed collapsed-sidebar navigation behavior so primary menu items remain clickable in icon-only state.
- Performed dark-mode consistency fixes across layout and tokens:
	- switched app shell/header/background usage to theme tokens (`bg-background`, `text-foreground`, `border-border`)
	- aligned sidebar border/accent tokens to match main dark palette
	- added global dark-mode compatibility overrides for legacy `slate-*`/`bg-white` utility classes to prevent white cards and mismatched text in dark mode.
- Updated profile summary cards to theme tokens (`bg-muted`, `border-border`, `text-foreground`, `text-muted-foreground`) to remove white tiles in dark mode.
- Updated dark primary token so default buttons are no longer white blocks in dark mode.
- Validation: frontend build passes after each theming/UX update (`bun run build`).
