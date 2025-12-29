# House Inspection System 🏠

A complete backend API for managing multi-tenant house inspections with role-based access and image uploads.

## Features
- **Multi-tenancy**: Admin → Organizations → Users
- **Three login types**:
  - Users & Admin: `/v1/auth/login`
  - Organization as entity: `/v1/org/api/signin`
- **Role-based access**: admin, org-admin, user
- **Rich inspections**: 2 rooms + kitchen with condition ratings
- **Image uploads**:
  - Organization logo
  - Multiple photos per inspection parameter (floor, wall, switch, window, door, stove)
- **Local file storage** for images (served via `/uploads`)
- **Secure**: JWT auth, password hashing, scoped data access
- **Clean v1 API structure**

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT for authentication
- Multer for file uploads

## Quick Start
```bash
git clone https://github.com/furqansautomation/house-inspection-system.git
cd house-inspection-system
npm install
npm run dev

API Endpoints
POST /v1/auth/login → User login
POST /v1/org/api/signin → Organization login
POST /v1/admin/api/organizations → Create organization (with logo upload)
POST /v1/admin/api/organizations/:orgId/users → Create user
POST /v1/user/api/inspections → Create inspection (with multiple images per part)
GET /v1/user/api/inspections → List my inspections

Images accessible at: http://localhost:5000/uploads/filename.jpg

Project Status
Backend Complete & Fully Tested ✅
