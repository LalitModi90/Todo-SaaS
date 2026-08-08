# 🚀 Pyramid — Production-Ready MERN Todo-SaaS Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-v14-black.svg)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20In--Memory-brightgreen.svg)](https://www.mongodb.com/)
[![Security Score](https://img.shields.io/badge/Security--Score-96%2F100-success.svg)](#-security--production-hardening)

**Pyramid** is a full-stack, enterprise-grade Task & Project Management SaaS application built with **React / Next.js (App Router)**, **Node.js / Express**, and **MongoDB**. It features multi-user collaboration, persistent task locks, granular Role-Based Access Control (RBAC), Google OAuth 2.0, and comprehensive OWASP Top 10 security hardening.

---

## 🌟 Key Features

### 🔒 1. Privacy & Persistent Task Locking
- **Private by Default**: All newly created tasks are marked `isPublic: false` and restricted to the task owner and assigned team members.
- **View-Only Public Access**: Public tasks (`isPublic: true`) are visible to team members, but non-owners without explicit permissions are restricted to **View-Only** access.
- **Task Locking**: Prevent unauthorized edits while retaining full control for the task owner.

### 👥 2. Dynamic Team & Member Assignments (RBAC)
- **Role-Based Permissions**:
  - 🛠️ **Assignee** — Full Edit access for subtasks, status updates, priority, and dates.
  - 💬 **Reviewer** — Review access to leave comments, feedback, and replies.
  - 👁️ **Observer** — Read-Only access to monitor progress without making changes.
- **Multi-Person Team Batching**: Add multiple teammates (e.g. `Ankit Dutta, Sarah Connor, Tech Leads`) to a single role in a single action.

### 🔐 3. Authentication & User Profile Sync
- **Dual Auth**: Email/Password login, OTP verification, and seamless **Google OAuth 2.0** integration.
- **Dynamic Profile Mirroring**: User avatars, names, and emails reflect in real-time across topbars, sidebars, and activity logs.

### 🎨 4. Executive Dark Mode UI & UX
- Modern glassmorphism dark mode aesthetic built with custom Vanilla CSS and SVG vector graphics.
- High-contrast inputs, interactive calendar popups, dynamic status pills, and animated toast banners (`.action-toast-banner`).

---

## 🛡️ Security & Production Hardening

Tested and hardened against common security vulnerabilities (**Score: 96/100**):

- **Security Headers (`helmet`)**: Configures CSP, `X-Frame-Options` (Clickjacking defense), HSTS, and suppresses verbose technology disclosures.
- **Rate Limiting (`express-rate-limit`)**: Protects authentication endpoints against brute force attempts (max 5 requests/min per IP) and API flooding (max 200 requests/15-min window).
- **NoSQL Injection Defense (`express-mongo-sanitize`)**: Strips MongoDB operators (`$`, `.`) from request bodies, parameters, and queries.
- **XSS Protection (`xss`)**: Sanitizes incoming string parameters before database persistence.
- **IDOR Safeguards**: Enforces strict authorization checks on user profile updates, project memberships, and comment deletions.
- **File Upload Security**: Enforces MIME-type image validation (`image/*`) and a 5MB payload limit.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Library**: React 18
- **Styling**: Vanilla CSS3, CSS Variables, Responsive Layouts
- **HTTP Client**: Axios (with centralized 401 response interceptor)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Database**: MongoDB Atlas / Mongoose (with MongoDB In-Memory fallback)
- **Authentication**: JWT (`jsonwebtoken`), Google OAuth 2.0 (`google-auth-library`), Bcrypt.js
- **Storage**: Cloudinary API (Multer memory storage)

---

## ⚡ Getting Started

### 1. Prerequisites
- Node.js `v18.x` or higher
- npm or yarn

### 2. Clone the Repository
```bash
git clone https://github.com/LalitModi90/Todo-SaaS.git
cd Todo-SaaS
```

### 3. Environment Setup

#### Server Environment (`server/.env`)
```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUD_NAME=your_cloudinary_name
API_KEY=your_cloudinary_key
API_SECRET=your_cloudinary_secret
```

#### Client Environment (`client/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 4. Install Dependencies & Start

#### Run Backend Server
```bash
cd server
npm install
npm start
```
*Server runs at `http://localhost:4000`*

#### Run Frontend Client
```bash
cd client
npm install
npm run dev
```
*Client runs at `http://localhost:3000`*

---

## 🔑 Default Test Accounts

All pre-seeded default test accounts use the password: `123456`

| Name | Email | Default Role |
| :--- | :--- | :--- |
| **Lalit Modi** | `lalitmodi7878065@gmail.com` | Workspace Owner / Project Lead |
| **Ankit Dutta** | `ankit@gmail.com` | Teammate / Contributor |
| **Admin User** | `admin@gmail.com` | System Admin |
| **Security Team** | `security@gmail.com` | Security Auditor |

---

## 📑 API Architecture Overview

| Endpoint | Method | Access | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/register` | `POST` | Public | Register new user account |
| `/api/auth/login` | `POST` | Public | Authenticate user & receive JWT token |
| `/auth/google` | `GET` | Public | Initiate Google OAuth 2.0 flow |
| `/api/tasks` | `GET` | Private | Fetch tasks accessible to logged-in user |
| `/api/tasks/:id` | `GET` | Private | Fetch task details with IDOR verification |
| `/api/tasks/:id` | `PUT` | Private | Update task properties (RBAC protected) |
| `/api/projects` | `GET` | Private | Fetch user lead/member projects |
| `/api/users/avatar` | `POST` | Private | Upload user avatar to Cloudinary |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
