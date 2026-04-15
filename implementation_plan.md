# Dissonance — Backend Implementation Plan

> Full Spring Boot backend for a Discord-inspired real-time communication platform.

## Current State

- **Spring Boot 3.5.13** scaffold with only `ChatApplication.java`
- **Dependencies already present**: Spring Web, Spring Security, Spring Data JPA, Spring WebSocket, PostgreSQL driver, Lombok, jjwt 0.12.6, MinIO 8.5.9
- **Missing dependencies**: Spring Data Redis, Spring Boot Starter Validation, Cloudinary SDK
- **Dependencies to remove**: MinIO (replaced by Cloudinary)
- **Database**: PostgreSQL on NeonDB (already configured)
- **Redis**: Redis Cloud (user-provided instance)
- **File Storage**: Cloudinary (cloud-hosted image/file CDN)
- **No business logic, entities, or configuration** exists yet

---

## User Review Required

> [!NOTE]
> **Redis**: Using Redis Cloud. You'll need to provide the host, port, and password for your instance in `application.properties`.

> [!NOTE]
> **File Storage**: Using Cloudinary instead of MinIO. You'll need to provide your Cloudinary cloud name, API key, and API secret.

> [!WARNING]
> **Database credentials** are currently hardcoded in `application.properties`. For production, these should be environment variables. I'll keep them as-is for now but can refactor to `application.yml` with env var placeholders if you prefer.

> [!IMPORTANT]
> **Frontend**: This plan covers the **backend only**. The React/Next.js frontend will be a separate phase. Should I plan that too after backend is done?

---

## Proposed Changes — 8 Phases

### Phase 1: Project Configuration & Dependencies

#### [MODIFY] [pom.xml](file:///d:/Web%20devlopment/JAVA-BACKEND/Synapse/backend/chat-application/pom.xml)
Add missing dependencies:
- `spring-boot-starter-data-redis` — Redis Cloud for JWT blocklist + pub/sub
- `spring-boot-starter-validation` — Request DTO validation (`@Valid`, `@NotBlank`, etc.)
- `cloudinary-http5` (com.cloudinary) — Cloudinary SDK for file/image uploads

Remove:
- `minio` — replaced by Cloudinary

#### [MODIFY] [application.properties](file:///d:/Web%20devlopment/JAVA-BACKEND/Synapse/backend/chat-application/src/main/resources/application.properties)
Add configuration for:
- Redis Cloud connection (`spring.data.redis.host`, `port`, `password`, `ssl.enabled=true`)
- JWT secrets and TTLs (`app.jwt.secret`, `app.jwt.access-token-expiry`, `app.jwt.refresh-token-expiry`)
- Cloudinary credentials (`app.cloudinary.cloud-name`, `api-key`, `api-secret`)
- WebSocket allowed origins
- File upload limits (`spring.servlet.multipart.max-file-size`)

> [!TIP]
> No Docker Compose needed — all infrastructure (PostgreSQL, Redis, file storage) is cloud-hosted.

---

### Phase 2: JPA Entities (Data Model)

All entities go under `com.synapse.chat_application.entity`.

#### [NEW] User.java
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | `@GeneratedValue(strategy = UUID)` |
| username | String | unique, not null |
| email | String | unique, not null |
| password | String | BCrypt hashed |
| avatarUrl | String | nullable, MinIO URL |
| createdAt | Instant | `@CreationTimestamp` |

#### [NEW] Guild.java
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | String | not null |
| iconUrl | String | nullable |
| inviteCode | String | unique, auto-generated |
| owner | User | `@ManyToOne` |
| createdAt | Instant | |

#### [NEW] GuildMember.java
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| user | User | `@ManyToOne` |
| guild | Guild | `@ManyToOne` |
| role | Role enum | `OWNER` / `MEMBER` |
| joinedAt | Instant | |

Composite unique constraint on `(user, guild)`.

#### [NEW] Channel.java
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | String | not null |
| topic | String | nullable |
| guild | Guild | `@ManyToOne` |
| createdAt | Instant | |

