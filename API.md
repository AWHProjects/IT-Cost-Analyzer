# IT Cost Analyzer - API Documentation

This document provides comprehensive documentation for the IT Cost Analyzer REST API.

## 🔗 Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-domain.com/api`

## 🔐 Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Lifecycle
- **Access Token**: 24 hours (configurable)
- **Refresh Token**: 7 days (configurable)

## 📊 Response Format

All API responses follow this standard format:

```json
{
  "success": boolean,
  "data": object | array | null,
  "message": string,
  "errors": string[] | null,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

## 🔑 Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "department": "IT"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "department": "IT"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/login
Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /auth/profile
Get current user profile information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "department": "IT",
    "organizations": [
      {
        "id": "org-123",
        "name": "Acme Corp",
        "role": "ADMIN"
      }
    ]
  }
}
```

### POST /auth/logout
Logout user and invalidate tokens.

**Headers:** `Authorization: Bearer <token>`

## 📈 Analytics Endpoints

### GET /analytics/dashboard
Get dashboard overview with key metrics.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)
- `organizationId` (optional): Filter by organization

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCost": 125000.50,
    "monthlyCost": 10416.71,
    "totalApplications": 45,
    "totalLicenses": 1250,
    "utilizationRate": 78.5,
    "potentialSavings": 15000.00,
    "costTrend": [
      {
        "date": "2024-01-01",
        "cost": 9500.00
      }
    ],
    "topApplications": [
      {
        "id": "app-123",
        "name": "Microsoft Office 365",
        "cost": 25000.00,
        "utilization": 85.2
      }
    ]
  }
}
```

### GET /analytics/cost-trends
Get detailed cost trend analysis.

**Query Parameters:**
- `period`: `7d`, `30d`, `90d`, `1y`
- `granularity`: `daily`, `weekly`, `monthly`
- `applicationId` (optional): Filter by application
- `department` (optional): Filter by department

**Response:**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "date": "2024-01-01",
        "totalCost": 9500.00,
        "newLicenses": 5,
        "cancelledLicenses": 2,
        "growthRate": 2.5
      }
    ],
    "summary": {
      "totalCost": 125000.50,
      "averageMonthlyCost": 10416.71,
      "growthRate": 12.5,
      "projection": 140000.00
    }
  }
}
```

### GET /analytics/license-utilization
Get license utilization data across applications.

**Query Parameters:**
- `applicationId` (optional): Filter by application
- `department` (optional): Filter by department
- `threshold` (optional): Minimum utilization threshold (0-100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "applicationId": "app-123",
      "applicationName": "Microsoft Office 365",
      "totalLicenses": 500,
      "usedLicenses": 426,
      "utilizationRate": 85.2,
      "inactiveUsers": 74,
      "lastActiveDate": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET /analytics/recommendations
Get cost optimization recommendations.

**Query Parameters:**
- `priority`: `low`, `medium`, `high`, `critical`
- `type`: `unused_license`, `underutilized_app`, `duplicate_functionality`
- `limit` (optional): Number of recommendations (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rec-123",
      "type": "unused_license",
      "title": "Remove 25 unused Adobe Creative Suite licenses",
      "description": "These licenses have been inactive for over 90 days",
      "applicationId": "app-456",
      "applicationName": "Adobe Creative Suite",
      "potentialSavings": 5000.00,
      "priority": "high",
      "confidence": 95,
      "actionRequired": "Review inactive users and cancel unused licenses",
      "metadata": {
        "inactiveUsers": 25,
        "inactiveDays": 120,
        "monthlyCost": 200.00
      }
    }
  ]
}
```

## 💼 Application Management

### GET /applications
List all applications with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search by name or vendor
- `category` (optional): Filter by category
- `status` (optional): `active`, `inactive`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "app-123",
      "name": "Microsoft Office 365",
      "vendor": "Microsoft",
      "category": "Productivity",
      "description": "Office productivity suite",
      "website": "https://office.com",
      "status": "active",
      "totalLicenses": 500,
      "totalCost": 25000.00,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### POST /applications
Create a new application.

**Request Body:**
```json
{
  "name": "Slack",
  "vendor": "Slack Technologies",
  "category": "Communication",
  "description": "Team communication platform",
  "website": "https://slack.com"
}
```

### GET /applications/:id
Get detailed application information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "app-123",
    "name": "Microsoft Office 365",
    "vendor": "Microsoft",
    "category": "Productivity",
    "description": "Office productivity suite",
    "website": "https://office.com",
    "status": "active",
    "licenses": [
      {
        "id": "lic-123",
        "type": "Business Premium",
        "totalSeats": 500,
        "usedSeats": 426,
        "costPerSeat": 22.00,
        "billingCycle": "monthly"
      }
    ],
    "usage": {
      "totalUsers": 426,
      "activeUsers": 398,
      "utilizationRate": 85.2
    },
    "costs": {
      "monthly": 11000.00,
      "annual": 132000.00
    }
  }
}
```

## 📄 License Management

### GET /licenses
List all licenses with filtering options.

**Query Parameters:**
- `applicationId` (optional): Filter by application
- `status`: `active`, `inactive`, `expired`
- `userId` (optional): Filter by assigned user
- `page`, `limit`: Pagination

