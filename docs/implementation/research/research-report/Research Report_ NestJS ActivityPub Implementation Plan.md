---
sidebar_position: 1
title: "Implementation Plan"
---

# **Research Report: Building a High-Fidelity NestJS ActivityPub Server: A Developer Implementation Plan**

## **I. Executive Summary**

This report delineates a high-fidelity developer implementation plan for constructing a robust and performant ActivityPub server using the NestJS framework. The objective is to provide a block-by-block guide, enabling a single developer to build a fully functional system with inherent scalability and reliability. The architecture emphasizes a modular approach, leveraging NestJS's core strengths in dependency injection and TypeScript to manage the complexities of a federated, distributed social networking protocol. Key considerations include efficient data modeling with PostgreSQL and JSONB, asynchronous activity processing via message queues (RabbitMQ and BullMQ), advanced caching strategies with Redis, robust HTTP signature verification, and a comprehensive data retention policy. The proposed solution addresses common challenges in ActivityPub implementations, such as fan-out on write, URI canonicalization, object deduplication, and distributed consistency, ensuring a highly performant and reliable federated instance.

## **II. Foundations: Understanding ActivityPub and NestJS**

### **ActivityPub Core Concepts**

ActivityPub stands as a decentralized social networking protocol, fundamentally built upon the ActivityStreams 2.0 data format and JSON-LD.1 This protocol operates on two primary layers: a client-to-server (C2S) API, facilitating user-facing applications in creating, updating, and deleting content, and a federated server-to-server (S2S) protocol, enabling the seamless delivery of notifications and content between disparate instances.1  
The protocol defines three foundational data types that underpin all interactions: Objects, Activities, and Actors.1  
Objects represent the most common data type, encompassing a wide array of content from images and videos to more abstract concepts such as locations or events.1  
Activities describe actions initiated by an actor, including Create (for new content), Like, Follow, Announce (for boosting or reblogging content), and Undo.1  
Actors, in turn, are entities capable of performing these activities, ranging from individuals (Person) and groups (Group) to applications (Application) or services (Service).1 Each  
Actor is characterized by an inbox for receiving messages and an outbox for sending messages, typically exposed as URLs within their ActivityStreams description.2 Furthermore, ActivityPub defines various  
Collections, such as Inbox, Outbox, Followers, Following, and Liked, many of which are mandated to be OrderedCollections to maintain chronological consistency.2

### **The Role of JSON-LD in ActivityPub Data Modeling**

ActivityPub's reliance on ActivityStreams 2.0 is intrinsically linked to its foundation in JSON-LD.1 JSON-LD serves as a mechanism for embedding semantic meaning into existing JSON data structures, thereby facilitating the principles of Linked Data.2 This architectural choice provides a robust framework for extensibility, empowering implementers to define and utilize new vocabulary terms beyond the core specification.2  
For straightforward implementations, JSON-LD documents might initially appear to be treatable as plain JSON.2 However, achieving full specification compliance, especially when integrating extensions or handling complex, interconnected data, necessitates proper JSON-LD parsing and serialization. This is because JSON-LD processors are designed to handle  
context resolution, a critical function for correctly interpreting extended vocabularies and ensuring data consistency through canonicalization. The correct interpretation of context is paramount for understanding the semantic relationships within the data. Without it, custom properties or types from other instances might be misinterpreted or lost, leading to interoperability failures. Furthermore, accurate deduplication of activities and objects becomes challenging without a canonical representation, which proper JSON-LD expansion and compaction provide. This deeper understanding of JSON-LD's role is not merely a technical detail but a strategic imperative for ensuring the server can accurately and efficiently process the rich, extensible data inherent in the ActivityPub network, directly contributing to the system's overall reliability and performance.  
To support this, several Node.js libraries are available. jsonld.js offers a comprehensive implementation of the JSON-LD 1.1 specification 8, while  
jsonld-streaming-parser.js provides a fast, lightweight, and spec-compliant streaming parser capable of outputting RDFJS quads and managing remote contexts efficiently.11 Additionally,  
jsonld-request can streamline the process of loading JSON-LD data from various sources.12 The  
activitystrea.ms npm package further aids in the creation and consumption of ActivityStreams 2.0 objects, though it does not inherently manage data persistence.13

### **NestJS Architectural Principles**

NestJS is a robust, progressive Node.js framework engineered for the development of efficient, scalable, and testable server-side applications. Its foundation in TypeScript, coupled with its embrace of Object-Oriented Programming (OOP), Functional Programming (FP), and Functional Reactive Programming (FRP), positions it as a powerful tool for complex system design.14  
The framework's core architectural tenets—modularity, dependency injection (DI), and TypeScript integration—are not merely general best practices; they are profoundly advantageous for constructing a distributed and federated ActivityPub server.

* **Modular Design:** Modularity is a cornerstone of NestJS, advocating for the decomposition of applications into smaller, independent modules. Each module encapsulates related controllers, providers (services, guards, etc.), fostering a clear separation of concerns, enhancing code reusability, and simplifying maintenance.14 A typical project structure involves a  
  src/modules directory for distinct features (e.g., users, auth, activitypub) and a common directory for shared components.17 This modular approach inherently supports a microservices-oriented architecture. ActivityPub's "fan-out on write" model, where a single activity is distributed to numerous remote inboxes, is an inherently distributed and asynchronous operation that can lead to significant write amplification and CPU-intensive processing.18 By segmenting the ActivityPub server into independent services—such as an "inbox processing" service, an "outbox delivery" service, or an "actor profile" service—NestJS's modularity enables horizontal scaling of individual components based on their specific workload demands. This prevents bottlenecks in one area from cascading and affecting the entire system, which is crucial for achieving high performance.  
* **Dependency Injection (DI):** NestJS's integrated DI system meticulously manages the lifecycle of objects and their dependencies, resulting in loosely coupled components that are easier to test, maintain, and extend.14 In a distributed system, managing numerous external dependencies—such as databases, message queues, and external HTTP calls to other Fediverse instances—is a complex undertaking. NestJS's DI simplifies this by facilitating the easy mocking of these external services for robust testing. It also allows for flexible swapping of implementations (e.g., different Redis clients, alternative RabbitMQ configurations) without necessitating extensive code modifications. This flexibility significantly enhances the system's resilience to environmental changes or issues with external services, directly contributing to its overall reliability.  
* **TypeScript Integration:** The framework's TypeScript-first philosophy provides comprehensive type safety across the entire application, from database models to API contracts, substantially mitigating runtime errors.19 ActivityPub and ActivityStreams 2.0 define a rich, interconnected data model.5 TypeScript's static type checking proves invaluable in enforcing the correct data structures for  
  Actors, Objects, and Activities throughout the application lifecycle. This practice reduces a class of runtime errors that are particularly challenging to diagnose and rectify in an asynchronous, distributed environment. By catching type-related issues at compile-time rather than runtime, TypeScript directly contributes to the high reliability of the system.  
* **Project Structure and Configuration Best Practices:** A well-organized directory structure is highly recommended, incorporating src/modules, common (for filters, interceptors, guards, pipes), config (for environment and database settings), dto (Data Transfer Objects for validation), middlewares, test, and utils.15 Consistent file naming conventions, such as  
  users.controller.ts or create-user.dto.ts, significantly enhance code readability and maintainability.17 Configuration management is streamlined through the  
  @nestjs/config package, which supports .env files, custom file paths, global module availability, and schema validation with Joi, ensuring type-safe and robust configuration loading.22

The selection of NestJS is not merely a preference for a particular framework; it represents a strategic architectural decision that aligns with and actively supports the complex, distributed nature of ActivityPub. This foundation enables the development of a truly high-performance and reliable federated server.

## **III. Core Server Setup and User Management**

### **NestJS Project Initialization**

The initial step in the implementation involves generating a new NestJS application using the Nest CLI, executed via the command nest new \<project-name\>.24 The resulting project structure will strictly adhere to modular best practices, organizing code into distinct feature modules within  
src/modules (e.g., users, auth, activitypub). A common directory will house shared components such as filters, interceptors, guards, and pipes, while a config directory will manage environment-specific settings and database configurations.15  
Environment configuration will be managed through the @nestjs/config package, installed using npm install @nestjs/config.22 The  
ConfigModule will be initialized in app.module.ts with `ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.development' })`. This configuration ensures environment variables are globally accessible throughout the application and allows for loading specific .env files tailored to different environments.23 For more intricate configurations, custom configuration files, such as  
config/database.config.ts, will be employed to return nested configuration objects. This approach enables logical grouping of settings and facilitates type-safe injection using ConfigType.23 To enhance robustness, environment variable validation will be enforced using Joi schema validation within  
ConfigModule.forRoot, ensuring that any missing or incorrect values are identified and flagged early during the application's startup phase.23