#### [NEW] Message.java
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| content | String | `@Column(columnDefinition = "TEXT")` |
| sender | User | `@ManyToOne` |
| channel | Channel | `@ManyToOne`, nullable (null → DM) |
| dmThread | DirectMessage | `@ManyToOne`, nullable (null → channel msg) |
| edited | boolean | default false |
| createdAt | Instant | |
| updatedAt | Instant | |

#### [NEW] DirectMessage.java
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| user1 | User | `@ManyToOne` |
| user2 | User | `@ManyToOne` |
| createdAt | Instant | |

Unique constraint on ordered `(user1, user2)` pair.

#### [NEW] Attachment.java
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| message | Message | `@OneToOne` |
| fileUrl | String | Cloudinary URL |
| publicId | String | Cloudinary public ID (for deletion) |
| fileName | String | original name |
| fileType | String | MIME type |
| fileSize | Long | bytes |

#### [NEW] Role.java (enum)
```java
public enum Role { OWNER, MEMBER }
```

---

### Phase 3: Repositories

All under `com.synapse.chat_application.repository`.

| File | Key Methods |
|------|-------------|
| **UserRepository.java** | `findByUsername()`, `findByEmail()`, `existsByUsername()`, `existsByEmail()` |
| **GuildRepository.java** | `findByInviteCode()` |
| **GuildMemberRepository.java** | `findByUserAndGuild()`, `findAllByUser()`, `findAllByGuild()`, `existsByUserAndGuild()` |
| **ChannelRepository.java** | `findAllByGuild()` |
| **MessageRepository.java** | `findByChannelOrderByCreatedAtDesc(Pageable)`, `findByDmThreadOrderByCreatedAtDesc(Pageable)` |
| **DirectMessageRepository.java** | `findByUser1AndUser2()`, `findAllByUser1OrUser2()` |
| **AttachmentRepository.java** | `findByMessage()` |

---

### Phase 4: Security & Authentication

#### [NEW] `config/SecurityConfig.java`
- `SecurityFilterChain` bean
- Disable CSRF (stateless API)
- Permit `/api/auth/**` endpoints
- All other endpoints require authentication
- Add `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`
- `BCryptPasswordEncoder` bean
- CORS configuration for frontend origin

#### [NEW] `security/JwtService.java`
- Generate access token (15 min TTL)
- Generate refresh token (7 day TTL)
- Extract username/claims from token
- Validate token (signature + expiry + not in blocklist)
- Uses `io.jsonwebtoken` (jjwt) library

#### [NEW] `security/JwtAuthenticationFilter.java`
- `OncePerRequestFilter`
- Extract `Authorization: Bearer <token>` header
- Validate via `JwtService`
- Check Redis blocklist
- Set `SecurityContextHolder` authentication

#### [NEW] `security/CustomUserDetailsService.java`
- Implements `UserDetailsService`
- Loads user from `UserRepository`

#### [NEW] `service/TokenBlacklistService.java`
- `blacklist(token, remainingTTL)` → stores in Redis
- `isBlacklisted(token)` → checks Redis
- Uses `StringRedisTemplate`

#### DTOs (under `dto/auth/`)
| File | Fields |
|------|--------|
| **RegisterRequest.java** | username, email, password |
| **LoginRequest.java** | username, password |
| **AuthResponse.java** | accessToken, refreshToken, username, userId |
| **RefreshRequest.java** | refreshToken |

