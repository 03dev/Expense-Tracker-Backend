# Expense Tracker API — Documentation

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Environment Variables](#environment-variables)
4. [Authentication](#authentication)
5. [Response Format](#response-format)
6. [Error Handling](#error-handling)
7. [Endpoints](#endpoints)
   - [Auth](#auth-endpoints)
   - [User](#user-endpoints)
   - [Categories](#category-endpoints)
   - [Transactions](#transaction-endpoints)
   - [Budgets](#budget-endpoints)
   - [Notifications](#notification-endpoints)
   - [Analytics](#analytics-endpoints)
   - [Dashboard](#dashboard-endpoints)

---

## Overview

A RESTful backend API for personal expense tracking. Built with **Node.js**, **Express**, **TypeScript**, **PostgreSQL** (via Prisma), and **Redis**.

### Key Features

- JWT-based authentication with refresh tokens
- Email verification and optional two-factor authentication (2FA)
- Income and expense transaction tracking with receipt uploads
- Hierarchical category management
- Monthly budget tracking with 80% and 100% alert notifications
- Analytics with monthly trends and merchant breakdowns
- Dashboard with balance summary and top spending categories

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- Cloudinary account (for file uploads)
- Resend account (for emails)

### Installation

```bash
npm install
npx prisma migrate dev
npm run dev
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | Server port (default: `3000`) |
| `NODE_ENV` | No | `development` \| `production` \| `test` |
| `ACCESS_TOKEN_SECRET` | Yes | JWT secret, minimum 32 characters |
| `REFRESH_TOKEN_SECRET` | Yes | JWT refresh secret, minimum 32 characters |
| `ACCESS_TOKEN_EXPIRES_IN` | No | Access token TTL (default: `15m`) |
| `REFRESH_TOKEN_EXPIRES_IN` | No | Refresh token TTL (default: `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `REDIS_HOST` | No | Redis host (default: `localhost`) |
| `REDIS_PORT` | No | Redis port (default: `6379`) |
| `REDIS_PASSWORD` | No | Redis password |
| `RESEND_API_KEY` | Yes | Resend email API key |
| `CLIENT_URL` | No | Frontend URL (default: `http://localhost:5173`) |

---

## Authentication

Most endpoints require a valid **Bearer token** in the `Authorization` header.

```
Authorization: Bearer <access_token>
```

Access tokens expire in 15 minutes. Use the [Refresh Token](#post-authrefresh) endpoint to get a new one.

### Authentication Flow

```
1. POST /auth/signup         → receives userId
2. POST /auth/verify-email   → receives access + refresh tokens
   (if 2FA enabled)
3. POST /auth/verify-two-factor → receives access + refresh tokens
```

---

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "message": "Description of the result",
  "data": { }
}
```

Validation error responses include a `details` field:

```json
{
  "success": false,
  "message": "Validation failed",
  "details": {
    "fieldName": "Error description"
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `400` | Bad Request / Validation Error |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `429` | Too Many Requests |
| `500` | Internal Server Error |

---

## Error Handling

Prisma constraint errors are automatically translated:

| Prisma Code | Returned As |
|-------------|-------------|
| `P2002` | 409 Conflict (unique constraint) |
| `P2025` | 404 Not Found |
| `P2003` | 400 Bad Request (foreign key violation) |

---

## Endpoints

### Auth Endpoints

> Rate limit: **10 requests / 15 minutes** on signup, login, verify endpoints.
> Rate limit: **30 requests / 15 minutes** on logout and refresh endpoints.

---

#### `POST /auth/signup`

Register a new user. Sends an email verification code.

**Request Body**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | 2–50 characters |
| `email` | string | valid email |
| `password` | string | minimum 8 characters |

**Response `201`**

```json
{
  "success": true,
  "message": "User registered. Please verify your email.",
  "data": {
    "userId": "cuid_abc123"
  }
}
```

---

#### `POST /auth/verify-email`

Verify the 6-digit code sent to the user's email.

**Request Body**

```json
{
  "userId": "cuid_abc123",
  "code": "123456"
}
```

**Response `200`** — returns tokens directly if 2FA is disabled.

```json
{
  "success": true,
  "message": "Email verified successfully.",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": {
      "id": "cuid_abc123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Response `200`** — if 2FA is enabled, returns a prompt instead of tokens.

```json
{
  "success": true,
  "message": "Two-factor authentication required.",
  "data": {
    "requiresTwoFactor": true,
    "userId": "cuid_abc123"
  }
}
```

---

#### `POST /auth/verify-two-factor`

Verify the 6-digit 2FA code.

**Request Body**

```json
{
  "userId": "cuid_abc123",
  "code": "654321"
}
```

**Response `200`**

```json
{
  "success": true,
  "message": "Two-factor authentication verified.",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": { "id": "...", "name": "...", "email": "..." }
  }
}
```

---

#### `POST /auth/login`

Authenticate with email and password.

**Request Body**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response `200`** — 2FA disabled

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": { "id": "...", "name": "...", "email": "..." }
  }
}
```

**Response `200`** — 2FA enabled

```json
{
  "success": true,
  "message": "Two-factor authentication required.",
  "data": {
    "requiresTwoFactor": true,
    "userId": "cuid_abc123"
  }
}
```

---

#### `POST /auth/resend-verification`

Resend the email verification code.

**Request Body**

```json
{
  "userId": "cuid_abc123"
}
```

**Response `200`**

```json
{
  "success": true,
  "message": "Verification code resent."
}
```

---

#### `POST /auth/refresh`

Exchange a valid refresh token for a new access token.

**Request Body**

```json
{
  "refreshToken": "<jwt>"
}
```

**Response `200`**

```json
{
  "success": true,
  "message": "Token refreshed.",
  "data": {
    "accessToken": "<jwt>"
  }
}
```

---

#### `POST /auth/logout`

Invalidate the current refresh token.

**Request Body**

```json
{
  "refreshToken": "<jwt>"
}
```

**Response `200`**

```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

#### `PATCH /auth/two-factor`

Toggle two-factor authentication on or off. Requires authentication.

**Request Body**

```json
{
  "enable": true
}
```

**Response `200`**

```json
{
  "success": true,
  "message": "Two-factor authentication enabled."
}
```

---

### User Endpoints

All endpoints require `Authorization: Bearer <access_token>`.

---

#### `GET /user/profile`

Get the authenticated user's profile.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "cuid_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "avatarUrl": "https://res.cloudinary.com/...",
    "isEmailVerified": true,
    "isTwoFactorEnabled": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### `PATCH /user/profile`

Update the authenticated user's display name.

**Request Body**

```json
{
  "name": "Jane Doe"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | 2–50 characters |

**Response `200`**

```json
{
  "success": true,
  "message": "Profile updated.",
  "data": { "name": "Jane Doe" }
}
```

---

#### `PATCH /user/password`

Change the authenticated user's password. Invalidates all active sessions.

**Request Body**

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `currentPassword` | string | must match existing password |
| `newPassword` | string | minimum 8 characters, must differ from current |

**Response `200`**

```json
{
  "success": true,
  "message": "Password changed. Please log in again."
}
```

---

#### `POST /user/avatar`

Upload a new avatar image. Accepts `multipart/form-data`.

**Form Data**

| Field | Type | Rules |
|-------|------|-------|
| `avatar` | file | image files only, max 5 MB |

**Response `200`**

```json
{
  "success": true,
  "message": "Avatar uploaded.",
  "data": {
    "avatarUrl": "https://res.cloudinary.com/..."
  }
}
```

---

### Category Endpoints

All endpoints require `Authorization: Bearer <access_token>`.

---

#### `POST /categories`

Create a new category. If a soft-deleted category with the same name already exists, it is restored instead.

**Request Body**

```json
{
  "name": "Groceries",
  "icon": "🛒",
  "parentId": "cuid_parent"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | required, min 1 character |
| `icon` | string | optional, 1–50 characters |
| `parentId` | string (UUID) | optional, references a parent category |

**Response `201`**

```json
{
  "success": true,
  "message": "Category created.",
  "data": {
    "id": "cuid_xyz",
    "name": "Groceries",
    "icon": "🛒",
    "parentId": null
  }
}
```

---

#### `GET /categories`

List all categories for the authenticated user, including transaction counts.

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "cuid_xyz",
      "name": "Groceries",
      "icon": "🛒",
      "parentId": null,
      "_count": { "transactions": 12 }
    }
  ]
}
```

---

#### `GET /categories/:id`

Get a single category including its child categories.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "cuid_xyz",
    "name": "Food",
    "children": [
      { "id": "cuid_abc", "name": "Groceries" },
      { "id": "cuid_def", "name": "Restaurants" }
    ]
  }
}
```

---

#### `PATCH /categories/:id`

Update a category's name or icon. At least one field is required.

**Request Body**

```json
{
  "name": "Food & Drink",
  "icon": "🍔"
}
```

**Response `200`**

```json
{
  "success": true,
  "message": "Category updated.",
  "data": { "id": "...", "name": "Food & Drink", "icon": "🍔" }
}
```

---

#### `DELETE /categories/:id`

Soft-delete a category.

**Response `200`**

```json
{
  "success": true,
  "message": "Category deleted."
}
```

---

### Transaction Endpoints

All endpoints require `Authorization: Bearer <access_token>`.

---

#### `POST /transactions`

Create a new transaction. Accepts `multipart/form-data` (for optional receipt upload). Automatically triggers budget alert notifications if 80% or 100% of a monthly budget is reached.

**Form Data / Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `amount` | number | required, positive |
| `type` | string | `INCOME` or `EXPENSE` |
| `date` | string | ISO 8601 date |
| `categoryId` | string (UUID) | required |
| `note` | string | optional, max 500 characters |
| `merchant` | string | optional, max 100 characters |
| `location` | string | optional, max 200 characters |
| `isRecurring` | boolean | optional |
| `tags` | string[] | optional array |
| `receipt` | file | optional image, max 5 MB |

**Response `201`**

```json
{
  "success": true,
  "message": "Transaction created.",
  "data": {
    "id": "cuid_txn",
    "amount": "49.99",
    "type": "EXPENSE",
    "date": "2024-05-01T00:00:00.000Z",
    "note": "Weekly groceries",
    "merchant": "Walmart",
    "receiptUrl": "https://res.cloudinary.com/...",
    "category": { "id": "...", "name": "Groceries" }
  }
}
```

---

#### `GET /transactions`

List transactions with optional filters and pagination.

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Results per page (max 50) |
| `sortOrder` | string | `desc` | `asc` or `desc` by date |
| `type` | string | — | `INCOME` or `EXPENSE` |
| `categoryId` | string | — | Filter by category UUID |
| `startDate` | string | — | ISO 8601 start date |
| `endDate` | string | — | ISO 8601 end date |
| `merchant` | string | — | Partial merchant name match |
| `isRecurring` | boolean | — | Filter recurring transactions |
| `tags` | string[] | — | Filter by tags |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "transactions": [ { "id": "...", "amount": "49.99", "type": "EXPENSE", "date": "...", "category": { "name": "Groceries" } } ],
    "pagination": {
      "total": 120,
      "page": 1,
      "limit": 10,
      "totalPages": 12
    }
  }
}
```

---

#### `GET /transactions/:id`

Get a single transaction by ID.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "cuid_txn",
    "amount": "49.99",
    "type": "EXPENSE",
    "note": "Weekly groceries",
    "merchant": "Walmart",
    "location": "123 Main St",
    "isRecurring": false,
    "tags": ["groceries", "weekly"],
    "receiptUrl": null,
    "date": "2024-05-01T00:00:00.000Z",
    "category": { "id": "...", "name": "Groceries", "icon": "🛒" }
  }
}
```

---

#### `PATCH /transactions/:id`

Update a transaction. At least one field is required.

**Request Body** — same fields as create, all optional.

**Response `200`**

```json
{
  "success": true,
  "message": "Transaction updated.",
  "data": { "id": "...", "amount": "55.00" }
}
```

---

#### `DELETE /transactions/:id`

Soft-delete a transaction.

**Response `200`**

```json
{
  "success": true,
  "message": "Transaction deleted."
}
```

---

#### `DELETE /transactions/:id/receipt`

Remove the receipt image from a transaction.

**Response `200`**

```json
{
  "success": true,
  "message": "Receipt deleted."
}
```

---

### Budget Endpoints

All endpoints require `Authorization: Bearer <access_token>`.

---

#### `POST /budgets`

Create a monthly budget for a category. If a soft-deleted budget for the same category/month/year already exists, it is restored.

**Request Body**

```json
{
  "amount": 500,
  "month": 5,
  "year": 2024,
  "categoryId": "cuid_category",
  "icon": "🛒"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `amount` | number | required, positive |
| `month` | number | 1–12 |
| `year` | number | 2000–2100 |
| `categoryId` | string (UUID) | required |
| `icon` | string | optional |

**Response `201`**

```json
{
  "success": true,
  "message": "Budget created.",
  "data": {
    "id": "cuid_budget",
    "amount": "500.00",
    "month": 5,
    "year": 2024,
    "category": { "name": "Groceries" }
  }
}
```

---

#### `GET /budgets`

List all budgets with the amount spent so far. Optionally filter by month and year (both must be provided together).

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `month` | number | 1–12 (required with year) |
| `year` | number | 2000–2100 (required with month) |

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "cuid_budget",
      "amount": "500.00",
      "spent": "320.00",
      "month": 5,
      "year": 2024,
      "category": { "name": "Groceries", "icon": "🛒" }
    }
  ]
}
```

---

#### `GET /budgets/:id`

Get a single budget by ID.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "cuid_budget",
    "amount": "500.00",
    "month": 5,
    "year": 2024,
    "category": { "id": "...", "name": "Groceries" }
  }
}
```

---

#### `PATCH /budgets/:id`

Update budget amount or icon. At least one field required.

**Request Body**

```json
{
  "amount": 600,
  "icon": "🛍️"
}
```

**Response `200`**

```json
{
  "success": true,
  "message": "Budget updated.",
  "data": { "id": "...", "amount": "600.00" }
}
```

---

#### `DELETE /budgets/:id`

Soft-delete a budget.

**Response `200`**

```json
{
  "success": true,
  "message": "Budget deleted."
}
```

---

### Notification Endpoints

All endpoints require `Authorization: Bearer <access_token>`.

Notifications are generated automatically when:
- A transaction is created (`TRANSACTION_CREATED`)
- A transaction is deleted (`TRANSACTION_DELETED`)
- A budget reaches 80% spent (`BUDGET_ALERT`)
- A budget reaches 100% spent (`BUDGET_EXCEEDED`)

---

#### `GET /notifications`

List notifications with pagination.

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page (max 100) |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "cuid_notif",
        "title": "Budget Alert",
        "message": "You have used 80% of your Groceries budget.",
        "type": "BUDGET_ALERT",
        "isRead": false,
        "createdAt": "2024-05-01T10:00:00.000Z"
      }
    ],
    "unreadCount": 3,
    "pagination": { "total": 15, "page": 1, "limit": 20, "totalPages": 1 }
  }
}
```

---

#### `GET /notifications/unread-count`

Get the count of unread notifications.

**Response `200`**

```json
{
  "success": true,
  "data": { "unreadCount": 3 }
}
```

---

#### `PATCH /notifications/:id/read`

Mark a single notification as read.

**Response `200`**

```json
{
  "success": true,
  "message": "Notification marked as read."
}
```

---

#### `PATCH /notifications/read-all`

Mark all notifications as read.

**Response `200`**

```json
{
  "success": true,
  "message": "All notifications marked as read."
}
```

---

#### `DELETE /notifications/:id`

Delete a notification.

**Response `200`**

```json
{
  "success": true,
  "message": "Notification deleted."
}
```

---

### Analytics Endpoints

All endpoints require `Authorization: Bearer <access_token>`.

---

#### `GET /analytics`

Get spending analytics for a given month/year. Defaults to the current month.

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `month` | number | 1–12 (optional) |
| `year` | number | 2000–2100 (optional) |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIncome": "2500.00",
      "totalExpense": "1800.00",
      "expenseChange": 12.5
    },
    "categoryBreakdown": [
      { "categoryName": "Groceries", "total": "320.00", "percentage": 17.8 }
    ],
    "monthlyTrend": [
      { "month": "2023-12", "income": "2200.00", "expense": "1600.00" },
      { "month": "2024-01", "income": "2400.00", "expense": "1750.00" }
    ],
    "topMerchants": [
      { "merchant": "Walmart", "total": "280.00", "count": 6 }
    ]
  }
}
```

---

### Dashboard Endpoints

All endpoints require `Authorization: Bearer <access_token>`.

---

#### `GET /dashboard`

Get a summary for the dashboard view. Defaults to the current month/year.

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `month` | number | current month | 1–12 |
| `year` | number | current year | 2000–current year |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "balance": "700.00",
    "income": "2500.00",
    "expense": "1800.00",
    "recentTransactions": [
      {
        "id": "cuid_txn",
        "amount": "49.99",
        "type": "EXPENSE",
        "merchant": "Walmart",
        "date": "2024-05-01T00:00:00.000Z",
        "category": { "name": "Groceries" }
      }
    ],
    "topCategories": [
      { "name": "Groceries", "total": "320.00" },
      { "name": "Transport", "total": "210.00" }
    ]
  }
}
```

---

## Database Schema Summary

| Model | Description |
|-------|-------------|
| `User` | Core user account with 2FA and email verification flags |
| `VerificationCode` | 6-digit codes for email verification and 2FA |
| `RefreshToken` | Stored refresh tokens for session management |
| `Category` | Hierarchical categories with soft-delete support |
| `Transaction` | Income/expense records with receipt and tags |
| `Budget` | Monthly budgets per category with soft-delete |
| `Notification` | System alerts for transactions and budget thresholds |

All records use `cuid2` as IDs. Soft deletes are implemented via `deletedAt` timestamps.