### **User Authentication and Authorization**

A secure and robust user management system is paramount for any social platform.

* **User Entity Design:** A User entity will be meticulously defined using TypeORM's @Entity decorator. This entity will encapsulate essential user attributes, including a primary key id, username, email, and password.20 Critically, the  
  password field will be specifically designated to store only the hashed representation of the user's password, never the plain text, to uphold stringent security standards.25  
* **Password Hashing:** The bcrypt library, installed via npm install bcrypt, will be integrated for secure password hashing.25 Within the  
  UserService or AuthService, a dedicated function, such as bcrypt.hash(password, 10), will handle the hashing process. A corresponding comparison function, bcrypt.compare(plainText, hashed), will be implemented to securely verify user credentials during authentication. A carefully selected cost factor, typically 10, will be applied to the hashing algorithm to strike an optimal balance between the computational expense of generating a hash (security strength) and the performance of the login process.25  
* **Registration and Login Endpoints:** An AuthModule, comprising an AuthService and AuthController, will be generated to manage authentication flows.29 Core user operations will be encapsulated within a separate  
  UsersModule and UsersService.29 A registration endpoint (  
  POST /auth/register) will be implemented to hash the user's password prior to persisting the new user record in the database.25 Conversely, a login endpoint (  
  POST /auth/login) will validate user credentials by invoking AuthService.validateUser.27 Upon successful authentication, a JSON Web Token (JWT) will be issued using the  
  @nestjs/jwt package. The JWT payload will adhere to standard practices, including the userId (mapped to sub for JWT standard compliance) and username.27  
* **Authentication Guards and JWT Strategy:** The @nestjs/passport package, in conjunction with passport-local and passport-jwt, will be installed to manage authentication strategies.27 A  
  LocalStrategy, extending PassportStrategy(Strategy), will be implemented to handle the initial username/password validation during the login sequence.27 Subsequently, a  
  JwtStrategy will be created to validate incoming JWT tokens on all subsequent authenticated requests. This strategy will extract the userId from the token and can perform a database lookup if additional user details are required.27 The  
  @UseGuards(AuthGuard('jwt')) decorator will be applied to protect API routes, ensuring that only requests accompanied by a valid JWT are processed.29 Guards operate early in the request lifecycle, executing after all middleware but prior to any interceptors or pipes.33 To streamline access to authenticated user data, custom parameter decorators, such as  
  @User(), can be developed. This allows for direct retrieval of user attributes (e.g., userId, username) from the request object within controllers, enhancing code readability and maintainability.27

### **WebFinger Endpoint Implementation**

WebFinger (RFC 7033\) is a pivotal protocol for the discovery of information pertaining to ActivityPub entities. Its primary function is to resolve a user's "account URI" (e.g., acct:user@domain) into their canonical ActivityPub actor URI.35 The server will implement a  
GET /.well-known/webfinger endpoint to fulfill this role.36 This endpoint will respond with a JSON Resource Descriptor (JRD), a JSON object containing descriptive information about the queried entity. The JRD will include a  
links array, crucially featuring a self link that points to the actor's full profile URL.36 Prominent ActivityPub implementations, such as Mastodon, extensively utilize this endpoint for user discovery across the federated network.37

### **Actor Profile Endpoint (GET)**

An ActivityPub actor's profile is identified by a publicly dereferencable URI, implying that its representation can be retrieved through a standard HTTP GET request.2 A dedicated  
GET /actors/:id (or a similar URI structure adhering to ActivityPub conventions) endpoint will be implemented to serve the Actor object. This object can represent various types of entities, including a Person, an Application, or a Service.40  
The Actor object will expose several essential properties vital for federation and interaction. These include inbox (the endpoint for receiving activities), outbox (the endpoint for publishing activities), followers (a collection of followers), following (a collection of followed actors), and, critically, publicKey.6 The  
publicKey property itself contains the id of the key and the publicKeyPem (the PEM-encoded public key string), which is indispensable for verifying HTTP Signatures on incoming federated requests.41  
Content negotiation will be a key feature of this endpoint, leveraging the HTTP Accept header to serve different representations of the actor profile based on the requesting client. Specifically, the endpoint should respond with application/activity+json or application/ld+json when the request originates from other ActivityPub servers, ensuring machine-readable data exchange. Concurrently, it will serve text/html for standard web browsers, providing a human-readable profile page.39  
The robust implementation of user management and WebFinger, coupled with the Actor Profile endpoint, establishes the foundational layer for ActivityPub's decentralized identity. The intricate interplay between the acct:user@domain format (resolved via WebFinger) and the actor's id URI (served by the Actor Profile) necessitates strict URI canonicalization. Any inconsistencies in how these identifiers are resolved or stored can severely disrupt federation, leading to broken links and communication failures across the network. This highlights a critical need for internal application logic to consistently normalize URIs, extending beyond what the database inherently stores. For example, variations like trailing slashes or differing case in URIs, while seemingly minor, can cause distinct interpretations by different servers if not normalized.44 This is not merely an SEO best practice but a fundamental requirement for establishing unique object identity and enabling accurate deduplication in a distributed system. Without consistent URI canonicalization, a server might fail to recognize two identical objects as the same, leading to redundant storage and inefficient processing. The implication is that the server must implement a URI normalization layer that ensures all incoming and outgoing URIs conform to a single, consistent representation before storage or comparison. This is a prerequisite for reliable object deduplication and maintaining a coherent federated graph.

## **IV. Data Storage and Persistence**

The selection of a robust and scalable database solution is paramount for an ActivityPub server, given the dynamic and interconnected nature of its data.

### **Database Choice: PostgreSQL with JSONB**

PostgreSQL is chosen as the primary database due to its strong support for structured data, ACID compliance, and advanced indexing capabilities, which are crucial for data integrity in a federated environment.47 Its  
JSONB data type is particularly well-suited for storing ActivityPub objects, Activities, and Actors.4  
JSONB offers schema flexibility, allowing the storage of semi-structured data and nested objects without requiring frequent schema migrations for evolving ActivityPub vocabularies.49 This flexibility is essential as ActivityPub leverages JSON-LD for extensibility, enabling the definition of new properties and object types.2 While  
JSON preserves original formatting, JSONB is optimized for faster processing and querying of JSON data.48  
For optimal performance, a hybrid approach combining traditional columns with JSONB is recommended. Frequently accessed and stable properties (e.g., id, type, published date) should be stored in dedicated columns, while the more variable and nested ActivityPub payload can reside in a JSONB column.48

### **TypeORM Integration and Schema Design**

TypeORM, a powerful Object-Relational Mapper (ORM) for Node.js and TypeScript, will be used to interact with PostgreSQL.51 It supports both DataMapper and ActiveRecord patterns, offering flexibility in entity definition and database operations.51

* **Entity Definition:** Entities will be defined using TypeORM's @Entity decorator, mapping classes to database tables.19 Columns will be defined with  
  @Column, specifying data types and options like unique or nullable.26 Primary keys will typically use  
  @PrimaryGeneratedColumn for auto-incrementing integers or UUIDs, depending on the specific entity's needs.20 For ActivityPub objects, considering the URI as the canonical identifier, a dedicated  
  uri column (e.g., VARCHAR or TEXT) with a unique index is essential for efficient lookup and deduplication.52 While UUIDs offer global uniqueness for sharding, their random nature can lead to index fragmentation and slower sorting compared to sequential integers. If UUIDs are used as primary keys, native database UUID types should be preferred over plain strings for storage efficiency and performance.54 For external references, using a UUID as a secondary unique identifier alongside an internal integer primary key can offer both efficiency and obfuscation.54  
* **JSONB Column Usage:** A JSONB column will be added to relevant entities (e.g., Activity, Object) to store the full ActivityPub JSON-LD payload. For example: `@Column({ type: 'jsonb' })` data: object;.4  
* **Indexing JSONB Columns:** To efficiently query data within JSONB columns, PostgreSQL's Generalized Inverted Indexes (GIN) are crucial.10 GIN indexes are particularly effective for queries involving existence operators (  
  ?, ?|, ?&) and path operators (@\>, \<@) on JSONB data.10  
  * A general GIN index can be created on the entire JSONB column: CREATE INDEX index\_name ON table\_name USING GIN(jsonb\_column);.55  
  * For queries optimized for subset/superset operators (@\>), the jsonb\_path\_ops operator class can be used for a smaller and faster index: CREATE INDEX index\_name ON table\_name USING GIN(jsonb\_column jsonb\_path\_ops);.55  
  * For frequent queries on specific nested fields within the JSONB, an expression index can be created: CREATE INDEX index\_name ON table\_name USING GIN((data-\>'field\_name'));.55  
  * TypeORM migrations can be used to add these custom GIN indexes, ensuring synchronize: false is set on the @Index decorator to prevent TypeORM from dropping them during schema synchronization.58  