#### [NEW] `controller/AuthController.java`
| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/auth/register` | register | Create user, return tokens |
| `POST /api/auth/login` | login | Validate credentials, return tokens |
| `POST /api/auth/refresh` | refresh | Issue new access token |
| `POST /api/auth/logout` | logout | Blocklist current token in Redis |

#### [NEW] `service/AuthService.java`
Business logic for registration, login, token refresh, and logout.

---

### Phase 5: Guild & Channel Management

#### DTOs (under `dto/guild/`)
| File | Fields |
|------|--------|
| **CreateGuildRequest.java** | name, iconUrl (optional) |
| **GuildResponse.java** | id, name, iconUrl, inviteCode, ownerUsername, memberCount |
| **ChannelRequest.java** | name, topic (optional) |
| **ChannelResponse.java** | id, name, topic, guildId |
| **GuildMemberResponse.java** | userId, username, avatarUrl, role, joinedAt |

#### [NEW] `service/GuildService.java`
- `createGuild(user, request)` — creates guild + default "general" channel + OWNER membership
- `joinGuild(user, inviteCode)` — validates invite, creates MEMBER entry
- `getGuildsForUser(user)` — returns all guilds user belongs to
- `getGuildMembers(guildId)` — returns members list
- `regenerateInviteCode(user, guildId)` — OWNER only

#### [NEW] `service/ChannelService.java`
- `createChannel(user, guildId, request)` — OWNER only
- `getChannels(guildId)` — list channels for a guild
- `deleteChannel(user, guildId, channelId)` — OWNER only, can't delete last channel

#### [NEW] `controller/GuildController.java`
| Endpoint | Method |
|----------|--------|
| `POST /api/guilds` | Create guild |
| `GET /api/guilds` | List user's guilds |
| `GET /api/guilds/{id}` | Get guild details |
| `POST /api/guilds/join/{inviteCode}` | Join via invite |
| `GET /api/guilds/{id}/members` | List members |
| `POST /api/guilds/{id}/invite/regenerate` | Regenerate invite |

#### [NEW] `controller/ChannelController.java`
| Endpoint | Method |
|----------|--------|
| `POST /api/guilds/{guildId}/channels` | Create channel |
| `GET /api/guilds/{guildId}/channels` | List channels |
| `DELETE /api/guilds/{guildId}/channels/{channelId}` | Delete channel |

---

### Phase 6: Real-Time Messaging (WebSocket + Redis Pub/Sub)

#### [NEW] `config/WebSocketConfig.java`
- Implements `WebSocketMessageBrokerConfigurer`
- Enable STOMP over SockJS at `/ws`
- Application destination prefix: `/app`
- Topic broker prefix: `/topic`
- Configure allowed origins

#### [NEW] `config/RedisConfig.java`
- `RedisMessageListenerContainer` bean
- `RedisTemplate<String, String>` bean
- Channel-based message listener registration

#### [NEW] `dto/message/MessageRequest.java`
- content, channelId (or dmThreadId)

#### [NEW] `dto/message/MessageResponse.java`
- id, content, senderUsername, senderAvatarUrl, channelId, edited, createdAt, attachment (optional)

#### [NEW] `service/MessageService.java`
- `sendMessage(user, request)` — persist to DB → publish to Redis → fan out via STOMP
- `editMessage(user, messageId, newContent)` — owner only
- `deleteMessage(user, messageId)` — owner only
- `getChannelMessages(channelId, page, size)` — paginated history
- `getDmMessages(dmThreadId, page, size)` — paginated history

#### [NEW] `controller/ChatController.java` (WebSocket)
- `@MessageMapping("/chat.send")` — receive message via STOMP
- `@MessageMapping("/chat.edit")` — edit message
- `@MessageMapping("/chat.delete")` — delete message

#### [NEW] `controller/MessageRestController.java` (REST)
| Endpoint | Method |
|----------|--------|
| `GET /api/channels/{channelId}/messages?page=0&size=50` | Message history |
| `GET /api/dm/{threadId}/messages?page=0&size=50` | DM history |

#### [NEW] `service/RedisMessagePublisher.java`
- Publishes serialized message to Redis channel topic

#### [NEW] `service/RedisMessageSubscriber.java`
- Listens on Redis channels → broadcasts to STOMP `/topic/channel/{id}`

---

### Phase 7: Direct Messages

#### DTOs (under `dto/dm/`)
| File | Fields |
|------|--------|
| **CreateDmRequest.java** | targetUsername |
| **DmThreadResponse.java** | id, otherUser (username, avatarUrl), lastMessage, lastMessageAt |

#### [NEW] `service/DirectMessageService.java`
- `getOrCreateDmThread(user, targetUsername)` — find existing or create new
- `getDmThreadsForUser(user)` — list all DM conversations
- Messages reuse `MessageService` with `dmThread` instead of `channel`

#### [NEW] `controller/DirectMessageController.java`
| Endpoint | Method |
|----------|--------|
| `POST /api/dm` | Start/get DM thread |
| `GET /api/dm` | List user's DM threads |

---

### Phase 8: File Uploads (Cloudinary)

#### [NEW] `config/CloudinaryConfig.java`
- `Cloudinary` bean configured with cloud name, API key, and API secret
- Reads credentials from `application.properties`

#### [NEW] `service/FileStorageService.java`
- `uploadFile(MultipartFile)` — upload to Cloudinary, return secure URL + publicId
- `deleteFile(publicId)` — remove from Cloudinary by publicId
- Auto-detects resource type (image, video, raw) for proper Cloudinary handling
- Validates file type and size

#### [NEW] `controller/FileController.java`
| Endpoint | Method |
|----------|--------|
| `POST /api/files/upload` | Upload file, return Cloudinary URL |

#### [NEW] `dto/file/FileUploadResponse.java`
- fileUrl, publicId, fileName, fileType, fileSize

---

## File Structure (Final)

```
src/main/java/com/synapse/chat_application/
├── ChatApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── WebSocketConfig.java
│   ├── RedisConfig.java
│   └── CloudinaryConfig.java
├── security/
│   ├── JwtService.java
│   ├── JwtAuthenticationFilter.java
│   └── CustomUserDetailsService.java
├── entity/
│   ├── User.java
│   ├── Guild.java
│   ├── GuildMember.java
│   ├── Channel.java
│   ├── Message.java
│   ├── DirectMessage.java
│   ├── Attachment.java
│   └── Role.java
├── repository/
│   ├── UserRepository.java
│   ├── GuildRepository.java
│   ├── GuildMemberRepository.java
│   ├── ChannelRepository.java
│   ├── MessageRepository.java
│   ├── DirectMessageRepository.java
│   └── AttachmentRepository.java
├── dto/
│   ├── auth/
│   │   ├── RegisterRequest.java
│   │   ├── LoginRequest.java
│   │   ├── AuthResponse.java
│   │   └── RefreshRequest.java
│   ├── guild/
│   │   ├── CreateGuildRequest.java
│   │   ├── GuildResponse.java
│   │   ├── ChannelRequest.java
│   │   ├── ChannelResponse.java
│   │   └── GuildMemberResponse.java
│   ├── message/
│   │   ├── MessageRequest.java
│   │   └── MessageResponse.java
│   ├── dm/
│   │   ├── CreateDmRequest.java
│   │   └── DmThreadResponse.java
│   └── file/
│       └── FileUploadResponse.java
├── service/
│   ├── AuthService.java
│   ├── TokenBlacklistService.java
│   ├── GuildService.java
│   ├── ChannelService.java
│   ├── MessageService.java
│   ├── DirectMessageService.java
│   ├── FileStorageService.java
│   ├── RedisMessagePublisher.java
│   └── RedisMessageSubscriber.java
├── controller/
│   ├── AuthController.java
│   ├── GuildController.java
│   ├── ChannelController.java
│   ├── ChatController.java
│   ├── MessageRestController.java
│   ├── DirectMessageController.java
│   └── FileController.java
└── exception/
    ├── GlobalExceptionHandler.java
    ├── ResourceNotFoundException.java
    ├── UnauthorizedException.java
    └── BadRequestException.java
```

---

## Open Questions

1. **Redis Cloud credentials**: Please share your Redis Cloud host, port, and password (or I'll add placeholders for you to fill in).
2. **Cloudinary credentials**: Please share your Cloudinary cloud name, API key, and API secret (or placeholders).
3. **CORS origins**: What will be the frontend URL? (e.g., `http://localhost:3000`)?
4. **Should I also build the frontend** after the backend is complete?

---

## Verification Plan

### Automated Tests
- `mvn compile` — ensure all code compiles cleanly
- `mvn test` — run the default Spring Boot test suite
- Entity validation: Spring Boot startup will auto-create tables via `ddl-auto=update`

### Manual Verification
- **Auth flow**: Register → Login → Access protected endpoint → Refresh → Logout
- **Guild flow**: Create guild → Get invite code → Join guild → List channels
- **Messaging**: Connect WebSocket → Send message → Verify delivery + persistence
- **File upload**: Upload file → Verify Cloudinary storage → Verify URL in response
- Test all REST endpoints via a tool like Postman or `curl`
