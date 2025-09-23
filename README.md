# Valpro CRM – Documents Feature (MVP)

This README documents the Documents feature end-to-end, covering upload, listing, preview, and download.

## Storage Strategy
- Files are saved under `storage/documents/<key>`.
- Each Document stores the file `key` in `DocumentVersion.fileUrl`.
- Task attachments also use the same private storage.
- The download route resolves and streams files; public `public/uploads/...` and remote URLs are also supported for backward compatibility.

## API Routes
- `POST /api/documents` – upload a document (FormData: file, title, description?, visibility?, tags?)
- `GET /api/documents` – list documents with filters: `visibility`, `mine`, `shared`, `folderId`, `tag`
- `GET /api/documents/:id` – metadata (auth required)
- `HEAD /api/documents/:id/download` – preflight check (auth + file exists)
- `GET /api/documents/:id/download?inline=1` – stream/preview or download

Auth is required. Access control: Admin, owner, public visibility, or ACL rules.

## Frontend Usage
- Admin: `src/app/admin/documents/page.tsx`
- Employee: `src/app/employee/documents/page.tsx`
- Both pages support: search, grid/list, preview, download, upload (Employee uploads via `/api/documents`).
- Dark mode supported (matching existing palette) and responsive for mobile.

## Troubleshooting
- 401/403: ensure you are logged in and have access (ADMIN/owner/ACL/public).
- 404 File missing: file key not found on disk. Verify it exists in `storage/documents/<key>`.
- Preview fails: some browsers block popups; preflight uses `HEAD` first.

## Development
- Local storage directory is created automatically: `storage/documents`.
- Max upload size: 20MB; Allowed types: PDF, DOCX, XLSX, PPTX, images, CSV, TXT.
- For external storage (S3, etc.), adapt the download route to fetch and stream the object; current code redirects if `fileUrl` is an `http(s)` URL.

## Roadmap
- Optional: S3 adapter; Signed URLs; Version diff UI; Folder management UI.