* **Querying JSONB:** TypeORM's QueryBuilder can be used to construct complex queries, although direct SQL for JSONB operators might be necessary for advanced cases.10  
* **Polymorphic Associations:** ActivityPub's data model inherently involves polymorphic relationships (e.g., an Activity can act on various Object types like Note, Image, Video).1 While TypeORM doesn't natively support polymorphic associations with decorators, libraries like  
  typeorm-polymorphic can be integrated.62 This library allows defining parent and child entities with  
  @PolymorphicChildren and @PolymorphicParent decorators, respectively, and requires including the custom repository in TypeOrmModule.forFeature.62 Alternatively, a manual approach using separate foreign key columns for each possible related entity, coupled with a  
  CHECK constraint to ensure only one is non-null, can be implemented, though this requires manual migration adjustments.63

### **Data Retention and Garbage Collection**

Managing data retention and garbage collection is critical for maintaining performance and controlling storage costs in a federated ActivityPub instance, which can accumulate vast amounts of data over time.64

* **Policy Definition:** A clear data retention policy must be defined, categorizing data (e.g., user activities, remote objects, ephemeral messages) and assigning specific retention periods based on legal obligations, business value, and performance needs.64 For instance, older, less relevant data can be purged, while critical user-generated content might be retained indefinitely or archived.2  
* **Soft Deletion:** For user-generated content or objects that might need to be "undeleted" or whose deletion should be propagated as an ActivityPub Delete activity, soft deletion is recommended. TypeORM supports soft deletes using the @DeleteDateColumn decorator on an entity (e.g., deletedAt?: Date;). When this column is present, all reads from the TypeORM repository will automatically add a WHERE clause checking that deletedAt IS NULL.67 Services can be configured with  
  useSoftDelete: true to ensure that softRemove or softDelete methods are used.67 This approach allows for logical deletion without immediate physical removal, which can be useful for eventual consistency requirements in a federated network.  
* **Scheduled Pruning (Hard Deletion):** To permanently remove data after its retention period, scheduled tasks will perform hard deletions. NestJS's @nestjs/schedule package can be used to define cron jobs for this purpose.68  
  * A TasksModule will be created with ScheduleModule.forRoot().69  
  * A TasksService will contain methods decorated with @Cron() (e.g., 0 0 \* \* \* for daily cleanup) to execute pruning logic.68  
  * The pruning logic will identify records marked for soft deletion (e.g., deletedAt IS NOT NULL) and older than a specified threshold. TypeORM's QueryBuilder can be used for efficient batch hard deletions to avoid N+1 query issues: await connection.`createQueryBuilder().delete().from(Entity).where("deletedAt \< :threshold", { threshold }).execute();`.70  
  * For large tables, PostgreSQL partitioning (e.g., by date range or hash) can be considered to improve pruning efficiency. Dropping old partitions is significantly faster than deleting individual rows from a large table.8  
* **Object Deduplication:** ActivityPub servers MUST perform deduplication of activities received in the inbox by comparing activity ids.2 This is crucial to prevent redundant storage and processing, especially when an activity is addressed to multiple recipients on the same instance.73  
  * **Content Hashing:** For objects, a content hashing strategy (e.g., SHA-256) can generate a unique fingerprint for each object's payload.2 This hash can be stored alongside the object's URI. Before storing a new object, its hash can be computed and checked against existing hashes. If a match is found, the object is already present, and only a reference or pointer needs to be maintained, reducing storage and processing overhead.73 This is particularly beneficial for media attachments or frequently shared content.  
  * **URI Canonicalization:** As previously discussed, strict URI canonicalization is a prerequisite for effective deduplication. All incoming ActivityPub URIs (for id, url, attributedTo, object, etc.) must be normalized to a consistent format (e.g., lowercase, no trailing slashes, decoded URL encoding) before hashing or comparison to ensure that logically identical URIs are treated as such.44 This ensures that  
    https://example.com/note/1 and https://example.com/note/1/ are recognized as the same object.

## **V. ActivityPub Endpoints and Federation**

Implementing the ActivityPub endpoints is central to enabling both client-to-server (C2S) and server-to-server (S2S) communication.

### **Inbox Endpoint (POST)**

The Inbox endpoint is where an ActivityPub server receives activities from other federated instances or local clients.2 It is typically discovered via the  
inbox property of an actor's profile and MUST be an OrderedCollection.2