### POST /licenses
Create a new license.

**Request Body:**
```json
{
  "applicationId": "app-123",
  "licenseType": "Business Premium",
  "totalSeats": 100,
  "costPerSeat": 22.00,
  "billingCycle": "monthly",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "vendor": "Microsoft"
}
```

## 👥 User Management

### GET /users
List organization users.

**Query Parameters:**
- `department` (optional): Filter by department
- `role`: `USER`, `ADMIN`, `OWNER`
- `status`: `active`, `inactive`
- `page`, `limit`: Pagination

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "email": "john.doe@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "department": "Engineering",
      "role": "USER",
      "status": "active",
      "lastLogin": "2024-01-15T10:30:00Z",
      "licenses": [
        {
          "applicationName": "Microsoft Office 365",
          "licenseType": "Business Premium",
          "assignedDate": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

## 📤 File Upload

### POST /upload/invoice
Upload invoice files for processing.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Invoice file (PDF, CSV, Excel)
- `vendor` (optional): Vendor name
- `period` (optional): Billing period
- `description` (optional): File description

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file-123",
    "filename": "invoice_jan_2024.pdf",
    "size": 1024000,
    "status": "processing",
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

### POST /upload/usage-report
Upload usage reports from SaaS platforms.

**Form Data:**
- `file`: Usage report file
- `application` (optional): Application name
- `reportType`: `user_activity`, `license_usage`, `cost_report`
- `dateRange` (optional): Report date range

### GET /upload/status/:fileId
Check file processing status.

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file-123",
    "status": "completed",
    "progress": 100,
    "processedAt": "2024-01-15T10:35:00Z",
    "results": {
      "recordsProcessed": 1250,
      "recordsImported": 1200,
      "errors": 50
    }
  }
}
```

## 🔗 Integrations

### GET /integrations
List available integrations and their status.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "microsoft-365",
      "name": "Microsoft 365",
      "status": "connected",
      "lastSync": "2024-01-15T10:00:00Z",
      "syncInterval": "daily",
      "dataTypes": ["users", "licenses", "usage"]
    },
    {
      "id": "slack",
      "name": "Slack",
      "status": "disconnected",
      "lastSync": null,
      "syncInterval": "daily",
      "dataTypes": ["users", "channels", "usage"]
    }
  ]
}
```

### POST /integrations/microsoft
Connect Microsoft 365 integration.

**Request Body:**
```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "tenantId": "your-tenant-id"
}
```

### POST /integrations/:id/sync
Trigger manual sync for an integration.

## 🚨 Alerts & Notifications

### GET /alerts
Get user alerts and notifications.

**Query Parameters:**
- `type`: `cost_spike`, `unused_license`, `expiring_license`
- `severity`: `low`, `medium`, `high`, `critical`
- `unreadOnly`: `true`, `false`
- `page`, `limit`: Pagination

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "alert-123",
      "type": "cost_spike",
      "severity": "high",
      "title": "Unusual cost increase detected",
      "message": "Microsoft Office 365 costs increased by 25% this month",
      "applicationId": "app-123",
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "metadata": {
        "previousCost": 20000.00,
        "currentCost": 25000.00,
        "increasePercentage": 25.0
      }
    }
  ]
}
```

### PUT /alerts/:id/read
Mark alert as read.

### PUT /alerts/:id/resolve
Resolve an alert.

## 📊 Export & Reporting

### GET /analytics/export
Export analytics data in various formats.

**Query Parameters:**
- `format`: `pdf`, `excel`, `csv`, `json`
- `type`: `dashboard`, `cost_trends`, `utilization`, `recommendations`
- `dateRange`: Date range for the report
- `applicationIds` (optional): Comma-separated application IDs

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://api.example.com/downloads/report-123.pdf",
    "filename": "cost_analysis_2024_01.pdf",
    "expiresAt": "2024-01-16T10:30:00Z"
  }
}
```

## ❌ Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation errors |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## 🔄 Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated requests**: 1000 requests per 15 minutes
- **Unauthenticated requests**: 100 requests per 15 minutes
- **File uploads**: 10 uploads per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

## 🔍 Filtering & Sorting

Most list endpoints support filtering and sorting:

**Query Parameters:**
- `sort`: Field to sort by (prefix with `-` for descending)
- `filter[field]`: Filter by field value
- `search`: Full-text search

**Example:**
```
GET /applications?sort=-createdAt&filter[category]=Productivity&search=office
```

## 📝 Webhooks

Configure webhooks to receive real-time notifications:

### POST /webhooks
Create a new webhook.

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["cost_spike", "license_expiring"],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload
```json
{
  "event": "cost_spike",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "applicationId": "app-123",
    "applicationName": "Microsoft Office 365",
    "previousCost": 20000.00,
    "currentCost": 25000.00,
    "increasePercentage": 25.0
  }
}
```

## 🧪 Testing

Use the following test credentials for development:

**Admin User:**
- Email: `admin@acme.com`
- Password: `password123`

**Regular User:**
- Email: `user@acme.com`
- Password: `password123`

## 📞 Support

For API support:
- Check response error messages
- Verify authentication tokens
- Review request format and required fields
- Contact support with request/response details

---

**API Version**: 1.0.0  
**Last Updated**: January 2024