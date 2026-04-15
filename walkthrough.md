# Dissonance Backend — Walkthrough

## Summary

Built the complete Spring Boot backend for **Dissonance**, a Discord-inspired real-time communication platform. The project went from an empty scaffold to a fully-structured, compilable backend with **40+ Java files** across 9 implementation phases.

## Architecture

```
Spring Boot 3.5.13 + Java 17
├── PostgreSQL (NeonDB)     → Data persistence
├── Redis Cloud              → JWT blocklist + message pub/sub
├── Cloudinary               → File/image storage (CDN)
├── WebSocket (STOMP/SockJS) → Real-time messaging
└── JWT (jjwt)               → Stateless authentication
```

## What Was Built

### 1. Authentication System
- JWT access tokens (15 min) + refresh tokens (7 days)
- Redis-backed token blocklist for secure logout
- BCrypt password hashing
- Spring Security filter chain validates every request
- **Endpoints**: `POST /api/auth/register`, `/login`, `/refresh`, `/logout`

### 2. Guild & Channel Management
- Create guilds with auto-generated invite codes
- Join guilds via invite link
- Default "general" channel on guild creation
- OWNER/MEMBER role system
- Channel CRUD with last-channel deletion protection
- **Endpoints**: `POST /api/guilds`, `GET /api/guilds`, `POST /api/guilds/join/{code}`, `POST /api/guilds/{id}/channels`, etc.

### 3. Real-Time Messaging
- STOMP over SockJS WebSocket at `/ws`
- Send, edit, delete messages via WebSocket (`/app/chat.send`, `/app/chat.edit`, `/app/chat.delete`)
- Redis pub/sub for message fan-out to all subscribers
- Dynamic Redis channel subscription management
- Paginated message history via REST
- **REST Endpoints**: `GET /api/channels/{id}/messages`, `GET /api/dm/{id}/messages`

### 4. Direct Messages
- 1:1 DM threads with consistent user pair ordering
- Get-or-create pattern for DM thread initiation
- Last message preview in DM thread listing
- **Endpoints**: `POST /api/dm`, `GET /api/dm`

### 5. File Uploads
- Cloudinary integration with auto resource type detection (image/video/raw)
- Files stored in `dissonance/` folder on Cloudinary
- 10MB file size limit
- **Endpoint**: `POST /api/files/upload`

### 6. Exception Handling
- Global exception handler with consistent JSON error responses
- Custom exceptions: `ResourceNotFoundException`, `UnauthorizedException`, `BadRequestException`
- Bean validation error formatting with field-level details

## File Structure

```
src/main/java/com/synapse/chat_application/
├── ChatApplication.java
├── config/          (4 files) — Security, WebSocket, Redis, Cloudinary
├── security/        (3 files) — JWT service, filter, UserDetailsService
├── entity/          (8 files) — User, Guild, GuildMember, Channel, Message, DirectMessage, Attachment, Role
├── repository/      (7 files) — JPA interfaces for all entities
├── dto/             (11 files) — Request/response DTOs organized by feature
├── service/         (8 files) — Business logic for all features
├── controller/      (7 files) — REST + WebSocket controllers
└── exception/       (4 files) — Custom exceptions + global handler
```

**Total: 42 Java files**

## Verification

| Check | Result |
|-------|--------|
| `mvn compile` | ✅ BUILD SUCCESS |
| All imports resolve | ✅ |
| Entity relationships valid | ✅ |
| Security filter chain configured | ✅ |

## Configuration Required Before Running

Update `application.properties` with your actual credentials:

| Property | Status |
|----------|--------|
| PostgreSQL (NeonDB) | ✅ Configured |
| Redis Cloud | ✅ Configured |
| JWT Secret | ✅ Pre-set |
| Cloudinary | ⚠️ Placeholders — user will provide |
| CORS Origin | ✅ Set to `http://localhost:3000` |

## Next Steps

1. **Provide Cloudinary credentials** to replace placeholders
2. **Run the application** with `./mvnw spring-boot:run`
3. **Test auth flow** with Postman: Register → Login → Access protected endpoints
4. **Build the React/Next.js frontend** (separate phase)