* **Request Handling:** The Inbox accepts HTTP POST requests with ActivityStreams 2.0 JSON-LD payloads.2  
  * **Raw Body Access:** For HTTP Signature verification, the raw request body is essential. NestJS allows access to the raw body by enabling rawBody: true in NestFactory.create and using RawBodyRequest in controllers.76 Custom parameter decorators can simplify accessing this raw body.34  
  * **JSON-LD Parsing and Validation:** Incoming payloads must be parsed as JSON-LD. The jsonld-streaming-parser.js library can be used to process incoming streams of JSON-LD data, emitting RDFJS-compliant quads.11 This ensures correct interpretation of contexts and extensions. Validation against ActivityStreams 2.0 vocabulary and any custom extensions is critical to ensure data integrity.5  
  * **HTTP Signature Verification:** Incoming POST requests from other federated servers MUST be verified using HTTP Signatures.77 The  
    activitypub-http-signatures npm package provides functionality for parsing and verifying signatures based on RFC 9421\.79 This involves:  
    1. Extracting the Signature header and its keyId parameter.79  
    2. Fetching the public key from the keyId URL (which typically points to the sender's actor profile).79 This public key is usually embedded in the actor's  
       publicKey property as publicKeyPem.41  
    3. Verifying the signature using the retrieved public key against the canonicalized request components (e.g., (request-target), host, date, digest) and the raw body.79  
    4. Requests with missing or invalid signatures should be rejected with appropriate HTTP status codes (401 Unauthorized or 403 Forbidden).77  
    * **Public Key Caching:** To optimize performance, public keys of remote actors should be cached (e.g., in Redis) after initial retrieval.81 A "refresh on fail" strategy is recommended: attempt validation with the cached key, and if it fails, re-fetch the key from the source before retrying validation.81 Periodic refresh of keys (e.g., every 48 hours) can also help maintain up-to-date metadata and prevent issues with compromised old keys.81  
* **Activity Processing and Fan-out on Write:** After successful verification, the incoming activity is processed. ActivityPub implementations typically perform server-side side-effects based on the activity type (e.g., a Like increments a counter, a Follow updates follower lists).3  
  * **Asynchronous Processing with Message Queues:** To ensure high performance and reliability, especially for the "fan-out on write" pattern, activity processing should be offloaded to a message queue system like RabbitMQ or BullMQ (backed by Redis).18  
    * Upon receiving a valid activity, the Inbox endpoint will enqueue a message to a primary queue (e.g., activity\_inbox\_queue). This allows the HTTP request to return quickly, improving UI responsiveness.18  
    * NestJS microservices with RabbitMQ provide a robust transport layer for this.84 A  
      ClientsModule can be configured to send messages to RabbitMQ queues.84  
    * **Fan-out Implementation:** The "fan-out on write" (push model) is efficient for low-latency reads, precomputing data for followers' feeds.18 However, it can be resource-intensive for actors with large follower counts (e.g., "celebrity problem").18  
      * A hybrid approach is optimal: push updates to most followers' feeds immediately, but for high-activity users or those with massive follower counts, index updates and use a "pull model" on read.18  
      * BullMQ (with @nestjs/bullmq) is an excellent choice for managing these background jobs.4 A "fan-out service" can enqueue individual delivery tasks for each recipient.83  
      * BullMQ supports features like rate-limiting, job retries with exponential backoff, and scheduling.4 This ensures resilience against temporary network failures or recipient server issues. Failed messages can be automatically re-queued or sent to a Dead Letter Queue (DLQ) for further inspection.84  
      * BullMQ Pro offers "groups" functionality, allowing jobs to be processed in a round-robin fashion among users, which can be beneficial for distributing load in fan-out scenarios.93

### **Outbox Endpoint (POST)**

The Outbox endpoint is where local clients publish activities to be distributed to the federated network.2 It is discovered via the  
outbox property of an actor's profile and MUST be an OrderedCollection.2

* **Activity Creation and Wrapping:** When a client sends a non-activity object (e.g., a Note), the server SHOULD automatically wrap it in a Create activity.2 This ensures all content is distributed as an  
  Activity.  
* **Addressing and Delivery:** The server is responsible for addressing new activities to appropriate recipients (e.g., followers, mentioned actors, public collection) using the to, bto, cc, bcc, and audience fields.2  
  * Similar to the Inbox, outgoing activity delivery will be handled asynchronously via a message queue (e.g., activity\_outbox\_queue) to prevent blocking the client request and ensure high throughput.18  
  * Each message in the queue will contain the activity payload and the list of recipient inboxes. A background worker will then process these messages, performing HTTP POST requests to the respective remote inboxes.18  
  * **Outgoing HTTP Signature Signing:** All outgoing POST requests to remote inboxes MUST be signed using HTTP Signatures.77 The  
    activitypub-http-signatures library can generate the Signature header, including (request-target), host, date, and digest of the body.79 The server's actor's private key (generated using Node.js  
    crypto module and stored securely) will be used for signing.39

### **Collections (GET)**

ActivityPub defines various collections (e.g., Inbox, Outbox, Followers, Following, Liked, Shares) that are typically OrderedCollections.2 These collections are retrieved via HTTP GET requests.

* **Pagination:** Collections, especially Outbox and Inbox, can grow very large and MUST support pagination.2 The implementation should provide mechanisms for clients to retrieve pages of items (e.g.,  
  first, last, next, prev links).52  
* **Filtering and Permissions:** Content returned from collections SHOULD be filtered according to the requesting party's permissions.2 For instance, an unauthenticated request to an  
  Outbox should only return Public posts.2  
* **Caching Collections:** To improve read performance for frequently accessed collections (e.g., public timelines, popular posts), caching strategies are essential. NestJS's @nestjs/cache-manager package with Redis can be used for this purpose.96  
  * The CacheModule can be configured to use Redis as a store.96  
  * @UseInterceptors(CacheInterceptor) can cache entire route responses, while CacheManager can be injected for manual caching and invalidation.96  
  * Cache invalidation is critical to prevent stale data. For collections that change frequently (e.g., Outbox on new posts), cache entries should be invalidated upon write operations (e.g., a new Create activity).102 Time-to-Live (TTL) can also be configured for cache entries.96

## **VI. Performance and Reliability Enhancements**

Achieving high performance and reliability in a distributed ActivityPub server requires a multi-faceted approach, integrating various architectural and technical optimizations.

### **Asynchronous Processing and Message Queues**

As detailed in the ActivityPub Endpoints section, the fan-out on write model is a significant performance challenge. Offloading these tasks to message queues is a primary strategy for high performance and reliability.

* **RabbitMQ for Message Brokering:** RabbitMQ is a lightweight, open-source message broker that supports multiple messaging protocols and can be deployed in distributed and federated configurations for high-scale, high-availability requirements.84 It supports various exchange types, including  
  fanout, topic, and direct, which are crucial for flexible message routing in a distributed system.84  
  * NestJS integrates with RabbitMQ via @nestjs/microservices, allowing the creation of microservices that listen to queues.84  
  * Message acknowledgements are critical for reliability: if a consumer dies without acknowledging a message, RabbitMQ re-queues it, ensuring no message loss.84  
  * Error handling in RabbitMQ microservices can be managed with RpcException and by listening to internal error events, allowing for proper retry or dead-letter strategies.84  
* **BullMQ for Background Job Processing:** BullMQ, built on Redis, is a robust library for managing job queues, offering features like rate-limiting, job retries, and scheduling.4  
  * It decouples components, increases reliability through retries and delays, and offloads long-running tasks from the main application thread.4  
  * Automatic retries with exponential backoff for failed jobs are configurable using the attempts and backoff options.4 This prevents transient failures from causing permanent data loss.  
  * Dead Letter Queues (DLQs) can be configured in RabbitMQ policies to capture messages that fail after all retries or cannot be processed, allowing for manual inspection and re-processing.91 This is a crucial aspect of system resilience.

### **Caching Strategies**

Caching is a powerful technique to enhance application performance by reducing database load and improving response times.96

* **Redis Integration with @nestjs/cache-manager:** Redis, known for its lightning-fast read/write operations, is an excellent choice for caching.97 NestJS's  
  @nestjs/cache-manager package provides a straightforward way to integrate Redis.96  
  * The CacheModule can be registered asynchronously with KeyvRedis to use Redis as the cache store.96  
  * **Remote Object Caching:** ActivityPub involves frequent fetching of remote objects (Actors, Activities, Notes) from other instances. Caching these remote objects locally can significantly reduce network requests and parsing overhead.2  
    * A dedicated service can be implemented to fetch remote ActivityPub objects, store them in Redis with a configurable TTL, and serve them from the cache on subsequent requests.97  
    * **Cache Invalidation:** For remote objects, a "refresh on fail" strategy (as discussed for public keys) can be employed: attempt to retrieve from cache, if not found or validation fails, fetch from source and update cache.81 ActivityPub's eventual consistency model means that immediate, strong consistency across all caches is not always required.107 However, a balance must be struck to ensure reasonable data freshness.  
    * For objects that are known to be updated, explicit cache invalidation (e.g., cacheManager.del(key)) should be triggered when an Update activity for that object is processed.96  
  * **Query Caching:** TypeORM offers query caching, which can be configured to reduce duplicate database reads. While direct cache(true) on every query builder might be cumbersome, custom repository extensions can automatically clear the cache before write operations to ensure data freshness.102

### **Database Scaling and Partitioning**

For very large ActivityPub instances, database scaling becomes critical.

* **Read Replicas:** To scale database reads, TypeORM can be configured with replication to use read replicas (slave databases) for queries, while writes remain on the master database.110 This offloads read-heavy operations, preventing the master from becoming a bottleneck. An interceptor-based approach in NestJS can automatically route read queries to slave databases, ensuring scalability and maintainability.110  
* **Declarative Partitioning (PostgreSQL):** For extremely large tables (e.g., Activities, Objects), PostgreSQL's declarative partitioning can significantly improve query performance and data management.8  
  * **Strategy:** Range partitioning (e.g., by published date or id range) is often suitable for time-series data like activities.8  
  * **Benefits:** Partition pruning allows PostgreSQL to skip irrelevant partitions during queries, reducing the amount of data scanned and improving index efficiency.8 It also simplifies data retention policies, as old partitions can be dropped quickly.8  
  * **Implementation:** This involves creating a "root" partitioned table and child tables for each partition. Primary keys must include the partition key columns.8 While TypeORM doesn't have direct decorator support for declarative partitioning, raw SQL migrations can be used to set up the partitioning scheme.111

## **VII. Security Considerations**

Security is paramount in a federated system, where trust is distributed and interactions occur across multiple independent instances.

### **HTTP Signatures**

HTTP Signatures provide message integrity and authenticity for ActivityPub communications, ensuring that messages originate from trusted sources and have not been tampered with.112

* **RFC 9421 Compliance:** The latest standard for HTTP Message Signatures is RFC 9421\.112 Implementations should aim for compatibility with this standard, although older draft versions may still be in use across the Fediverse.114  
* **Node.js Libraries:** The activitypub-http-signatures npm package is recommended for creating, parsing, and verifying HTTP signature headers.79 It provides  
  Sha256Signer for signing outgoing requests and Parser for verifying incoming requests.79  
* **Signing Outgoing Requests:** Outgoing POST and GET requests (if configured via a systemUser for GETs) must be signed with the actor's private key. The signature typically includes (request-target), host, date, and a digest of the body for POST requests.77  
  * Private keys should be securely stored and managed. Node.js's crypto module can generate RSA key pairs in PEM format.94  
* **Verifying Incoming Requests:** Incoming POST requests without valid HTTP signatures should be rejected (401 if missing, 403 if invalid).77 The verification process involves:  
  1. Parsing the Signature header.  
  2. Extracting the keyId from the signature.  
  3. Fetching the public key from the keyId URL (potentially from a cache).78  
  4. Using the public key to verify the signature against the request's components and raw body.79  
* **NestJS Guard for Verification:** A custom NestJS Guard can encapsulate the HTTP Signature verification logic. This guard, implementing CanActivate, would extract the raw request, fetch the public key, and perform the cryptographic verification before allowing the request to proceed to the controller.33 This ensures that all incoming federated activities are authenticated at an early stage of the request pipeline.

### **Access Control and Permissions**

Beyond authentication, granular access control is necessary to manage who can view or modify data.

* **Role-Based Access Control (RBAC):** Users can be assigned roles (e.g., admin, moderator, user). NestJS Guards can then be used to check user roles and permissions before allowing access to specific routes or operations.33  
* **ActivityPub Audience Targeting:** ActivityPub activities include properties like to, cc, bto, and bcc for audience targeting.1 The server must respect these properties when delivering activities to inboxes and when filtering content for clients requesting collections (e.g., only showing private posts to authorized users).2  
* **Blocklists:** Servers should honor recipient blocklists. If a local user has blocked a remote actor, incoming activities from that actor should be filtered or ignored for the blocking user.41

## **VIII. Conclusions and Recommendations**

The development of a high-performance and reliable ActivityPub server in NestJS, implementable by a single developer, is achievable through a strategic architectural approach and careful technology selection. The inherently distributed and eventually consistent nature of ActivityPub necessitates robust solutions for data management, asynchronous processing, and security.  
**Key Recommendations for Implementation:**

1. **Embrace NestJS Modularity and TypeScript:** Leverage NestJS's modular design to logically separate concerns into distinct services (e.g., InboxService, OutboxService, ActorService). This facilitates independent scaling and maintenance. The strong typing provided by TypeScript is crucial for maintaining data integrity across the complex ActivityStreams 2.0 and JSON-LD data models, significantly reducing runtime errors in a distributed environment.  
2. **Strategic Database Design with PostgreSQL and JSONB:** Utilize PostgreSQL's JSONB type for flexible storage of ActivityPub objects, accommodating schema evolution without frequent migrations. Combine JSONB with traditional columns for frequently queried fields. Implement GIN indexes on JSONB columns and expression indexes on specific nested fields for efficient querying.  
3. **Implement Robust Asynchronous Processing:** Offload all activity processing and fan-out operations to a message queue system. RabbitMQ for message brokering combined with BullMQ (backed by Redis) for background job management provides a resilient and scalable solution. Configure BullMQ with retries, exponential backoff, and dead-letter queues to ensure message delivery and handle failures gracefully.  
4. **Prioritize Comprehensive Caching:** Integrate Redis via @nestjs/cache-manager for extensive caching of remote ActivityPub objects and frequently accessed collections. Implement intelligent caching strategies, including TTL-based expiration and event-driven invalidation. A "refresh on fail" mechanism for public keys and remote objects is essential for balancing performance with data freshness.  
5. **Enforce Strict URI Canonicalization and Deduplication:** Implement a dedicated URI normalization layer within the application to ensure consistent representation of all ActivityPub identifiers. This is fundamental for accurate object identity, preventing redundant data storage, and enabling effective deduplication of activities and objects based on their canonical URIs or content hashes.  
6. **Integrate Strong Security Measures:** Implement HTTP Signature verification (RFC 9421\) for all incoming federated POST requests using libraries like activitypub-http-signatures and custom NestJS Guards. Securely manage private keys and ensure all outgoing requests are properly signed. Implement granular access control and respect ActivityPub's audience targeting and blocklist mechanisms.

By meticulously following this plan, a single developer can construct a high-performance and reliable ActivityPub server that effectively participates in the federated social web, laying a solid foundation for future expansion and feature development.

#### **Works cited**

1. ActivityPub \- Wikipedia, accessed July 18, 2025, [https://en.wikipedia.org/wiki/ActivityPub](https://en.wikipedia.org/wiki/ActivityPub)  
2. ActivityPub \- W3C, accessed July 18, 2025, [https://www.w3.org/TR/activitypub/](https://www.w3.org/TR/activitypub/)  
3. rwot5-boston/final-documents/activitypub-decentralized-distributed.md at master \- GitHub, accessed July 18, 2025, [https://github.com/WebOfTrustInfo/rwot5-boston/blob/master/final-documents/activitypub-decentralized-distributed.md](https://github.com/WebOfTrustInfo/rwot5-boston/blob/master/final-documents/activitypub-decentralized-distributed.md)  
4. ActivityPub Client API: A Way Forward \- Steve Bate, accessed July 18, 2025, [https://www.stevebate.net/activitypub-client-api-a-way-forward/](https://www.stevebate.net/activitypub-client-api-a-way-forward/)  
5. Activity Streams 2.0 \- W3C, accessed July 18, 2025, [https://www.w3.org/TR/activitystreams-core/](https://www.w3.org/TR/activitystreams-core/)  
6. ActivityPub/Primer/Actors \- W3C Wiki, accessed July 18, 2025, [https://www.w3.org/wiki/ActivityPub/Primer/Actors](https://www.w3.org/wiki/ActivityPub/Primer/Actors)  
7. ActivityPub/Primer/Activity Streams 2.0 \- W3C Wiki, accessed July 18, 2025, [https://www.w3.org/wiki/ActivityPub/Primer/Activity\_Streams\_2.0](https://www.w3.org/wiki/ActivityPub/Primer/Activity_Streams_2.0)  
8. digitalbazaar/jsonld.js: A JSON-LD Processor and API implementation in JavaScript \- GitHub, accessed July 18, 2025, [https://github.com/digitalbazaar/jsonld.js/](https://github.com/digitalbazaar/jsonld.js/)  
9. reading-activitypub \- Tiny Subversions, accessed July 18, 2025, [https://tinysubversions.com/notes/reading-activitypub/](https://tinysubversions.com/notes/reading-activitypub/)  
10. JSONB PostgreSQL: How To Store & Index JSON Data \- ScaleGrid, accessed July 18, 2025, [https://scalegrid.io/blog/using-jsonb-in-postgresql-how-to-effectively-store-index-json-data-in-postgresql/](https://scalegrid.io/blog/using-jsonb-in-postgresql-how-to-effectively-store-index-json-data-in-postgresql/)  
11. A fast and lightweight streaming JSON-LD parser for JavaScript \- GitHub, accessed July 18, 2025, [https://github.com/rubensworks/jsonld-streaming-parser.js/](https://github.com/rubensworks/jsonld-streaming-parser.js/)  
12. digitalbazaar/jsonld-request: LIbrary to load JSON-LD from stdin, URLs, or files. \- GitHub, accessed July 18, 2025, [https://github.com/digitalbazaar/jsonld-request](https://github.com/digitalbazaar/jsonld-request)  
13. Activity Streams 2.0 \- Medium, accessed July 18, 2025, [https://medium.com/@jasnell/activity-streams-2-0-70881f866935](https://medium.com/@jasnell/activity-streams-2-0-70881f866935)  
14. 5 best practices for NestJS applications | Tech Tonic \- Medium, accessed July 18, 2025, [https://medium.com/deno-the-complete-reference/5-best-practices-for-nestjs-applications-831d0566a534](https://medium.com/deno-the-complete-reference/5-best-practices-for-nestjs-applications-831d0566a534)  
15. NestJS: A Guide to Project Structure \- Claude's Blog, accessed July 18, 2025, [https://omosa.hashnode.dev/building-scalable-and-maintainable-applications-with-nestjs-a-guide-to-project-structure](https://omosa.hashnode.dev/building-scalable-and-maintainable-applications-with-nestjs-a-guide-to-project-structure)  
16. Nestjs best practices and suggestions : r/Nestjs\_framework \- Reddit, accessed July 18, 2025, [https://www.reddit.com/r/Nestjs\_framework/comments/1dulbux/nestjs\_best\_practices\_and\_suggestions/](https://www.reddit.com/r/Nestjs_framework/comments/1dulbux/nestjs_best_practices_and_suggestions/)  
17. Best Practices for Structuring a NestJS Application | by @rnab \- Medium, accessed July 18, 2025, [https://arnab-k.medium.com/best-practices-for-structuring-a-nestjs-application-b3f627548220](https://arnab-k.medium.com/best-practices-for-structuring-a-nestjs-application-b3f627548220)  
18. Fan-Out and Fan-In Patterns: Building a Personalized Feed in Laravel | by Vagelis Bisbikis, accessed July 18, 2025, [https://medium.com/@vagelisbisbikis/fan-out-and-fan-in-patterns-building-a-personalized-feed-in-laravel-676515f65e03](https://medium.com/@vagelisbisbikis/fan-out-and-fan-in-patterns-building-a-personalized-feed-in-laravel-676515f65e03)  
19. Getting Started \- TypeORM, accessed July 18, 2025, [https://typeorm.io/docs/getting-started/](https://typeorm.io/docs/getting-started/)  
20. NestJS with TypeORM and PostgreSQL \- DEV Community, accessed July 18, 2025, [https://dev.to/refifauzan/nestjs-with-typeorm-and-postgresql-3466](https://dev.to/refifauzan/nestjs-with-typeorm-and-postgresql-3466)  
21. ActivityStreams 2.0 Terms \- W3C, accessed July 18, 2025, [https://www.w3.org/ns/activitystreams](https://www.w3.org/ns/activitystreams)  
22. Configuration | NestJS \- A progressive Node.js framework, accessed July 18, 2025, [https://docs.nestjs.com/techniques/configuration](https://docs.nestjs.com/techniques/configuration)  
23. Advanced Configuration Management in NestJS | by @rnab \- Medium, accessed July 18, 2025, [https://arnab-k.medium.com/advanced-configuration-management-in-nestjs-b68f4b809553](https://arnab-k.medium.com/advanced-configuration-management-in-nestjs-b68f4b809553)  
24. Simplifying the Setup: Connecting NestJS to PostgreSQL Using TypeORM | by Aswathy Raj, accessed July 18, 2025, [https://medium.com/@aswathyraj/simplifying-the-setup-connecting-nestjs-to-postgresql-using-typeorm-4c3dc98ef754](https://medium.com/@aswathyraj/simplifying-the-setup-connecting-nestjs-to-postgresql-using-typeorm-4c3dc98ef754)  
25. User Authentication with Bcrypt Password | CodeSignal Learn, accessed July 18, 2025, [https://codesignal.com/learn/courses/securing-and-testing-your-mvc-nestjs-app/lessons/user-authentication-with-bcrypt-password?courseSlug=securing-and-testing-your-mvc-nestjs-app](https://codesignal.com/learn/courses/securing-and-testing-your-mvc-nestjs-app/lessons/user-authentication-with-bcrypt-password?courseSlug=securing-and-testing-your-mvc-nestjs-app)  
26. TypeORM Entity \- Tutorials Point, accessed July 18, 2025, [https://www.tutorialspoint.com/typeorm/typeorm\_entity.htm](https://www.tutorialspoint.com/typeorm/typeorm_entity.htm)  
27. A Step-by-Step Guide to Implement JWT Authentication in NestJS using Passport | Medium, accessed July 18, 2025, [https://medium.com/@camillefauchier/implementing-authentication-in-nestjs-using-passport-and-jwt-5a565aa521de](https://medium.com/@camillefauchier/implementing-authentication-in-nestjs-using-passport-and-jwt-5a565aa521de)  
28. (NestJS-8)Use bcrypt to encrypt password before storing it in a database \- Bhargava Chary, accessed July 18, 2025, [https://bhargavacharyb.medium.com/nestjs-8-encryption-and-decryption-of-password-4e287b6483ca](https://bhargavacharyb.medium.com/nestjs-8-encryption-and-decryption-of-password-4e287b6483ca)  
29. Authentication | NestJS \- A progressive Node.js framework, accessed July 18, 2025, [https://docs.nestjs.com/security/authentication](https://docs.nestjs.com/security/authentication)  
30. A Step-by-Step Guide to Implement JWT Authentication in NestJS using Passport, accessed July 18, 2025, [https://fintech.theodo.com/blog-posts/implementing-authentication-in-nestjs-using-passport-and-jwt](https://fintech.theodo.com/blog-posts/implementing-authentication-in-nestjs-using-passport-and-jwt)  
31. abouroubi/nestjs-auth-jwt: A sample NestJS application, demonstrating how to use JWT Authentication, with short lived access tokens, and long lived refresh token. \- GitHub, accessed July 18, 2025, [https://github.com/abouroubi/nestjs-auth-jwt](https://github.com/abouroubi/nestjs-auth-jwt)  
32. passport | NestJS \- A progressive Node.js framework, accessed July 18, 2025, [https://docs.nestjs.com/recipes/passport](https://docs.nestjs.com/recipes/passport)  
33. Guards | NestJS \- A progressive Node.js framework, accessed July 18, 2025, [https://docs.nestjs.com/guards](https://docs.nestjs.com/guards)  
34. Custom decorators | NestJS \- A progressive Node.js framework, accessed July 18, 2025, [https://docs.nestjs.com/custom-decorators](https://docs.nestjs.com/custom-decorators)  
35. Experiences writing an ActivityPub server in Python with Django | Check my working, accessed July 18, 2025, [https://checkmyworking.com/posts/2023/02/experiences-writing-an-activitypub-server-in-python-with-django/](https://checkmyworking.com/posts/2023/02/experiences-writing-an-activitypub-server-in-python-with-django/)  
36. ActivityPub and WebFinger \- W3C, accessed July 18, 2025, [https://www.w3.org/community/reports/socialcg/CG-FINAL-apwf-20240608/](https://www.w3.org/community/reports/socialcg/CG-FINAL-apwf-20240608/)  
37. WebFinger \- Wikipedia, accessed July 18, 2025, [https://en.wikipedia.org/wiki/WebFinger](https://en.wikipedia.org/wiki/WebFinger)  
38. WebFinger, accessed July 18, 2025, [https://webfinger.net/](https://webfinger.net/)  
39. A Guide to Implementing ActivityPub in a Static Site (or Any Website) \- Part 3, accessed July 18, 2025, [https://maho.dev/2024/02/a-guide-to-implementing-activitypub-in-a-static-site-or-any-website-part-3/](https://maho.dev/2024/02/a-guide-to-implementing-activitypub-in-a-static-site-or-any-website-part-3/)  
40. A Guide to Implementing ActivityPub in a Static Site (or Any Website) — Part 4 \- Medium, accessed July 18, 2025, [https://medium.com/@maho.pacheco.m/a-guide-to-implementing-activitypub-in-a-static-site-or-any-website-part-4-361185072bba](https://medium.com/@maho.pacheco.m/a-guide-to-implementing-activitypub-in-a-static-site-or-any-website-part-4-361185072bba)  
41. ActivityPub \- Mastodon documentation, accessed July 18, 2025, [https://docs.joinmastodon.org/spec/activitypub/](https://docs.joinmastodon.org/spec/activitypub/)  
42. HTTP Accept header support for Surge cache and ActivityPub \- Dominik Schilling, accessed July 18, 2025, [https://dominikschilling.de/notes/http-accept-header-wordpress-cache-activitypub/](https://dominikschilling.de/notes/http-accept-header-wordpress-cache-activitypub/)  
43. Content negotiation considered harmful \- snarfed.org, accessed July 18, 2025, [https://snarfed.org/2023-03-24\_49619-2](https://snarfed.org/2023-03-24_49619-2)  
44. The Definitive Guide to Canonicalizing in SEO \- Neil Patel, accessed July 18, 2025, [https://neilpatel.com/blog/canonicalization/](https://neilpatel.com/blog/canonicalization/)  
45. What is a Canonical URL? Best Practice Guide 2022 \- Shopify, accessed July 18, 2025, [https://www.shopify.com/partners/blog/canonical-urls](https://www.shopify.com/partners/blog/canonical-urls)  
46. Canonical Tag Guide | UC Davis, accessed July 18, 2025, [https://marketingtoolbox.ucdavis.edu/departments/web/search-engine-optimization/canonical-tags](https://marketingtoolbox.ucdavis.edu/departments/web/search-engine-optimization/canonical-tags)  
47. Graph vs Relational Databases \- Difference Between Databases \- AWS, accessed July 18, 2025, [https://aws.amazon.com/compare/the-difference-between-graph-and-relational-database/](https://aws.amazon.com/compare/the-difference-between-graph-and-relational-database/)  
48. Using JSONB in PostgreSQL: How to Effectively Store & Index JSON Data in PostgreSQL, accessed July 18, 2025, [https://dev.to/scalegrid/using-jsonb-in-postgresql-how-to-effectively-store-index-json-data-in-postgresql-5d7e](https://dev.to/scalegrid/using-jsonb-in-postgresql-how-to-effectively-store-index-json-data-in-postgresql-5d7e)  
49. What is Schema Evolution in Graph Databases? \- Hypermode, accessed July 18, 2025, [https://hypermode.com/blog/schema-evolution](https://hypermode.com/blog/schema-evolution)  
50. How do you handle data schema evolution in your company? : r/dataengineering \- Reddit, accessed July 18, 2025, [https://www.reddit.com/r/dataengineering/comments/1j5j59f/how\_do\_you\_handle\_data\_schema\_evolution\_in\_your/](https://www.reddit.com/r/dataengineering/comments/1j5j59f/how_do_you_handle_data_schema_evolution_in_your/)  
51. TypeORM \- Code with Confidence. Query with Power. | TypeORM, accessed July 18, 2025, [https://typeorm.io/](https://typeorm.io/)  
52. Activity Pub vs Web Frameworks \- Dan Palmer, accessed July 18, 2025, [https://danpalmer.me/2023-01-08-activitypub-vs-web-frameworks/](https://danpalmer.me/2023-01-08-activitypub-vs-web-frameworks/)  
53. TypeORM Indices \- Tutorialspoint, accessed July 18, 2025, [https://www.tutorialspoint.com/typeorm/typeorm\_indices.htm](https://www.tutorialspoint.com/typeorm/typeorm_indices.htm)  
54. UUID or GUID as Primary Keys? Be Careful\! | by Tom Harrison | Tom ..., accessed July 18, 2025, [https://tomharrisonjr.com/uuid-or-guid-as-primary-keys-be-careful-7b2aa3dcb439](https://tomharrisonjr.com/uuid-or-guid-as-primary-keys-be-careful-7b2aa3dcb439)  
55. PostgreSQL JSON Index \- Neon, accessed July 18, 2025, [https://neon.com/postgresql/postgresql-indexes/postgresql-json-index](https://neon.com/postgresql/postgresql-indexes/postgresql-json-index)  
56. Indexing PostgreSQL JSONB columns | Objection.js \- GitHub Pages, accessed July 18, 2025, [https://vincit.github.io/objection.js/recipes/indexing-postgresql-jsonb-columns.html](https://vincit.github.io/objection.js/recipes/indexing-postgresql-jsonb-columns.html)  
57. Adding index on jsonb field fail when running migration \- Stack Overflow, accessed July 18, 2025, [https://stackoverflow.com/questions/71572029/adding-index-on-jsonb-field-fail-when-running-migration](https://stackoverflow.com/questions/71572029/adding-index-on-jsonb-field-fail-when-running-migration)  
58. Postgres pg\_trgm type of index · Issue \#1519 · typeorm/typeorm \- GitHub, accessed July 18, 2025, [https://github.com/typeorm/typeorm/issues/1519](https://github.com/typeorm/typeorm/issues/1519)  
59. TypeORM Query Builder Wrapper \- Medium, accessed July 18, 2025, [https://medium.com/@arjunsumarlan/typeorm-query-builder-wrapper-48ac143706a5](https://medium.com/@arjunsumarlan/typeorm-query-builder-wrapper-48ac143706a5)  
60. TypeORM | Query Builder \- DEV Community, accessed July 18, 2025, [https://dev.to/shahjalalbu/typeorm-query-builder-1p2o](https://dev.to/shahjalalbu/typeorm-query-builder-1p2o)  
61. ActivityPub | Pixelfed Docs \- GitHub Pages, accessed July 18, 2025, [https://pixelfed.github.io/docs-next/spec/ActivityPub.html](https://pixelfed.github.io/docs-next/spec/ActivityPub.html)  
62. typeorm-polymorphic \- npm, accessed July 18, 2025, [https://www.npmjs.com/package/typeorm-polymorphic](https://www.npmjs.com/package/typeorm-polymorphic)  
63. API with NestJS \#146. Polymorphic associations with PostgreSQL and Prisma, accessed July 18, 2025, [https://wanago.io/2024/02/19/api-nestjs-postgresql-prisma-polymorphic-associations/](https://wanago.io/2024/02/19/api-nestjs-postgresql-prisma-polymorphic-associations/)  
64. Data Retention Policy: 10 Best Practices \- FileCloud, accessed July 18, 2025, [https://www.filecloud.com/blog/2025/05/data-retention-policy-best-practices/](https://www.filecloud.com/blog/2025/05/data-retention-policy-best-practices/)  
65. \[Core feature\] Support for Postgres database pruning / data retention · Issue \#6360 \- GitHub, accessed July 18, 2025, [https://github.com/flyteorg/flyte/issues/6360](https://github.com/flyteorg/flyte/issues/6360)  
66. 1kx: An in-depth interpretation of decentralized social protocols, accessed July 18, 2025, [https://www.odaily.news/en/post/5191391](https://www.odaily.news/en/post/5191391)  
67. Soft Delete | Nestjs-query \- GitHub Pages, accessed July 18, 2025, [https://tripss.github.io/nestjs-query/docs/persistence/typeorm/soft-delete](https://tripss.github.io/nestjs-query/docs/persistence/typeorm/soft-delete)  
68. Task Scheduling | NestJS \- A progressive Node.js framework, accessed July 18, 2025, [https://docs.nestjs.com/techniques/task-scheduling](https://docs.nestjs.com/techniques/task-scheduling)  
69. (NestJS-16) NestJS Dynamic Jobs (Part 1\) — Create Cron, Interval, and Timeout Tasks at Runtime \- Bhargava Chary, accessed July 18, 2025, [https://bhargavacharyb.medium.com/mastering-background-cron-jobs-in-nestjs-the-complete-guide-cd0f41bb6b31](https://bhargavacharyb.medium.com/mastering-background-cron-jobs-in-nestjs-the-complete-guide-cd0f41bb6b31)  
70. Unlocking Performance: A Deep Dive into Table Partitioning in PostgreSQL \- Medium, accessed July 18, 2025, [https://medium.com/simform-engineering/unlocking-performance-a-deep-dive-into-table-partitioning-in-postgresql-3f5b8faa025f](https://medium.com/simform-engineering/unlocking-performance-a-deep-dive-into-table-partitioning-in-postgresql-3f5b8faa025f)  
71. Delete using Query Builder \- TypeORM 0.2.38, accessed July 18, 2025, [https://typeorm-legacy.productsway.com/delete-query-builder/](https://typeorm-legacy.productsway.com/delete-query-builder/)  
72. Partitioning a large table in PostgreSQL with Rails \- Aha.io, accessed July 18, 2025, [https://www.aha.io/engineering/articles/partitioning-a-large-table-in-postgresql-with-rails](https://www.aha.io/engineering/articles/partitioning-a-large-table-in-postgresql-with-rails)  
73. Backfilling Conversations: Two Major Approaches \- NodeBB \- SocialHub, accessed July 18, 2025, [https://socialhub.activitypub.rocks/t/backfilling-conversations-two-major-approaches/5363](https://socialhub.activitypub.rocks/t/backfilling-conversations-two-major-approaches/5363)  
74. Deduplication \- Ceph Documentation, accessed July 18, 2025, [https://docs.ceph.com/en/quincy/dev/deduplication/](https://docs.ceph.com/en/quincy/dev/deduplication/)  
75. P-Dedupe: Exploiting Parallelism in Data Deduplication System \- Wen Xia, accessed July 18, 2025, [https://cswxia.github.io/pub/NAS-P-Dedupe-2012.pdf](https://cswxia.github.io/pub/NAS-P-Dedupe-2012.pdf)  
76. Raw Body | NestJS \- A progressive Node.js framework, accessed July 18, 2025, [https://docs.nestjs.com/faq/raw-body](https://docs.nestjs.com/faq/raw-body)  
77. activitypub-express \- npm, accessed July 18, 2025, [https://www.npmjs.com/package/activitypub-express](https://www.npmjs.com/package/activitypub-express)  
78. ActivityPub and HTTP Signatures, accessed July 18, 2025, [https://swicg.github.io/activitypub-http-signature/](https://swicg.github.io/activitypub-http-signature/)  
79. activitypub-http-signatures \- NPM, accessed July 18, 2025, [https://www.npmjs.com/package/activitypub-http-signatures](https://www.npmjs.com/package/activitypub-http-signatures)  
80. RFC 9421 \- HTTP Message Signatures \- IETF Datatracker, accessed July 18, 2025, [https://datatracker.ietf.org/doc/rfc9421/](https://datatracker.ietf.org/doc/rfc9421/)  
81. Caching public keys \- ActivityPub \- SocialHub, accessed July 18, 2025, [https://socialhub.activitypub.rocks/t/caching-public-keys/688](https://socialhub.activitypub.rocks/t/caching-public-keys/688)  
82. Using BullMQ with NestJS for Background Job Processing \- Mahabubur Rahman \- Medium, accessed July 18, 2025, [https://mahabub-r.medium.com/using-bullmq-with-nestjs-for-background-job-processing-320ab938048a](https://mahabub-r.medium.com/using-bullmq-with-nestjs-for-background-job-processing-320ab938048a)  
83. Got an interesting question today about \#Fedify's outgoing \#queue design\! | NodeBB Community, accessed July 18, 2025, [https://community.nodebb.org/post/103747](https://community.nodebb.org/post/103747)  
84. RabbitMQ \- Microservices | NestJS \- A progressive Node.js framework, accessed July 18, 2025, [https://docs.nestjs.com/microservices/rabbitmq](https://docs.nestjs.com/microservices/rabbitmq)  
85. Re-evaluating Fan-Out-on-Write vs. Fan-Out-on-Read Under Celebrity Traffic Spikes (2025), accessed July 18, 2025, [https://codemia.io/blog/path/Re-evaluating-Fan-Out-on-Write-vs-Fan-Out-on-Read-Under-Celebrity-Traffic-Spikes-2025](https://codemia.io/blog/path/Re-evaluating-Fan-Out-on-Write-vs-Fan-Out-on-Read-Under-Celebrity-Traffic-Spikes-2025)  
86. BullMQ \- Background Jobs processing and message queue for NodeJS | BullMQ, accessed July 18, 2025, [https://bullmq.io/](https://bullmq.io/)  
87. Job Scheduling in Node.js with BullMQ | Better Stack Community, accessed July 18, 2025, [https://betterstack.com/community/guides/scaling-nodejs/bullmq-scheduled-tasks/](https://betterstack.com/community/guides/scaling-nodejs/bullmq-scheduled-tasks/)  
88. Queuing jobs in NestJS using @nestjs/bullmq package \- DEV Community, accessed July 18, 2025, [https://dev.to/railsstudent/queuing-jobs-in-nestjs-using-nestjsbullmq-package-24n3](https://dev.to/railsstudent/queuing-jobs-in-nestjs-using-nestjsbullmq-package-24n3)  
89. Queues | NestJS \- A progressive Node.js framework, accessed July 18, 2025, [https://docs.nestjs.com/techniques/queues](https://docs.nestjs.com/techniques/queues)  
90. Retrying failing jobs | BullMQ, accessed July 18, 2025, [https://docs.bullmq.io/guide/retrying-failing-jobs](https://docs.bullmq.io/guide/retrying-failing-jobs)  
91. Dead Letter Exchanges \- RabbitMQ, accessed July 18, 2025, [https://www.rabbitmq.com/docs/dlx](https://www.rabbitmq.com/docs/dlx)  
92. Manually processing jobs | BullMQ, accessed July 18, 2025, [https://docs.bullmq.io/patterns/manually-fetching-jobs](https://docs.bullmq.io/patterns/manually-fetching-jobs)  
93. Groups | BullMQ, accessed July 18, 2025, [https://docs.bullmq.io/bullmq-pro/groups](https://docs.bullmq.io/bullmq-pro/groups)  
94. Generating RSA (PEM) Private Keys in Node.js \- Raul Melo, accessed July 18, 2025, [https://www.raulmelo.me/en/snippets/generating-rsa-pem-private-keys-in-node-js](https://www.raulmelo.me/en/snippets/generating-rsa-pem-private-keys-in-node-js)  
95. Crypto | Node.js v24.4.1 Documentation, accessed July 18, 2025, [https://nodejs.org/api/crypto.html](https://nodejs.org/api/crypto.html)  
96. Caching | NestJS \- A progressive Node.js framework, accessed July 18, 2025, [https://docs.nestjs.com/techniques/caching](https://docs.nestjs.com/techniques/caching)  
97. Using Redis with NestJS: Caching and Pub/Sub | by @rnab \- Medium, accessed July 18, 2025, [https://arnab-k.medium.com/using-redis-with-nestjs-caching-and-pub-sub-649a45ec7dc2](https://arnab-k.medium.com/using-redis-with-nestjs-caching-and-pub-sub-649a45ec7dc2)  
98. How to Use Redis with NestJS: A Simple Guide to Caching | by Dip Ghosh | Medium, accessed July 18, 2025, [https://medium.com/@dipghoshraj/how-to-use-redis-with-nestjs-a-simple-guide-to-caching-b9408d96243e](https://medium.com/@dipghoshraj/how-to-use-redis-with-nestjs-a-simple-guide-to-caching-b9408d96243e)  
99. nestjs-redis-example-1 \- GitHub Gist, accessed July 18, 2025, [https://gist.github.com/paztek/ba60ba1e1f6ed7c41f2b44c2f7e8a1e8](https://gist.github.com/paztek/ba60ba1e1f6ed7c41f2b44c2f7e8a1e8)  
100. How to create custom Cache Module in Nest JS \- Stack Overflow, accessed July 18, 2025, [https://stackoverflow.com/questions/75460055/how-to-create-custom-cache-module-in-nest-js](https://stackoverflow.com/questions/75460055/how-to-create-custom-cache-module-in-nest-js)  
101. How to add caching in nestjs api routes \- Tarun Sharma, accessed July 18, 2025, [https://devs.tkssharma.com/blog/how-to-add-caching-with-nestjs-apis/](https://devs.tkssharma.com/blog/how-to-add-caching-with-nestjs-apis/)  
102. Query caching using Nest.js and Typeorm \- WorkOS, accessed July 18, 2025, [https://workos.com/blog/query-caching-nest-js-and-typeorm](https://workos.com/blog/query-caching-nest-js-and-typeorm)  
103. NodeJS , RabbitMQ Fanout Exchange Example \- YouTube, accessed July 18, 2025, [https://www.youtube.com/watch?v=YT9pbes8vuc](https://www.youtube.com/watch?v=YT9pbes8vuc)  
104. Using RabbitMQ with Node.js: A Complete Guide \- DEV Community, accessed July 18, 2025, [https://dev.to/pawandeore/using-rabbitmq-with-nodejs-a-complete-guide-48ej](https://dev.to/pawandeore/using-rabbitmq-with-nodejs-a-complete-guide-48ej)  
105. Error Handling in NestJS: Best Practices and Examples \- DEV Community, accessed July 18, 2025, [https://dev.to/geampiere/error-handling-in-nestjs-best-practices-and-examples-5e76](https://dev.to/geampiere/error-handling-in-nestjs-best-practices-and-examples-5e76)  
106. ActivityPub | PeerTube documentation \- JoinPeerTube, accessed July 18, 2025, [https://docs.joinpeertube.org/api/activitypub](https://docs.joinpeertube.org/api/activitypub)  
107. Some thoughts about ActivityPub \- GitHub Gist, accessed July 18, 2025, [https://gist.github.com/jdarcy/60107fe4e653819138396257df302eef](https://gist.github.com/jdarcy/60107fe4e653819138396257df302eef)  
108. What is Eventual Consistency? Definition & FAQs \- ScyllaDB, accessed July 18, 2025, [https://www.scylladb.com/glossary/eventual-consistency/](https://www.scylladb.com/glossary/eventual-consistency/)  
109. Top Eventual Consistency Patterns You Must Know \- ByteByteGo, accessed July 18, 2025, [https://bytebytego.com/guides/top-eventual-consistency-patterns-you-must-know/](https://bytebytego.com/guides/top-eventual-consistency-patterns-you-must-know/)  
110. Efficient Database Scaling in NestJS with TypeORM: Best Practices for Enforcing Slave Reads \- MD OZAIR QAYAM, accessed July 18, 2025, [https://mdozairq.medium.com/efficient-database-scaling-in-nestjs-with-typeorm-best-practices-for-enforcing-slave-reads-10463221426a](https://mdozairq.medium.com/efficient-database-scaling-in-nestjs-with-typeorm-best-practices-for-enforcing-slave-reads-10463221426a)  
111. Documentation: 17: 5.12. Table Partitioning \- PostgreSQL, accessed July 18, 2025, [https://www.postgresql.org/docs/current/ddl-partitioning.html](https://www.postgresql.org/docs/current/ddl-partitioning.html)  
112. HTTP Signature Upgrades Coming Soon | NodeBB Community, accessed July 18, 2025, [https://community.nodebb.org/topic/e9dbb7f1-557a-442e-aeb9-e96f28b6afc3/http-signature-upgrades-coming-soon](https://community.nodebb.org/topic/e9dbb7f1-557a-442e-aeb9-e96f28b6afc3/http-signature-upgrades-coming-soon)  
113. HTTP Signatures \- OAuth.net, accessed July 18, 2025, [https://oauth.net/http-signatures/](https://oauth.net/http-signatures/)  
114. An JavaScript (Node.js and browsers) implementation for HTTP Message Signatures (RFC 9421\) \- GitHub, accessed July 18, 2025, [https://github.com/misskey-dev/node-http-message-signatures](https://github.com/misskey-dev/node-http-message-signatures)  
115. ActivityPub and HTTP Signatures recommends double-knocking to those who want to produce RFC 9421 signatures. | NodeBB Community, accessed July 18, 2025, [https://community.nodebb.org/topic/a3fd698a-d997-47d2-ae3f-872f69257c80/activitypub-and-http-signatures-recommends-double-knocking-to-those-who-want-to-produce-rfc-9421-signatures.](https://community.nodebb.org/topic/a3fd698a-d997-47d2-ae3f-872f69257c80/activitypub-and-http-signatures-recommends-double-knocking-to-those-who-want-to-produce-rfc-9421-signatures.)  
116. Understanding Guards in NestJS | DigitalOcean, accessed July 18, 2025, [https://www.digitalocean.com/community/tutorials/understanding-guards-in-nestjs](https://www.digitalocean.com/community/tutorials/understanding-guards-in-nestjs)