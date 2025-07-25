---
sidebar_position: 4
title: "Addressing Database Design Challenges"
---

# **Implementing ActivityPub with NestJS and TypeORM: Addressing Database Design Challenges**

## **I. Executive Summary**

ActivityPub, a W3C-recommended decentralized social networking protocol, forms the backbone of the "Fediverse" by enabling federated communication between independent servers, known as instances.1 It defines both Client-to-Server (C2S) and Server-to-Server (S2S) protocols, facilitating content creation, modification, and the crucial delivery of notifications and content across the network.1 This architecture, while promoting decentralization and user control, introduces a unique set of database and distributed system challenges.  
Implementing ActivityPub necessitates navigating the complexities of mapping its flexible, graph-like data model (ActivityStreams 2.0 and JSON-LD) to a relational database using TypeORM. Critical distributed system concerns include managing the high-volume "fan-out" for activity distribution, ensuring eventual consistency across a loosely coupled network of instances, and establishing robust mechanisms for identity management, data deduplication, and data retention. Furthermore, securing inter-server communication against various threats is paramount.2  
This report outlines a comprehensive architectural approach for building a resilient and scalable ActivityPub instance using NestJS and TypeORM. It details how NestJS's modularity and TypeScript support, combined with TypeORM for relational database interaction, can be leveraged. The strategy integrates specialized libraries for JSON-LD processing, asynchronous messaging (BullMQ/RabbitMQ), efficient caching (Redis), and secure HTTP signature verification to address the inherent challenges of a federated social network.

## **II. Understanding ActivityPub and its Data Model**

### **ActivityPub Fundamentals**

ActivityPub operates on two distinct yet interconnected layers: the Client-to-Server (C2S) protocol and the Server-to-Server (S2S) protocol. The C2S protocol defines how user applications, such as mobile apps or web clients, interact with their home server for actions like posting content, liking, or following other users.1 The S2S protocol, conversely, governs how different ActivityPub servers exchange information and activities, enabling the federation of posts, follows, and other social interactions across the Fediverse.1 While the C2S protocol aims for universal client interoperability, its adoption has been limited, with major implementations like Mastodon often relying on their own proprietary APIs. This is primarily due to perceived deficiencies in the C2S specification regarding crucial features such as notifications, search capabilities, and comprehensive timeline management.3  
The protocol's core functionality revolves around four fundamental components: Actors, Objects, Activities, and Collections.

* **Actors** represent entities capable of performing actions, such as a Person, Group, Application, or Service.1 Each Actor is defined with an  
  inbox endpoint for receiving messages from other actors and an outbox endpoint for publishing their own activities to the world.2  
