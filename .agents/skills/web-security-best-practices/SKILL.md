---
name: web-security-best-practices
description: Defensive web application security guidelines and secure coding checklist for NestJS and Next.js projects (OWASP Top 10 hardening, RBAC, input validation, headers, and rate limiting).
---

# Skill: Web Security Best Practices & Hardening Checklist

Use this skill whenever building, reviewing, or refactoring web features, API endpoints, or authentication/authorization mechanisms in NestJS & Next.js applications.

## Defensive Architecture & Security Principles

This skill ensures adherence to defensive security standards, focusing on OWASP Top 10 mitigations and secure coding practices.

---

## 1. Authentication & Session Management

- **Password Storage**: Hash all user passwords using `bcrypt` or `argon2` with an appropriate work factor (minimum 10-12 rounds for bcrypt).
- **JWT Security**:
  - Store JWT secret keys in environment variables (`JWT_SECRET`), never hardcoded in source code.
  - Set explicit token expiration times (e.g., 24h or shorter with refresh tokens).
  - Include token validation guards on all non-public API endpoints (`@UseGuards(JwtAuthGuard)`).

---

## 2. Authorization & Access Control (RBAC & Module Security)

- **Least Privilege Access**: Restrict API endpoints based on user roles (`@Roles('admin', 'manager')`) and active module status (`@RequiresModule('module_id')`).
- **Object-Level Access Control**: Ensure users can only access data belonging to their organization or assigned record (e.g., executives can only view their own quotations).
- **Default Deny Policy**: Protect all routes by default. Require explicit public annotations for unauthenticated endpoints.

---

## 3. Data Validation & Injection Prevention

- **Parameterized Queries**: Always use ORM methods (TypeORM query builder, repository methods) to prevent SQL Injection. Never concatenate raw SQL strings.
- **DTO Validation**: Enforce strict DTO validation using `class-validator` and `ValidationPipe` with `{ whitelist: true, transform: true, forbidNonWhitelisted: true }` in NestJS.
- **XSS Prevention**: Escape all dynamic HTML rendering in Next.js. Avoid using `dangerouslySetInnerHTML`.

---

## 4. HTTP Headers & Cross-Origin Security

- **Security Headers (Helmet)**:
  - `X-Frame-Options: SAMEORIGIN` (prevents clickjacking)
  - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
  - `Strict-Transport-Security` (forces HTTPS in production)
  - `Content-Security-Policy` (restricts unauthorized script execution)
- **CORS Configuration**: Restrict allowed CORS origins strictly to authorized domains (`process.env.CORS_ORIGINS`). Never use `origin: '*'` in production credentials-enabled applications.

---

## 5. Rate Limiting & DoS Protection

- **API Rate Limiting**: Enable rate limiting via `@nestjs/throttler` (e.g., 100 requests per minute per IP for standard endpoints, 5 requests per minute for authentication `/auth/login`).
- **File Upload Limits**: Enforce maximum file size limits (e.g., 5MB) and mime-type whitelist validation on file upload controllers using Multer.

---

## 6. Audit Logging & Error Handling

- **Sanitized Error Messages**: Return generic error messages to clients in production (do not leak stack traces, database schema details, or system internals).
- **Audit Trails**: Log critical operations (user authentication, module changes, custom field modifications, data exports) for compliance and auditing.
