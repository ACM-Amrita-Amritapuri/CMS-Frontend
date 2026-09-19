# Admin Dashboard Plan — Super Admin Workspace

Purpose: Make the admin workspace clearly useful for a super admin, not an empty card gallery.

What super admin can do (from backend routes):
- Manage accounts: create, reset passwords, deactivate/reactivate (`/auth/users`, `/auth/users/{id}/reset-password`)
- Manage roles: assign/revoke any role globally or per SIG (`/auth/users/{id}/roles`)
- Manage SIGs: create, edit, deactivate (`/admin/sigs`)
- Manage members: filter by active/inactive, view role assignments (`/admin/members`)
- Manage events/meetings: publish, cancel, view calendar (`/operations/*`)

Dashboard improvement plan:
- Header with shield/admin icon: "Super Admin Workspace — Full club control"
- Description: what the super admin can operate (accounts, roles, SIGs, events)
- Four action cards linking directly to Members / SIGs / Accounts / Operations
- Summary tiles (users, SIGs, profiles) presented clearly with context
- Role distribution shown for visibility
- No empty hero or decorative blobs; dense, operational, useful