* **Objects** are the content or entities upon which activities are performed. Examples include a Note (a text post), an Image, a Video, an Event, or a Location.1  
* **Activities** describe actions undertaken by an Actor on an Object. Common Activity types include Create (to publish new content), Like (to express approval), Follow (to subscribe to an actor's updates), Announce (to re-share content), and Delete (to remove content).1 These activities often trigger side-effects, such as incrementing like counters or adding objects to an actor's various collections.10  
* **Collections** are ordered or unordered groupings of other objects. Key collections include an actor's followers (those who follow them), following (those they follow), inbox (received activities), and outbox (published activities).2 The  
  inbox and outbox are specifically mandated to be OrderedCollections, typically presented in reverse chronological order.2

### **ActivityStreams 2.0 and JSON-LD**

ActivityStreams 2.0 (AS2) provides the foundational vocabulary for ActivityPub, defining a rich and extensible set of types for describing social interactions.1 Its inherent flexibility and extensibility are key strengths, allowing new properties and object types to be defined and integrated seamlessly through JSON-LD.2  
The use of JSON-LD carries significant implications for database design. All ActivityPub objects are identified by unique global Uniform Resource Identifiers (URIs), expressed as absolute IRIs using the id property.2 These URIs are designed to be dereferencable, meaning an HTTP GET request to the URI should return the full JSON-LD representation of the object.2 While JSON-LD supports advanced linked data approaches, it can also be treated as plain JSON for simpler implementations, offering a pragmatic balance for developers.2  
The reliance on JSON-LD for ActivityPub's data model creates a unique challenge, often referred to as the "Linked Data Paradox." ActivityPub's data is inherently flexible and graph-like, supporting schema evolution where objects can gain new properties without breaking the protocol.20 However, mapping this semi-structured, evolving data to a rigid relational schema, as typically managed by TypeORM, presents a fundamental impedance mismatch. The paradox arises because while JSON-LD offers significant flexibility at the protocol level, the underlying relational database often demands a more structured approach. This necessitates database strategies that can accommodate dynamic schemas while preserving the benefits of relational integrity.  
ActivityPub's mandate for URI-based identifiers introduces further complexities. These URIs are not merely identifiers; they also function as dereferencable network endpoints. This dual nature means that a URI like https://example.com/users/alice serves as both a unique identifier for Alice's actor object and the URL from which her full profile can be retrieved.2 A significant concern arises from using long, string-based URIs directly as primary keys in a relational database. Such an approach can lead to performance degradation due to increased storage requirements, slower sorting operations, and potential index fragmentation, especially when compared to more efficient integer or native UUID keys.22 Furthermore, changing the URI structure of an instance can break federation, causing data inconsistencies across the network.6 ActivityPub servers are also required to perform deduplication of incoming activities by comparing their  
ids, highlighting the importance of consistent URI representation.2 The specification even allows for  
id: null for anonymous or transient objects, a feature that has historically caused compliance issues with some JSON-LD parsers.24  
A robust implementation must therefore employ a strategy that uses efficient internal primary keys (e.g., auto-incrementing integers or native database UUID types) for TypeORM entities, while storing the ActivityPub URI as a separate, unique, and indexed VARCHAR or TEXT column. This approach effectively decouples internal database efficiency from the external protocol's requirements. The id property in the ActivityPub JSON payload can then be a computed property, derived from the instance's base URL and the internal ID. This separation also allows for careful URI canonicalization, ensuring that variations in incoming URIs (e.g., with/without trailing slashes, case differences) are normalized before storage and comparison, which is vital for consistent identification and preventing duplicate entries.2

## **III. Database Design Choices for ActivityPub**

### **Relational vs. Graph Databases for Fediverse Data**

The choice of database technology is a foundational decision for any ActivityPub implementation, given the protocol's inherently interconnected data model. A comparative analysis of relational and graph databases reveals distinct strengths and weaknesses when applied to the Fediverse's data structures.  
**Relational Databases (e.g., PostgreSQL):** These systems excel at managing highly structured data, ensuring ACID (Atomicity, Consistency, Isolation, Durability) compliance, and performing complex filtering and aggregations.2 They organize data in a tabular format with rows and columns, where relationships are represented by foreign keys.2 However, relational databases can struggle with deeply interconnected data and complex multi-hop queries. As the number of joins increases, query performance can degrade significantly, impacting application responsiveness.2 The relational model primarily prioritizes data entities.31  
**Graph Databases:** In contrast, graph databases store data as a network of entities (nodes) and explicitly defined relationships (edges).2 This native representation makes them exceptionally efficient for use cases with complex data interconnections and relationship traversal, such as social networks or supply chains.2 Graph databases prioritize relationships, allowing for rapid navigation between entities without the need for dynamic calculations or extensive joins.2 They also offer schema flexibility, allowing for agile development while maintaining data quality through property constraints and uniqueness rules.32  
The following table summarizes the suitability of each database type for ActivityPub:

| Criterion | Relational Databases (e.g., PostgreSQL) | Graph Databases |
| :---- | :---- | :---- |
| **Data Model** | Tabular (rows, columns) | Nodes and explicitly stored relationships |
| **Relationships** | Foreign keys (relationships resolved via JOINs at runtime) | Direct, labeled, property-rich connections |
| **Query Performance (Complex Joins/Traversals)** | Degrades with many JOINs and deep traversals 2 | Highly efficient for complex, multi-hop queries 2 |
| **Schema Flexibility** | Rigid (but JSONB columns offer flexibility) 34 | Flexible, adaptable to evolving data models 32 |
| **ACID Compliance** | High, ideal for transactional integrity 2 | Can offer, but varies by implementation |
| **Scalability** | Traditionally vertical, but horizontal scaling is possible 32 | Natively supports horizontal scaling for connected data 32 |
| **Use Case Suitability for ActivityPub** | Structured user data, financial transactions, clear relationships 31 | Social graphs, interconnected entities, complex network analysis 32 |

This comparison highlights that while graph databases align naturally with the interconnected nature of social network data, a relational database like PostgreSQL, particularly with its JSONB capabilities, can serve as a pragmatic and robust choice.

### **Leveraging PostgreSQL with TypeORM**

Despite the graph-like qualities of ActivityPub's data, PostgreSQL, combined with TypeORM, presents a compelling solution due to its maturity, ACID compliance, and widespread support.2 PostgreSQL's JSONB capabilities offer a crucial middle ground, enabling the handling of semi-structured ActivityPub objects while retaining the benefits of relational integrity for core entities.34  
The strategic use of JSONB columns is pivotal for accommodating ActivityPub's schema flexibility and nested objects. JSONB allows storing the dynamic, flexible JSON-LD payloads directly within relational tables.15 This is particularly advantageous when the schema is fluid, frequently changing, or contains multi-level nested objects, as it avoids the need for complex denormalization into numerous separate tables.34  
A critical consideration when employing JSONB is the "Hybrid Schema" approach, which represents a trade-off between performance and maintainability. While JSONB provides schema flexibility, a direct consequence is that PostgreSQL does not store column statistics for JSONB columns or their nested keys. This lack of statistics can lead to the query planner making suboptimal choices, potentially resulting in less efficient query plans, such as using nested loop joins instead of more performant hash joins.34 Therefore, for frequently accessed or critical fields embedded within the JSONB payload, it is a best practice to "promote" them to dedicated, first-class relational columns. This allows for proper indexing and more efficient query optimization, as these columns will benefit from PostgreSQL's traditional indexing mechanisms and query planner statistics. The "hybrid schema" approach—where stable, frequently queried fields reside in dedicated columns and dynamic, less frequently queried attributes are stored in JSONB—is a crucial implementation best practice. This strategy requires careful analysis of data access patterns and a willingness to refactor the schema as the application evolves, balancing the need for flexibility with the imperative for query performance.  
Best practices for JSONB storage, querying, and indexing are essential for optimal performance:

* **Storage:** JSONB is generally preferred over plain JSON for its faster processing capabilities, although it might result in a slightly larger storage footprint because it stores data in a decomposed binary format.34 For very large JSONB objects, PostgreSQL's TOAST (The Oversize Attribute Storage Technique) mechanism automatically handles out-of-line storage and compression, preventing large rows from impacting table performance.34  
* **Querying:** TypeORM's query builder can interact with JSONB columns, but for complex JSONB operators or nested path queries, developers might need to resort to raw SQL or extend TypeORM's query builder capabilities.35 PostgreSQL provides powerful operators like  
  \-\> (to get a JSON object field), \-\>\> (to get a JSON object field as text), @\> (to check if the left JSON value contains the right path/value entries), and \<@ (to check if the left JSON path/value entries are contained within the right JSON value) for efficient querying of JSONB data.35  
* **Indexing (GIN indexes):** Generalized Inverted Indexes (GIN) are the recommended index type for JSONB columns in PostgreSQL. GIN indexes significantly improve query performance for operations such as existence checks, containment queries, and path operations within JSONB documents.35 While TypeORM's  
  @Index decorator can be used for basic column indexing, for specific GIN operator classes (e.g., jsonb\_path\_ops for optimized path queries) or for indexing nested paths within the JSONB structure, manual migration queries using queryRunner.query() are often necessary.40 It is crucial to set  
  synchronize: false on such manually created indexes within TypeORM entities to prevent TypeORM from inadvertently dropping them during schema synchronization or migration generation.41

**Example of GIN Index Creation in a TypeORM Migration:**

SQL

\-- For general-purpose JSONB queries  
CREATE INDEX "my\_jsonb\_gin\_idx" ON "my\_table" USING GIN ("jsonb\_column");

\-- For optimized path queries  
CREATE INDEX "my\_jsonb\_path\_ops\_idx" ON "my\_table" USING GIN ("jsonb\_column" jsonb\_path\_ops);

\-- For indexing a specific nested field  
CREATE INDEX "my\_nested\_field\_idx" ON "my\_table" USING GIN (("jsonb\_column" \-\> 'nested\_field'));

These SQL commands would be embedded within a TypeORM migration file to ensure proper index creation and management.

## **IV. Core Database Design Challenges and Solutions**

### **URI Management and Identity**

ActivityPub objects are mandated to have unique global identifiers, typically publicly dereferencable HTTPS URIs.2 These URIs serve as the canonical identity for actors, activities, and objects within the federated network.  
The use of long string URIs directly as primary keys in a relational database presents significant performance considerations. Such an approach can lead to larger index sizes, slower string comparisons during queries, and increased disk and memory usage, ultimately impacting overall database performance.22 Furthermore, relying on random UUIDs as primary keys can introduce index fragmentation, which negatively affects read performance.22 This highlights a fundamental tension between ActivityPub's external protocol requirements and internal database efficiency.  
The most effective approach is to adopt an "Internal ID vs. External URI" pattern. This involves using efficient internal primary keys (e.g., auto-incrementing BIGINT integers or native database UUID types) for TypeORM entities. The ActivityPub URI is then stored as a separate, unique, and indexed VARCHAR or TEXT column. This decouples the internal database's performance from the external protocol's reliance on URIs. The id property within the ActivityPub JSON payload can then be a computed property, dynamically generated based on the instance's base URL and the entity's internal primary key. This separation ensures that internal database operations remain fast and efficient, while external ActivityPub interactions adhere to the URI specification.  
Strategies for URI canonicalization and object deduplication are also crucial for maintaining data integrity and efficiency:

* **URI Canonicalization:** ActivityPub URIs, while absolute IRIs, can exhibit variations in practice (e.g., differences in trailing slashes, case sensitivity, or query parameters).26 A robust system must normalize incoming URIs to a consistent format before storage and comparison. This ensures that the same logical object is always identified by a single, canonical URI, preventing duplicate entries and facilitating accurate lookups.26 Webfinger plays a vital role here by mapping user-friendly addresses (ee.g.,  
  user@domain) to their canonical actor URIs, further aiding in consistent identity resolution.43  
* **Object Deduplication:** The ActivityPub specification mandates that servers *MUST* perform deduplication of activities returned by the inbox, primarily by comparing the id of incoming activities and discarding any already seen.2 Beyond activities, for content objects like media attachments, content hashing (e.g., using SHA-1 or SHA-256) can be employed to identify identical binary content. This technique reduces storage requirements and minimizes redundant network requests when the same media is referenced multiple times across the federated network.44

The following table provides a recommended mapping of ActivityPub object types to TypeORM entities, incorporating the discussed best practices:

| ActivityPub Type | TypeORM Entity | Key Columns | JSONB Column | Relationships | Special Considerations |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Actor | ActorEntity | id (UUID/BIGINT PK), activityPubId (VARCHAR, UNIQUE, INDEXED), type, preferredUsername, createdAt, updatedAt | properties (JSONB) | @OneToMany to ActivityEntity (outbox) | Webfinger integration for discovery; Public key storage for HTTP Signatures. |
| Activity | ActivityEntity | id (UUID/BIGINT PK), activityPubId (VARCHAR, UNIQUE, INDEXED), type, actorId (FK to Actor), objectId (FK to Object), targetId (FK to Object/Collection), createdAt | properties (JSONB) | @ManyToOne to ActorEntity, ObjectEntity, CollectionEntity | Eventual consistency; Fan-out processing. |
| Object | ObjectEntity | id (UUID/BIGINT PK), activityPubId (VARCHAR, UNIQUE, INDEXED), type (e.g., 'Note', 'Image'), attributedToId (FK to Actor), createdAt, updatedAt | properties (JSONB) | Polymorphic associations (via typeorm-polymorphic or manual entityId/entityType) 46 | Promote frequently queried fields from JSONB to dedicated columns. |
| Collection | CollectionEntity | id (UUID/BIGINT PK), activityPubId (VARCHAR, UNIQUE, INDEXED), type (e.g., 'OrderedCollection'), ownerId (FK to Actor), totalItems | properties (JSONB) | @ManyToMany with ActivityEntity or ObjectEntity (join table) | Implement OrderedCollection behavior with stable ordering keys. |

### **Modeling Relationships and Collections**

Representing ActivityStreams relationships such as Follow, Like, Announce, and Reply within a relational database using TypeORM requires careful consideration. In ActivityPub, many relationships are expressed as explicit Activities.1 For instance, a "Like" is a  
Like activity, and a "Follow" is a Follow activity. These can be stored as records within an ActivityEntity table, with foreign keys linking to the actor (who performed the action), the object (what was liked or followed), and potentially a target (e.g., the collection to which an object is added).11 For persistent relationships, such as a user following another, a dedicated  
Follow entity or a join table can explicitly track followerId and followedId to represent the relationship efficiently.49  
Implementing OrderedCollections, such as an actor's Inbox, Outbox, Followers, and Following collections, efficiently is crucial. The ActivityPub specification mandates that Inbox and Outbox collections *MUST* be OrderedCollections, typically presented in reverse chronological order.2 This necessitates a stable ordering key, such as an immutable insertion timestamp or a monotonically increasing sequence number, rather than a mutable  
updated timestamp, which can change frequently and disrupt consistent ordering.2  
A significant challenge arises from the distributed nature of ActivityPub collections. While each instance maintains its local view of collections (e.g., its users' inboxes or follower lists), achieving strong consistency for cross-instance collections (e.g., a global, real-time follower count for a remote actor) is inherently difficult due to the protocol's eventual consistency model.5 This means that updates to a remote actor's follower count, for example, will eventually propagate across the network, but there is no guarantee of immediate, synchronized consistency across all instances.8 Mastodon's follower synchronization mechanism, which involves sending partial collection URLs and digests, illustrates the complexity of attempting to reconcile these distributed views.49 Given this, implementations should embrace eventual consistency for federated collections. Local collections, such as a user's  
inbox or outbox, can maintain strong consistency, but aggregates or representations of remote collections should be treated as eventually consistent. This may involve background synchronization tasks or a "pull" model for less critical data, acknowledging that a perfectly real-time, globally consistent view is often impractical or prohibitively expensive in a federated system.  
ActivityPub's diverse object types (e.g., Note, Image, Question, Article) that can serve as the object of an Activity naturally lead to polymorphic associations in the database.1 TypeORM, a relational ORM, does not natively support polymorphic associations in the same way some document or graph databases might. However, libraries like  
typeorm-polymorphic can assist in modeling these relationships.46 This library allows a "child" table (e.g.,  
ActivityObject representing the object of an Activity) to reference multiple "parent" tables (e.g., NoteEntity, ImageEntity) by adding entityId and entityType columns to the child. The entityId stores the primary key of the referenced parent, and entityType stores a string identifying the parent's type, avoiding the need for numerous separate join tables for each object type.47 While  
typeorm-polymorphic simplifies the ORM layer, ensuring referential integrity at the database level for these polymorphic foreign keys can be complex, as native relational foreign key constraints typically point to a single table.47 This often requires careful application-level validation or more advanced database features like check constraints or triggers to enforce data integrity.

### **Scalability and Performance**

Designing for scalability and performance is paramount for an ActivityPub instance, given the potential for high volumes of distributed activities.  
Fan-out Strategies for Activity Delivery:  
ActivityPub's "all-to-all communication pattern" can lead to exponential performance degradation as the network grows.5 To manage the substantial write load associated with activity distribution, efficient fan-out strategies are essential. There are two primary models: "Fan-out on Write" (Push Model) and "Fan-out on Read" (Pull Model), often combined in hybrid approaches.

* **Fan-out on Write (Push Model):** In this approach, when an activity is created (e.g., a user posts an update), it is immediately pushed to the inboxes of all relevant recipients, such as the feeds of all followers.4  
  * **Pros:** Offers low read latency, as data is precomputed and ready for immediate display in user feeds.4  
  * **Cons:** Imposes a high write load on the system, requires more storage as data is duplicated for each recipient, and can be inefficient if updates are frequent or if an actor has a very large number of followers.4  
* **Fan-out on Read (Pull Model):** Instead of pushing data immediately, this model aggregates the required information at query time when a user requests their feed.4  
  * **Pros:** Saves storage by computing results only when requested, making it more effective when data is read less often than it is written.4  
  * **Cons:** Introduces higher read latency because data must be fetched and computed upon request, leading to increased database or API load during reads.4  
* **Hybrid Model:** This approach combines the benefits of both, typically pushing activities to the feeds of most users for a low-latency experience, while employing a pull model for high-activity users or those with massive follower counts (e.g., millions of followers), where pushing all updates in real-time would be resource-intensive.4 This balances efficient resource utilization with an optimized user experience.4

Asynchronous activity processing with message queues is critical for managing the write load of fan-out operations. NestJS microservices can integrate with message brokers like RabbitMQ 52 or job queue systems like BullMQ (backed by Redis).55 RabbitMQ's  
fanout exchange type is particularly well-suited for the push-model fan-out, as it broadcasts messages to all queues bound to the exchange, allowing each recipient instance to have its own queue for processing.52 BullMQ provides advanced features such as rate-limiting, job retries, scheduling, and concurrency control, which are vital for ensuring reliable and resilient activity delivery.55 It supports grouping jobs (e.g., by recipient instance) to ensure fair, round-robin processing among different targets.59 For instances with massive follower counts, a two-stage fan-out approach can be implemented: initially enqueueing a single consolidated message, which a background worker then processes to re-enqueue individual delivery tasks. This significantly reduces memory usage and improves UI responsiveness by offloading the heavy processing.62  
The following table compares the fan-out strategies:

| Strategy | Pros | Cons | Best Use Case | Implementation Notes |
| :---- | :---- | :---- | :---- | :---- |
| **Fan-out on Write (Push)** | Low read latency; Data precomputed and distributed 4 | High write load; More storage; Inefficient for frequent updates or large follower counts 4 | Real-time feeds; Low to medium follower counts | Message queues (RabbitMQ fanout exchange, BullMQ); Background workers 4 |
| **Fan-out on Read (Pull)** | Saves storage; Efficient for infrequent reads 4 | Higher read latency; Increased database/API load on reads 4 | News aggregators; High follower counts | Database aggregation; Caching; Indexing 4 |
| **Hybrid Model** | Balances resource utilization; Optimized user experience 4 | Increased implementation complexity | Social media platforms with diverse user activity patterns | Combination of push/pull, potentially with sharding; Requires intelligent routing 4 |

Distributed Consistency and Caching:  
ActivityPub data operates under an eventual consistency model.5 This means that while updates will eventually propagate and be reflected across all nodes or instances that store the data, there is no guarantee of immediate consistency. This design choice prioritizes high availability and responsiveness in a distributed system over strict, immediate consistency.8  
Implementing a robust caching layer with Redis using @nestjs/cache-manager is critical to mitigate the implications of eventual consistency and reduce database load. Caching significantly improves response times, especially for frequently accessed data such as actor profiles, popular posts, or remote objects that are repeatedly fetched.5 NestJS provides a caching abstraction through  
@nestjs/cache-manager, which is easily configurable with Redis for distributed, remote object caching.64 Redis is an excellent choice due to its lightning-fast read/write operations and native Pub/Sub capabilities, which can be leveraged for real-time updates and cache invalidation.65  
Effective cache invalidation strategies are essential for maintaining data freshness:

* **Time-to-Live (TTL):** Setting appropriate TTLs for cached objects is a straightforward approach, acknowledging the eventual consistency model. Faster expirations ensure more current data but result in higher server load due to more frequent cache misses and re-fetches.5  
* **Event-driven Invalidation:** For locally managed objects, a write operation to the database should trigger immediate invalidation of relevant cache entries.50 For remote ActivityPub objects, this is more complex, as updates are received asynchronously via S2S  
  Update activities.2 Processing an incoming  
  Update activity should trigger the invalidation of the corresponding cached object on the receiving instance. The challenge lies in the federated environment, where one instance cannot directly invalidate caches on other instances. ActivityPub-specific caching systems or relays have been proposed as solutions to reduce the load on origin servers by providing a more distributed caching infrastructure.5

Advanced Indexing and Partitioning:  
Beyond the basic indexing of primary and foreign keys, advanced indexing and database partitioning are vital for optimizing performance in large-scale ActivityPub deployments.

* **Optimizing queries with GIN indexes for JSONB data:** As previously discussed, GIN indexes are indispensable for efficient querying of JSONB data, particularly for operations involving existence checks, containment, and path traversals.35 While TypeORM's  
  @Index decorator can define basic indexes, complex GIN indexes, especially those specifying operator classes like jsonb\_path\_ops or indexing deeply nested paths, often require manual definition within database migrations.41  
* **Implementing database partitioning for large tables:** For tables expected to grow very large (e.g., Activity or Inbox tables with millions or billions of rows), PostgreSQL's declarative partitioning can dramatically improve query performance by logically dividing a large table into smaller, more manageable physical partitions.68  
  * **Strategies:** Common partitioning strategies include range partitioning (e.g., by createdAt timestamp for activities), list partitioning (e.g., by a specific actor ID range), or hash partitioning for even data distribution.68  
  * **TypeORM and Partitioning:** TypeORM does not natively support declarative partitioning directly through decorators. Therefore, the setup of partitioned tables (root table, child tables, CHECK constraints, and ATTACH PARTITION commands) must be managed explicitly via database migrations.68 Once correctly configured, queries that include the partition key in their  
    WHERE clause will automatically benefit from "partition pruning," where PostgreSQL scans only the relevant partitions, significantly reducing the amount of data processed.68

The following table summarizes key database performance optimizations for ActivityPub:

| Optimization | Benefit | Implementation Notes |
| :---- | :---- | :---- |
| **Internal ID vs. External URI** | Efficient primary keys for faster internal operations and joins | Use BIGINT/UUID PK; Store ActivityPub URI in a separate, unique, indexed VARCHAR column 22 |
| **Hybrid JSONB Schema** | Flexible schema with queryable, performant fields | Promote frequently accessed JSONB fields to dedicated columns; Use JSONB for dynamic/less critical data 34 |
| **GIN Indexes** | Fast JSONB queries for existence, containment, and path operations | Use jsonb\_ops or jsonb\_path\_ops; Manual migration for complex indexes; Set synchronize: false in TypeORM 35 |
| **Asynchronous Fan-out** | Decoupled activity delivery, improved responsiveness, reduced API load | Message queues (BullMQ/RabbitMQ); Background workers/microservices 4 |
| **Caching** | Reduced database load, faster reads for frequently accessed data | Redis with @nestjs/cache-manager; Implement TTLs and event-driven invalidation 64 |
| **Database Partitioning** | Faster queries, easier data management for large tables | PostgreSQL declarative partitioning via migrations (range, list, or hash); Queries benefit from partition pruning 68 |

## **V. Data Retention and Lifecycle Management**

Effective data retention and lifecycle management are crucial for maintaining the health and compliance of an ActivityPub instance, particularly given the continuous influx of federated data.

### **Implementing Soft Deletes**

Instead of immediately deleting records from the database, soft deletes are often the preferred approach for ActivityPub objects. This involves marking records as deleted (e.g., by setting a deletedAt timestamp) rather than physically removing them.71 This strategy offers several advantages: it preserves data for auditing purposes, allows for easier recovery of accidentally deleted content, and helps maintain referential integrity in a complex, distributed system where other instances might still reference the "deleted" object. TypeORM provides native support for soft deletes through the  
@DeleteDateColumn decorator, which automatically manages the deletedAt timestamp.71  
When @DeleteDateColumn is used, TypeORM automatically modifies queries to include a WHERE deletedAt IS NULL clause, ensuring that soft-deleted items are excluded from standard results.71 However, there will be scenarios where soft-deleted objects need to be explicitly retrieved, for instance, for moderation review or data recovery. In such cases, custom queries or specific repository methods that bypass the  
deletedAt IS NULL filter will be necessary.72 In a federated context, when an object is soft-deleted locally, a  
Delete activity should be sent to relevant remote inboxes to signal its removal from the network, ensuring other instances eventually reflect the change.2

### **Scheduled Data Pruning and Garbage Collection**

ActivityPub instances accumulate vast amounts of data, necessitating clear data retention policies to manage storage, comply with regulatory obligations, and remove old or less relevant information.43 These policies should precisely define how long different types of data (e.g., ephemeral activities, long-lived posts, media attachments) are retained before they are permanently purged.74  
Automating cleanup tasks is essential to enforce these policies efficiently. NestJS offers robust tools for this purpose:

* **NestJS Task Scheduling:** The @nestjs/schedule package provides a declarative way to define cron jobs, intervals, and timeouts within the application.79 This functionality can be used to schedule periodic tasks that identify records that have been soft-deleted beyond their defined retention period and then physically prune them from the database.  
* **Persistent Jobs:** For critical cleanup tasks, especially in environments where application restarts are common, the job metadata can be persisted in the database using TypeORM.79 This ensures that scheduled jobs automatically resume after an application reboot, preventing data accumulation or policy violations due to missed cleanup cycles.  
* **Background Queues:** For large-scale pruning operations, such as deleting millions of old activities or media files, offloading these tasks to message queues (e.g., using BullMQ) can distribute the workload.55 This prevents the cleanup process from blocking the main application threads and allows for parallel processing, improving efficiency and system responsiveness.

## **VI. Security Considerations**

Security is a paramount concern in any distributed system, and ActivityPub's federated nature introduces unique challenges, particularly concerning inter-server communication and abuse prevention.

### **HTTP Signature Verification**

HTTP Signatures are a cornerstone of security in ActivityPub, crucial for verifying the authenticity and integrity of incoming server-to-server requests.81 They function as a digital stamp, ensuring that messages genuinely originate from the declared source and have not been tampered with in transit.82 This mechanism is vital for establishing trust in a decentralized network where instances communicate without a central authority.  
Effective management of public keys for actors is integral to HTTP signature verification. Each actor (whether a user, a service, or an application) in ActivityPub possesses an associated public/private keypair.10 The private key is used to sign outgoing activities, while the corresponding public key is used by recipient servers to verify the incoming signatures. These public keys must be discoverable, typically by being embedded within the actor's profile document, which is accessible via their ActivityPub URI.83 Node.js libraries, such as  
activitypub-http-signatures, provide comprehensive functionality for generating and verifying HTTP signature headers, adhering to standards like RFC 9421\.82

### **Rate Limiting and Abuse Prevention**

ActivityPub's decentralized architecture, while empowering, can inadvertently make instances susceptible to accidental or intentional denial-of-service (DoS) attacks, particularly from poorly optimized implementations or malicious actors.1 Therefore, robust strategies for rate limiting and abuse prevention are indispensable.

* **Rate Limiting:** Implementing rate limiting on incoming inbox POST requests is a fundamental defense mechanism to prevent abuse and manage server load.81 This limits the number of requests an external instance or client can make within a given timeframe, protecting against floods of activities. NestJS applications can integrate various rate-limiting middleware or guards to enforce these policies.  
* **Content Filtering and Moderation:** Beyond technical safeguards, ActivityPub instances require mechanisms for content filtering and moderation. Implementations like Pleroma offer "Message Rewrite Federation" (MRF) policies to filter or reject unwanted activities based on configurable rules.77 Similarly, Mastodon processes  
  Block and Flag activities, allowing users to hide content from specific actors or report problematic posts to moderation teams.49 These mechanisms are crucial for maintaining a healthy and safe federated environment.  
* **Dead-Letter Queues (DLQs):** For asynchronous message processing, especially in the context of fan-out activity delivery, configuring dead-letter queues in message brokers like RabbitMQ or job queue systems like BullMQ is a critical error handling and abuse prevention strategy.4 Messages that fail to be processed successfully after a configured number of retries are automatically routed to a DLQ. This prevents poison messages from endlessly retrying and consuming resources, and allows administrators to inspect failed activities, diagnose issues, and manually reprocess or discard them, thus preventing system instability or resource exhaustion caused by malformed or malicious payloads.

## **VII. NestJS Implementation Patterns and Best Practices**

NestJS, a progressive Node.js framework, is well-suited for building ActivityPub services due to its modular architecture, strong TypeScript support, and robust dependency injection system.

### **Structuring the NestJS application for ActivityPub**

A modular design is paramount for managing the complexity of an ActivityPub implementation. The application should be organized into logical modules, such as ActorsModule, ActivitiesModule, FederationModule, InboxModule, and OutboxModule. This promotes a clear separation of concerns, enhances maintainability, and facilitates independent development and testing of different components. NestJS's inherent dependency injection system should be fully leveraged to manage services, repositories, and other providers, ensuring a clean and testable codebase.

### **Integrating TypeORM entities, repositories, and custom query builders**

* **Entities:** Core ActivityPub concepts—Actors, Activities, Objects, and Collections—should be mapped to TypeORM entities. This involves defining classes with @Entity decorators, and properties with @Column and relationship decorators (@OneToMany, @ManyToOne, etc.).36 As discussed, strategic use of JSONB columns within these entities is essential for handling the flexible ActivityStreams 2.0 payloads.  
* **Repositories:** TypeORM repositories provide an abstraction layer for database interactions. Custom repositories can be created to encapsulate complex ActivityPub-specific queries and business logic, such as retrieving an actor's entire outbox or handling polymorphic associations.46 This keeps the service layer focused on business rules rather than raw database operations.  
* **Query Builders:** For complex queries, especially those involving JSONB data, custom aggregations, or intricate joins, TypeORM's QueryBuilder should be utilized.36 While TypeORM provides a powerful API, developers may need to use raw SQL fragments within the query builder for advanced JSONB operators or specific performance optimizations not directly exposed by the ORM's fluent API.

### **Leveraging NestJS microservices for distributed tasks**

NestJS microservices are an excellent fit for handling the distributed and asynchronous nature of ActivityPub, particularly for computationally intensive or time-consuming tasks.

* **Asynchronous Processing:** By offloading tasks like fan-out activity delivery, media processing, remote object fetching, and large-scale data cleanup to microservices, the core API operations remain responsive.52 This decoupling prevents long-running operations from blocking the main event loop.  
* **Message Queues:** NestJS microservices can be configured to use message brokers like RabbitMQ or job queue systems like BullMQ (backed by Redis).52 RabbitMQ's  
  fanout exchanges are ideal for broadcasting activities to multiple consumer queues, while BullMQ offers advanced features like retries, rate limiting, and job scheduling for reliable background processing.  
* **Event-Driven Architecture:** Designing services to emit and consume events (e.g., ActivityCreatedEvent, UserFollowedEvent) fosters an event-driven architecture.4 This pattern naturally facilitates fan-out mechanisms and other distributed logic, where one event can trigger multiple asynchronous processes across different microservices or workers.

### **Robust error handling and dead-letter queues for message processing**

Effective error handling is critical for building resilient ActivityPub services.

* **Centralized Error Handling:** Implement global exception filters in NestJS to catch and format errors consistently across the application, ensuring that clients receive clear and structured responses regardless of the underlying error.89  
* **Microservice Error Handling:** Within microservice message handlers, RpcException should be used to propagate errors back through the message queue.52 This allows the message broker to handle retries or route failed messages appropriately, rather than crashing the worker process.  
* **Dead-Letter Queue Configuration:** As discussed in the security section, configuring RabbitMQ queues with x-dead-letter-exchange is a best practice.85 This automatically routes messages that cannot be processed (e.g., after multiple retries or due to invalid content) to a dedicated dead-letter queue. This mechanism is invaluable for debugging, auditing, and preventing system overload from persistent message failures.

## **VIII. Conclusion and Future Outlook**

Implementing the ActivityPub specification with NestJS and TypeORM presents a compelling opportunity to contribute to the decentralized social web, but it demands a sophisticated approach to database design and distributed systems. The architectural recommendations outlined in this report—namely, the adoption of a hybrid relational/JSONB schema, the strategic use of asynchronous fan-out with message queues, the implementation of a robust caching layer, and the application of advanced indexing and partitioning techniques—collectively form a blueprint for building scalable, performant, and resilient ActivityPub instances. These decisions directly address the inherent challenges of managing ActivityPub's flexible, graph-like data within a relational database, distributing high volumes of activities, and maintaining eventual consistency across federated instances.  
Despite these solutions, certain challenges and trade-offs remain. The concept of truly portable identity, where a user's entire social graph and content can seamlessly migrate between instances without loss or breakage, is still an evolving area.90 While ActivityPub supports basic account migration for followers, the comprehensive transfer of all historical data and relationships remains complex and often relies on implementation-specific solutions rather than native protocol features.1 Similarly, achieving complex cross-instance data synchronization and providing a globally consistent view of activity are difficult within the eventual consistency model, often requiring instances to develop their own caching or relay systems to alleviate load and improve user experience.5  
The landscape of decentralized social networking is continuously evolving. Emerging protocols, such as the AT Protocol, are explicitly designed to address some of ActivityPub's architectural limitations, particularly concerning account portability and the provision of global views of activity.90 These developments highlight the ongoing innovation in this space and underscore the need for ActivityPub implementations to maintain adaptable architectures. While ActivityPub remains the dominant standard for the Fediverse, future developments may necessitate further architectural adaptations, such as deeper integration with decentralized identifiers (DIDs) or more sophisticated caching and content delivery networks, to ensure long-term scalability and user experience in a truly distributed social ecosystem.

#### **Works cited**

1. ActivityPub \- Wikipedia, accessed July 18, 2025, [https://en.wikipedia.org/wiki/ActivityPub](https://en.wikipedia.org/wiki/ActivityPub)  
2. ActivityPub \- W3C, accessed July 18, 2025, [https://www.w3.org/TR/activitypub/](https://www.w3.org/TR/activitypub/)  
3. ActivityPub Client API: A Way Forward | Steve Bate, accessed July 18, 2025, [https://www.stevebate.net/activitypub-client-api-a-way-forward/](https://www.stevebate.net/activitypub-client-api-a-way-forward/)  
4. Fan-Out and Fan-In Patterns: Building a Personalized Feed in Laravel | by Vagelis Bisbikis, accessed July 18, 2025, [https://medium.com/@vagelisbisbikis/fan-out-and-fan-in-patterns-building-a-personalized-feed-in-laravel-676515f65e03](https://medium.com/@vagelisbisbikis/fan-out-and-fan-in-patterns-building-a-personalized-feed-in-laravel-676515f65e03)  
5. Some thoughts about ActivityPub \- GitHub Gist, accessed July 18, 2025, [https://gist.github.com/jdarcy/60107fe4e653819138396257df302eef](https://gist.github.com/jdarcy/60107fe4e653819138396257df302eef)  
6. Activity Pub vs Web Frameworks \- Dan Palmer, accessed July 18, 2025, [https://danpalmer.me/2023-01-08-activitypub-vs-web-frameworks/](https://danpalmer.me/2023-01-08-activitypub-vs-web-frameworks/)  
7. FAQ \- AT Protocol, accessed July 18, 2025, [https://atproto.com/guides/faq](https://atproto.com/guides/faq)  
8. What is Eventual Consistency? Definition & FAQs \- ScyllaDB, accessed July 18, 2025, [https://www.scylladb.com/glossary/eventual-consistency/](https://www.scylladb.com/glossary/eventual-consistency/)  
9. Is the architecture of the fediverse flawed? (And is AT the solution?) \- Reddit, accessed July 18, 2025, [https://www.reddit.com/r/fediverse/comments/1hwtjgd/is\_the\_architecture\_of\_the\_fediverse\_flawed\_and/](https://www.reddit.com/r/fediverse/comments/1hwtjgd/is_the_architecture_of_the_fediverse_flawed_and/)  
10. rwot5-boston/final-documents/activitypub-decentralized-distributed.md at master \- GitHub, accessed July 18, 2025, [https://github.com/WebOfTrustInfo/rwot5-boston/blob/master/final-documents/activitypub-decentralized-distributed.md](https://github.com/WebOfTrustInfo/rwot5-boston/blob/master/final-documents/activitypub-decentralized-distributed.md)  
11. Guide for new ActivityPub implementers, accessed July 18, 2025, [https://socialhub.activitypub.rocks/t/guide-for-new-activitypub-implementers/479](https://socialhub.activitypub.rocks/t/guide-for-new-activitypub-implementers/479)  
12. ActivityPub/Primer/Actors \- W3C Wiki, accessed July 18, 2025, [https://www.w3.org/wiki/ActivityPub/Primer/Actors](https://www.w3.org/wiki/ActivityPub/Primer/Actors)  
13. Activity Streams 2.0 \- W3C, accessed July 18, 2025, [https://www.w3.org/TR/activitystreams-core/](https://www.w3.org/TR/activitystreams-core/)  
14. ActivityPub/Primer/Activity Streams 2.0 \- W3C Wiki, accessed July 18, 2025, [https://www.w3.org/wiki/ActivityPub/Primer/Activity\_Streams\_2.0](https://www.w3.org/wiki/ActivityPub/Primer/Activity_Streams_2.0)  
15. Activity Streams 2.0 \- Medium, accessed July 18, 2025, [https://medium.com/@jasnell/activity-streams-2-0-70881f866935](https://medium.com/@jasnell/activity-streams-2-0-70881f866935)  
16. ActivityStreams 2.0 Terms \- W3C, accessed July 18, 2025, [https://www.w3.org/ns/activitystreams](https://www.w3.org/ns/activitystreams)  
17. reading-activitypub \- Tiny Subversions, accessed July 18, 2025, [https://tinysubversions.com/notes/reading-activitypub/](https://tinysubversions.com/notes/reading-activitypub/)  
18. digitalbazaar/jsonld.js: A JSON-LD Processor and API implementation in JavaScript \- GitHub, accessed July 18, 2025, [https://github.com/digitalbazaar/jsonld.js/](https://github.com/digitalbazaar/jsonld.js/)  
19. I Wrote an Activitypub Server in OCaml: Lessons Learnt, Weekends Lost | Hacker News, accessed July 18, 2025, [https://news.ycombinator.com/item?id=35675159](https://news.ycombinator.com/item?id=35675159)  
20. What is Schema Evolution in Graph Databases? \- Hypermode, accessed July 18, 2025, [https://hypermode.com/blog/schema-evolution](https://hypermode.com/blog/schema-evolution)  
21. How do you handle data schema evolution in your company? : r/dataengineering \- Reddit, accessed July 18, 2025, [https://www.reddit.com/r/dataengineering/comments/1j5j59f/how\_do\_you\_handle\_data\_schema\_evolution\_in\_your/](https://www.reddit.com/r/dataengineering/comments/1j5j59f/how_do_you_handle_data_schema_evolution_in_your/)  
22. UUID or GUID as Primary Keys? Be Careful\! | by Tom Harrison | Tom ..., accessed July 18, 2025, [https://tomharrisonjr.com/uuid-or-guid-as-primary-keys-be-careful-7b2aa3dcb439](https://tomharrisonjr.com/uuid-or-guid-as-primary-keys-be-careful-7b2aa3dcb439)  
23. Optimizing SQL Queries by 23x\!\!\! \- Medium, accessed July 18, 2025, [https://medium.com/@navneetsingh969/so-i-have-been-into-web-dev-for-about-3-years-now-and-professionally-for-more-than-a-year-this-was-7d604eb81df6](https://medium.com/@navneetsingh969/so-i-have-been-into-web-dev-for-about-3-years-now-and-professionally-for-more-than-a-year-this-was-7d604eb81df6)  
24. Conflicts with JSON-LD specification regarding object identifiers for anonymous objects · Issue \#476 · w3c/activitypub \- GitHub, accessed July 18, 2025, [https://github.com/w3c/activitypub/issues/476](https://github.com/w3c/activitypub/issues/476)  
25. Portable Identity for ActivityPub \- Shadowfacts, accessed July 18, 2025, [https://shadowfacts.net/2023/activitypub-portable-identity/](https://shadowfacts.net/2023/activitypub-portable-identity/)  
26. The Definitive Guide to Canonicalizing in SEO \- Neil Patel, accessed July 18, 2025, [https://neilpatel.com/blog/canonicalization/](https://neilpatel.com/blog/canonicalization/)  
27. Exploring ActivityPub/ActivityStreams \- Tim's blog, accessed July 18, 2025, [https://blog.thechases.com/posts/activitypub-activitystreams/](https://blog.thechases.com/posts/activitypub-activitystreams/)  
28. How to best normalize URLs \- Stack Overflow, accessed July 18, 2025, [https://stackoverflow.com/questions/2098533/how-to-best-normalize-urls](https://stackoverflow.com/questions/2098533/how-to-best-normalize-urls)  
29. Experiences writing an ActivityPub server in Python with Django | Check my working, accessed July 18, 2025, [https://checkmyworking.com/posts/2023/02/experiences-writing-an-activitypub-server-in-python-with-django/](https://checkmyworking.com/posts/2023/02/experiences-writing-an-activitypub-server-in-python-with-django/)  
30. ActivityPub and WebFinger \- W3C, accessed July 18, 2025, [https://www.w3.org/community/reports/socialcg/CG-FINAL-apwf-20240608/](https://www.w3.org/community/reports/socialcg/CG-FINAL-apwf-20240608/)  
31. Graph vs Relational Databases \- Difference Between Databases \- AWS, accessed July 18, 2025, [https://aws.amazon.com/compare/the-difference-between-graph-and-relational-database/](https://aws.amazon.com/compare/the-difference-between-graph-and-relational-database/)  
32. Graph Database vs. Relational Database: What's The Difference? \- Neo4j, accessed July 18, 2025, [https://neo4j.com/blog/graph-database/graph-database-vs-relational-database/](https://neo4j.com/blog/graph-database/graph-database-vs-relational-database/)  
33. Modeling: relational to graph \- Getting Started \- Neo4j, accessed July 18, 2025, [https://neo4j.com/docs/getting-started/data-modeling/relational-to-graph-modeling/](https://neo4j.com/docs/getting-started/data-modeling/relational-to-graph-modeling/)  
34. Using JSONB in PostgreSQL: How to Effectively Store & Index JSON Data in PostgreSQL, accessed July 18, 2025, [https://dev.to/scalegrid/using-jsonb-in-postgresql-how-to-effectively-store-index-json-data-in-postgresql-5d7e](https://dev.to/scalegrid/using-jsonb-in-postgresql-how-to-effectively-store-index-json-data-in-postgresql-5d7e)  
35. JSONB PostgreSQL: How To Store & Index JSON Data \- ScaleGrid, accessed July 18, 2025, [https://scalegrid.io/blog/using-jsonb-in-postgresql-how-to-effectively-store-index-json-data-in-postgresql/](https://scalegrid.io/blog/using-jsonb-in-postgresql-how-to-effectively-store-index-json-data-in-postgresql/)  
36. TypeORM \- Code with Confidence. Query with Power. | TypeORM, accessed July 18, 2025, [https://typeorm.io/](https://typeorm.io/)  
37. TypeORM Query Builder Wrapper \- Medium, accessed July 18, 2025, [https://medium.com/@arjunsumarlan/typeorm-query-builder-wrapper-48ac143706a5](https://medium.com/@arjunsumarlan/typeorm-query-builder-wrapper-48ac143706a5)  
38. TypeORM | Query Builder \- DEV Community, accessed July 18, 2025, [https://dev.to/shahjalalbu/typeorm-query-builder-1p2o](https://dev.to/shahjalalbu/typeorm-query-builder-1p2o)  
39. PostgreSQL JSON Index \- Neon, accessed July 18, 2025, [https://neon.com/postgresql/postgresql-indexes/postgresql-json-index](https://neon.com/postgresql/postgresql-indexes/postgresql-json-index)  
40. Indexing PostgreSQL JSONB columns | Objection.js \- GitHub Pages, accessed July 18, 2025, [https://vincit.github.io/objection.js/recipes/indexing-postgresql-jsonb-columns.html](https://vincit.github.io/objection.js/recipes/indexing-postgresql-jsonb-columns.html)  
41. Postgres pg\_trgm type of index · Issue \#1519 · typeorm/typeorm \- GitHub, accessed July 18, 2025, [https://github.com/typeorm/typeorm/issues/1519](https://github.com/typeorm/typeorm/issues/1519)  
42. Adding index on jsonb field fail when running migration \- Stack Overflow, accessed July 18, 2025, [https://stackoverflow.com/questions/71572029/adding-index-on-jsonb-field-fail-when-running-migration](https://stackoverflow.com/questions/71572029/adding-index-on-jsonb-field-fail-when-running-migration)  
43. A Comparative Analysis of Decentralized Social Protocols | by Justin McAfee | 1kxnetwork, accessed July 18, 2025, [https://medium.com/1kxnetwork/a-comparative-analysis-of-decentralized-social-protocols-84914d9fca83](https://medium.com/1kxnetwork/a-comparative-analysis-of-decentralized-social-protocols-84914d9fca83)  
44. Deduplication \- Ceph Documentation, accessed July 18, 2025, [https://docs.ceph.com/en/quincy/dev/deduplication/](https://docs.ceph.com/en/quincy/dev/deduplication/)  
45. P-Dedupe: Exploiting Parallelism in Data Deduplication System \- Wen Xia, accessed July 18, 2025, [https://cswxia.github.io/pub/NAS-P-Dedupe-2012.pdf](https://cswxia.github.io/pub/NAS-P-Dedupe-2012.pdf)  
46. typeorm-polymorphic \- npm, accessed July 18, 2025, [https://www.npmjs.com/package/typeorm-polymorphic](https://www.npmjs.com/package/typeorm-polymorphic)  
47. API with NestJS \#146. Polymorphic associations with PostgreSQL and Prisma, accessed July 18, 2025, [https://wanago.io/2024/02/19/api-nestjs-postgresql-prisma-polymorphic-associations/](https://wanago.io/2024/02/19/api-nestjs-postgresql-prisma-polymorphic-associations/)  
48. Database schema and queries for activity stream in social network \- Stack Overflow, accessed July 18, 2025, [https://stackoverflow.com/questions/29027680/database-schema-and-queries-for-activity-stream-in-social-network](https://stackoverflow.com/questions/29027680/database-schema-and-queries-for-activity-stream-in-social-network)  
49. ActivityPub \- Mastodon documentation, accessed July 18, 2025, [https://docs.joinmastodon.org/spec/activitypub/](https://docs.joinmastodon.org/spec/activitypub/)  
50. Query caching using Nest.js and Typeorm \- WorkOS, accessed July 18, 2025, [https://workos.com/blog/query-caching-nest-js-and-typeorm](https://workos.com/blog/query-caching-nest-js-and-typeorm)  
51. ActivityPub \- Mastodon documentation, accessed July 18, 2025, [https://docs-p.joinmastodon.org/spec/activitypub/](https://docs-p.joinmastodon.org/spec/activitypub/)  
52. RabbitMQ \- Microservices | NestJS \- A progressive Node.js framework, accessed July 18, 2025, [https://docs.nestjs.com/microservices/rabbitmq](https://docs.nestjs.com/microservices/rabbitmq)  
53. Create NestJS Microservices using RabbitMQ \- Part 2 \- DEV Community, accessed July 18, 2025, [https://dev.to/hmake98/create-nestjs-microservices-using-rabbitmq-part-2-121b](https://dev.to/hmake98/create-nestjs-microservices-using-rabbitmq-part-2-121b)  
54. Enhanced RabbitMQ Transport for NestJS: Supporting Topic, Fanout, and Direct Exchanges with @nestjstools/microservices-rabbitmq \- Reddit, accessed July 18, 2025, [https://www.reddit.com/r/nestjs/comments/1j1d8su/enhanced\_rabbitmq\_transport\_for\_nestjs\_supporting/](https://www.reddit.com/r/nestjs/comments/1j1d8su/enhanced_rabbitmq_transport_for_nestjs_supporting/)  
55. Using BullMQ with NestJS for Background Job Processing \- Mahabubur Rahman \- Medium, accessed July 18, 2025, [https://mahabub-r.medium.com/using-bullmq-with-nestjs-for-background-job-processing-320ab938048a](https://mahabub-r.medium.com/using-bullmq-with-nestjs-for-background-job-processing-320ab938048a)  
56. BullMQ \- Background Jobs processing and message queue for NodeJS | BullMQ, accessed July 18, 2025, [https://bullmq.io/](https://bullmq.io/)  
57. Job Scheduling in Node.js with BullMQ | Better Stack Community, accessed July 18, 2025, [https://betterstack.com/community/guides/scaling-nodejs/bullmq-scheduled-tasks/](https://betterstack.com/community/guides/scaling-nodejs/bullmq-scheduled-tasks/)  
58. Building a Scalable Queue System with NestJS & BullMQ & Redis \- YouTube, accessed July 18, 2025, [https://www.youtube.com/watch?v=vFI\_Nf2PWFQ](https://www.youtube.com/watch?v=vFI_Nf2PWFQ)  
59. Groups | BullMQ, accessed July 18, 2025, [https://docs.bullmq.io/bullmq-pro/groups](https://docs.bullmq.io/bullmq-pro/groups)  
60. NodeJS , RabbitMQ Fanout Exchange Example \- YouTube, accessed July 18, 2025, [https://www.youtube.com/watch?v=YT9pbes8vuc](https://www.youtube.com/watch?v=YT9pbes8vuc)  
61. Using RabbitMQ with Node.js: A Complete Guide \- DEV Community, accessed July 18, 2025, [https://dev.to/pawandeore/using-rabbitmq-with-nodejs-a-complete-guide-48ej](https://dev.to/pawandeore/using-rabbitmq-with-nodejs-a-complete-guide-48ej)  
62. Got an interesting question today about \#Fedify's outgoing \#queue design\! | NodeBB Community, accessed July 18, 2025, [https://community.nodebb.org/post/103747](https://community.nodebb.org/post/103747)  
63. Top Eventual Consistency Patterns You Must Know \- ByteByteGo, accessed July 18, 2025, [https://bytebytego.com/guides/top-eventual-consistency-patterns-you-must-know/](https://bytebytego.com/guides/top-eventual-consistency-patterns-you-must-know/)  
64. Caching | NestJS \- A progressive Node.js framework, accessed July 18, 2025, [https://docs.nestjs.com/techniques/caching](https://docs.nestjs.com/techniques/caching)  
65. Using Redis with NestJS: Caching and Pub/Sub | by @rnab \- Medium, accessed July 18, 2025, [https://arnab-k.medium.com/using-redis-with-nestjs-caching-and-pub-sub-649a45ec7dc2](https://arnab-k.medium.com/using-redis-with-nestjs-caching-and-pub-sub-649a45ec7dc2)  
66. How to implement Caching in Nestjs \- YouTube, accessed July 18, 2025, [https://www.youtube.com/watch?v=HUpVbvXSPwQ](https://www.youtube.com/watch?v=HUpVbvXSPwQ)  
67. activitypub-express \- npm, accessed July 18, 2025, [https://www.npmjs.com/package/activitypub-express](https://www.npmjs.com/package/activitypub-express)  
68. Unlocking Performance: A Deep Dive into Table Partitioning in PostgreSQL \- Medium, accessed July 18, 2025, [https://medium.com/simform-engineering/unlocking-performance-a-deep-dive-into-table-partitioning-in-postgresql-3f5b8faa025f](https://medium.com/simform-engineering/unlocking-performance-a-deep-dive-into-table-partitioning-in-postgresql-3f5b8faa025f)  
69. Documentation: 17: 5.12. Table Partitioning \- PostgreSQL, accessed July 18, 2025, [https://www.postgresql.org/docs/current/ddl-partitioning.html](https://www.postgresql.org/docs/current/ddl-partitioning.html)  
70. Partitioning a large table in PostgreSQL with Rails \- Aha.io, accessed July 18, 2025, [https://www.aha.io/engineering/articles/partitioning-a-large-table-in-postgresql-with-rails](https://www.aha.io/engineering/articles/partitioning-a-large-table-in-postgresql-with-rails)  
71. Soft Delete | Nestjs-query \- GitHub Pages, accessed July 18, 2025, [https://tripss.github.io/nestjs-query/docs/persistence/typeorm/soft-delete](https://tripss.github.io/nestjs-query/docs/persistence/typeorm/soft-delete)  
72. Soft Delete Support (TypeORM) · Issue \#433 · nestjsx/crud \- GitHub, accessed July 18, 2025, [https://github.com/nestjsx/crud/issues/433](https://github.com/nestjsx/crud/issues/433)  
73. Soft delete based on the column value · Issue \#8735 \- GitHub, accessed July 18, 2025, [https://github.com/typeorm/typeorm/issues/8735](https://github.com/typeorm/typeorm/issues/8735)  
74. Data Retention Policy: 10 Best Practices \- FileCloud, accessed July 18, 2025, [https://www.filecloud.com/blog/2025/05/data-retention-policy-best-practices/](https://www.filecloud.com/blog/2025/05/data-retention-policy-best-practices/)  
75. \[Core feature\] Support for Postgres database pruning / data retention · Issue \#6360 \- GitHub, accessed July 18, 2025, [https://github.com/flyteorg/flyte/issues/6360](https://github.com/flyteorg/flyte/issues/6360)  
76. Backfilling Conversations: Two Major Approaches \- NodeBB \- SocialHub, accessed July 18, 2025, [https://socialhub.activitypub.rocks/t/backfilling-conversations-two-major-approaches/5363](https://socialhub.activitypub.rocks/t/backfilling-conversations-two-major-approaches/5363)  
77. Configuration — Pleroma v1.1.9-10-g42f76306+dev, accessed July 18, 2025, [https://docs.pleroma.social/config.html](https://docs.pleroma.social/config.html)  
78. 1kx: An in-depth interpretation of decentralized social protocols, accessed July 18, 2025, [https://www.odaily.news/en/post/5191391](https://www.odaily.news/en/post/5191391)  
79. (NestJS-17) Persistent Dynamic Jobs — Part 2: Cron, Interval, Timeout with MySQL & TypeORM | by Bhargava Chary | Jul, 2025, accessed July 18, 2025, [https://bhargavacharyb.medium.com/nestjs-17-persistent-dynamic-jobs-part-2-cron-interval-timeout-with-mysql-typeorm-02dcae509580](https://bhargavacharyb.medium.com/nestjs-17-persistent-dynamic-jobs-part-2-cron-interval-timeout-with-mysql-typeorm-02dcae509580)  
80. Task Scheduling | NestJS \- A progressive Node.js framework, accessed July 18, 2025, [https://docs.nestjs.com/techniques/task-scheduling](https://docs.nestjs.com/techniques/task-scheduling)  
81. Fediverse: Exploring the Federated Web & A Beginner's Guide to ActivityPub Development, accessed July 18, 2025, [https://dev.to/austinwdigital/fediverse-exploring-the-federated-web-a-beginners-guide-to-activitypub-development-2hc8](https://dev.to/austinwdigital/fediverse-exploring-the-federated-web-a-beginners-guide-to-activitypub-development-2hc8)  
82. HTTP Signature Upgrades Coming Soon | NodeBB Community, accessed July 18, 2025, [https://community.nodebb.org/topic/e9dbb7f1-557a-442e-aeb9-e96f28b6afc3/http-signature-upgrades-coming-soon](https://community.nodebb.org/topic/e9dbb7f1-557a-442e-aeb9-e96f28b6afc3/http-signature-upgrades-coming-soon)  
83. activitypub-http-signatures \- NPM, accessed July 18, 2025, [https://www.npmjs.com/package/activitypub-http-signatures](https://www.npmjs.com/package/activitypub-http-signatures)  
84. An JavaScript (Node.js and browsers) implementation for HTTP Message Signatures (RFC 9421\) \- GitHub, accessed July 18, 2025, [https://github.com/misskey-dev/node-http-message-signatures](https://github.com/misskey-dev/node-http-message-signatures)  
85. Dead Letter Exchanges \- RabbitMQ, accessed July 18, 2025, [https://www.rabbitmq.com/docs/dlx](https://www.rabbitmq.com/docs/dlx)  
86. Example of a node-amqp subscriber with dead lettering \- GitHub Gist, accessed July 18, 2025, [https://gist.github.com/jazlalli/6510962](https://gist.github.com/jazlalli/6510962)  
87. Getting Started \- TypeORM, accessed July 18, 2025, [https://typeorm.io/docs/getting-started/](https://typeorm.io/docs/getting-started/)  
88. Decorator reference | TypeORM Docs, accessed July 18, 2025, [https://typeorm.biunav.com/en/decorator-reference.html](https://typeorm.biunav.com/en/decorator-reference.html)  
89. Error Handling in NestJS: Best Practices and Examples \- DEV Community, accessed July 18, 2025, [https://dev.to/geampiere/error-handling-in-nestjs-best-practices-and-examples-5e76](https://dev.to/geampiere/error-handling-in-nestjs-best-practices-and-examples-5e76)  
90. Okay well. I work on Bluesky and helped build the AT Protocol. I'm sorry Sam dif... \- Hacker News, accessed July 18, 2025, [https://news.ycombinator.com/item?id=35881905](https://news.ycombinator.com/item?id=35881905)