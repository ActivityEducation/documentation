---
title: Real-Time Communication
---

# **Architecting Federated Real-Time Communication for EducationPub: A Strategic Implementation Blueprint**

## **Section 1: Defining Core Requirements for Real-Time Educational Communication**

The successful integration of real-time communication into the EducationPub platform hinges on a deep understanding of its specific educational use cases. A feature that merely facilitates video and audio transmission will fall short of user expectations, which are shaped by sophisticated, purpose-built virtual learning environments. This section establishes the foundational requirements by analyzing key pedagogical scenarios, benchmarking against successful open-source platforms, and defining a concrete set of functional and non-functional requirements that will guide the architectural decisions of this report.

### **1.1 Analysis of Educational Use Cases**

The proposed WebRTC feature must cater to a spectrum of interactions, from intimate one-on-one sessions to structured, large-group instruction. Each use case presents distinct technical and functional demands.

#### **1.1.1 One-to-One Tutoring & Language Practice**

This is the most fundamental use case, designed for scenarios like personalized tutoring, mentorship, or peer-to-peer language practice. The primary technical priorities are exceptionally low latency and high-fidelity audio and video to facilitate nuanced conversation and clear pronunciation. The user experience must be simple and immediate, allowing two users, potentially on different federated EducationPub instances, to connect with minimal friction. This use case offers a direct opportunity to integrate with EducationPub's existing asynchronous learning tools. For instance, a live session could be initiated directly from a "pronunciation exercise" or a "writing prompt" to provide real-time feedback, creating a powerful blend of synchronous and asynchronous learning activities.

#### **1.1.2 Small Group Collaboration (2-10 users)**

This scenario supports collaborative learning activities, such as small language practice groups, project team meetings, or peer review sessions. It introduces the complexity of managing multiple media streams simultaneously. While still prioritizing low latency, the system must gracefully handle the increased load on both the client and the network. This use case also brings the first requirement for basic moderation tools. A designated leader or the session creator should have the ability to mute participants to manage background noise or guide the conversation, a foundational element of effective group management.

#### **1.1.3 Structured Virtual Classroom (10-50+ users)**

This is the most demanding use case and positions EducationPub to compete directly with established virtual classroom platforms. It involves a one-to-many or few-to-many communication model, where one or more instructors present to a larger audience of students. This scenario fundamentally shifts the architectural requirements towards scalability and robust classroom management features. The system must efficiently distribute a few primary media streams (the instructors) to many viewers while selectively allowing students to participate via audio or video. This use case is the primary driver for needing an advanced media server architecture and a rich set of interactive and moderation tools to maintain engagement and order.

### **1.2 Feature Benchmarking Against Successful Platforms**

To define a feature set that will be considered valuable and competitive, it is essential to analyze platforms that have achieved widespread adoption in educational and collaborative contexts. BigBlueButton and Jitsi Meet, both open-source, provide excellent benchmarks for what EducationPub should aspire to.  
BigBlueButton (BBB) stands out as a pedagogy-first platform, designed explicitly for online learning rather than general-purpose web conferencing.1 Its success is rooted in a feature set that promotes active learning and student engagement. Core to its value are interactive tools like a multi-user whiteboard for collaborative problem-solving, breakout rooms for focused group work, shared notes for collective documentation, and live polling to gauge understanding in real-time.1 Furthermore, BBB provides educators with strong moderation and control features, such as the ability to lock settings (e.g., mute all participants, disable private chat), which are critical for managing a structured classroom environment.4 Its deep integration with Learning Management Systems (LMS) like Moodle and Canvas underscores the importance of embedding communication directly within the learning workflow, a principle EducationPub should emulate.1  
Jitsi Meet, in contrast, prioritizes simplicity, accessibility, and developer-friendliness.8 Its key strengths are its lightweight nature and ease of use; the public instance requires no account, and meetings are started via simple, custom URLs, making it highly accessible.8 It provides excellent core conferencing features like high-quality audio/video, screen sharing, and chat.8 While it lacks the rich, built-in pedagogical tools of BBB, its open and extensible architecture allows for such features to be integrated, for example, by adding a third-party whiteboard application.9 Architecturally, Jitsi's design, centered on the scalable Jitsi Videobridge (JVB), makes it a robust foundation for building large-scale conferencing services.12  
The analysis of these two platforms reveals a clear path for EducationPub: to combine the pedagogical richness of BigBlueButton with the modern, federated, and secure architectural principles that a platform like Jitsi represents.

| Feature | BigBlueButton | Jitsi Meet | Proposed for EducationPub (via Matrix) |
| :---- | :---- | :---- | :---- |
| **Multi-User Whiteboard** | Yes (Native, core feature) 3 | No (Requires 3rd-party integration) 9 | **Yes** (Via Matrix Widgets) |
| **Breakout Rooms** | Yes (Native, core feature) 1 | No | **Yes** (Via temporary Matrix rooms) |
| **Live Polling** | Yes (Native) 4 | No | **Yes** (Via Matrix Widgets/Events) |
| **Shared Notes** | Yes (Native) 3 | Yes (Via Etherpad integration) 8 | **Yes** (Via Matrix Widgets) |
| **Session Recording** | Yes (Server-side) 1 | Yes (Requires Jibri component) 14 | **Yes** (Via SFU/Bridge component) |
| **Advanced Moderation** | Yes (Lock settings, mute all) 4 | Basic (Mute, kick) | **Yes** (Via Matrix power levels) |
| **Federated Identity** | No | No | **Yes** (Native to Matrix) |
| **End-to-End Encryption** | No | Yes (For 1:1) 9 | **Yes** (For all call types via MatrixRTC) |

*Table 1: Feature Comparison of Leading Open-Source Communication Platforms*

### **1.3 Establishing Functional and Non-Functional Requirements**

Based on the use case analysis and competitive benchmarking, the following requirements are established to guide the development of the real-time communication feature for EducationPub.

#### **Functional Requirements (FR)**

* **FR1:** Users must be able to initiate one-to-one and group audio/video calls.  
* **FR2:** Users must be able to discover and call other users on different federated EducationPub instances using their platform identifier (e.g., @username:instance.name).  
* **FR3:** The system must support in-call text chat, available to the main room and within breakout rooms.  
* **FR4:** The system must support high-quality screen sharing from participants.  
* **FR5:** The system must provide a collaborative multi-user whiteboard that persists with the session.  
* **FR6:** Moderators (e.g., teachers) must be able to create, manage, and assign participants to breakout rooms.  
* **FR7:** Moderators must possess in-call controls, including the ability to mute a participant, request a participant to stop their video, remove a participant from the call, and end the call for all participants.  
* **FR8:** Any participant must be able to report another user for inappropriate behavior during a call, with the report being routed to the appropriate instance administrators.

#### **Non-Functional Requirements (NFR)**

* **NFR1 (Federation):** The entire feature set, including call initiation, interactive tools, and moderation, must operate seamlessly and natively across the federated network of independent EducationPub instances.  
* **NFR2 (Security):** All signaling and media traffic must be encrypted in transit. The architecture must support end-to-end encryption (E2EE) for all call types (1:1, group, and classroom) as a primary design goal, ensuring that not even the server administrators can access the content of the communications.15  
* **NFR3 (Scalability):** The architecture must be capable of scaling efficiently from simple 1:1 calls to structured virtual classrooms supporting at least 50 concurrent participants, with a clear path to supporting larger numbers in the future.  
* **NFR4 (Performance):** End-to-end latency for media streams must be minimized to a level that supports natural, real-time conversation without perceptible delay. The system must also gracefully handle varying network conditions across participants.17  
* **NFR5 (Interoperability):** The solution must be built upon open standards, primarily WebRTC, to ensure long-term viability, prevent vendor lock-in, and maintain compatibility with the broader web ecosystem.17  
* **NFR6 (Usability):** The user interface (UI) and user experience (UX) for discovering users, initiating calls, and interacting with in-call features must be intuitive, accessible, and seamlessly integrated into the existing EducationPub platform aesthetic and workflow.19

The established requirements make it clear that the challenge is not merely technical but also pedagogical. A simple video call button will not suffice. To be successful, EducationPub must build a virtual classroom. This necessitates an architectural foundation that is more than a simple signaling layer; it must be a flexible and powerful framework for real-time state synchronization capable of powering rich, interactive features. This understanding shifts the focus from building a "WebRTC feature" to adopting a comprehensive "real-time communication protocol."

## **Section 2: Architectural Paradigms for Federated WebRTC**

Integrating WebRTC into a federated platform like EducationPub requires careful architectural planning that goes far beyond the client-side APIs. The core components of any WebRTC service—signaling, media routing, and NAT traversal—must be explicitly designed to operate in a decentralized environment. This section dissects these components, analyzes the architectural choices, and highlights the unique challenges posed by federation.

### **2.1 The Crux of the Matter: Designing the Signaling Layer for Federation**

A common misconception is that WebRTC is a self-contained, standalone communication protocol. In reality, it is a collection of W3C and IETF standards and APIs that enable direct, peer-to-peer media exchange between browsers *after* a connection has been negotiated.21 Critically, the WebRTC specification deliberately does not define the protocol used for this initial negotiation, which is known as "signaling".23  
The signaling server acts as an essential intermediary, a digital meeting point where potential peers can discover each other and exchange the metadata required to establish a connection. This metadata includes the Session Description Protocol (SDP) offer and answer, which describe the media capabilities of each client (e.g., codecs, resolutions), and Interactive Connectivity Establishment (ICE) candidates, which contain the network addresses that peers can use to attempt a direct connection.17  
For a centralized application, implementing a signaling server is straightforward. However, for EducationPub, a centralized model is antithetical to its core principle of federation. The architecture must allow a user on instance-a.com to seamlessly initiate a call with a user on instance-b.com. This requires a standardized communication protocol between the independent server instances. RFC 8827, which defines the WebRTC security architecture, explicitly illustrates this "multidomain" topology and notes that the protocol used between servers is likely to be something like the Session Initiation Protocol (SIP) or the Extensible Messaging and Presence Protocol (XMPP).15  
While purely decentralized signaling mechanisms using Distributed Hash Tables (DHTs) exist, they introduce significant complexity and potential reliability issues that may not be suitable for a platform requiring stable educational interactions.24 A federated model, where each EducationPub instance operates a signaling server for its own users and communicates with other instances via a well-defined server-to-server protocol, represents a more robust, manageable, and resilient architectural pattern.

### **2.2 Media Flow Architectures: Peer-to-Peer (Mesh) vs. Selective Forwarding Unit (SFU)**

Once signaling is complete, the media streams must be exchanged. There are two primary architectural models for handling this media flow in a multi-party call.  
A **Peer-to-Peer (P2P) or Mesh** architecture is the simplest model conceptually. Every participant in the call establishes a direct connection with every other participant, sending and receiving media streams to and from each of them. While this can offer the lowest possible latency in ideal network conditions and avoids the cost of a central media server, it scales very poorly. In a call with N users, each client must manage N−1 upstream and N−1 downstream connections. The client's CPU load and, more critically, its upload bandwidth become a bottleneck very quickly. This makes the mesh model fundamentally unsuitable for the "Structured Virtual Classroom" use case and challenging even for small groups, especially on mobile devices or networks with limited upload capacity.17  
A **Selective Forwarding Unit (SFU)** architecture solves this scaling problem. In this model, each participant sends their audio and video stream a single time to a central media server, the SFU. The SFU then becomes responsible for forwarding those streams to all other participants in the call. This approach is dramatically more efficient for the client, as it only ever needs to maintain one upstream connection, regardless of the number of participants. The SFU model is the industry standard for modern multi-party video conferencing and is essential for enabling server-side features like recording and live streaming. While it introduces a server dependency and can add a marginal amount of latency compared to a direct P2P connection, its scalability benefits are non-negotiable for meeting EducationPub's requirements.17  
The choice between these two models is a critical architectural decision, with clear trade-offs summarized below.

| Criterion | Mesh (Peer-to-Peer) | Selective Forwarding Unit (SFU) |
| :---- | :---- | :---- |
| **Scalability (Users)** | Poor (Practically limited to \< 5-8 users) | Excellent (Scales to hundreds of users) |
| **Client CPU/Bandwidth Load** | High (O(N) connections per client) | Low (O(1) upstream connection per client) |
| **Server Cost & Complexity** | Low (No media server required) | High (Requires deployment and scaling of SFU servers) |
| **Latency** | Lowest (Direct path) | Low (Adds one server hop) |
| **Suitability for 1:1 Tutoring** | Excellent | Excellent |
| **Suitability for Group Classroom** | Unsuitable | Essential |

*Table 2: WebRTC Media Architecture Trade-offs for EducationPub*  
Given the platform's defined use cases, particularly the need to support virtual classrooms, an SFU-based architecture is the only viable path forward. The implementation plan must therefore include the deployment and management of SFU servers.

### **2.3 Operational Strategy for STUN/TURN Services in a Federated Network**

WebRTC's ability to create peer-to-peer connections often runs into a major obstacle: Network Address Translation (NAT). Most devices on the internet are behind a NAT router, which means they don't have a unique, public IP address. To solve this, WebRTC relies on two supporting server types: STUN and TURN.  
A **STUN (Session Traversal Utilities for NAT)** server has a simple job: it helps a client discover its public IP address and port by telling the client what address it saw the request come from. This works for many types of NAT, but not all.27  
When a direct connection is impossible even with the help of STUN (often due to "symmetric NATs" or restrictive firewalls), a **TURN (Traversal Using Relays around NAT)** server is required. A TURN server acts as a media relay; both clients connect to the TURN server, which then forwards all media packets between them. While this ensures a connection can almost always be established, it comes at the cost of increased latency and significant server bandwidth. Data suggests that TURN may be required for up to 30% of all connections, making it an essential component for a reliable service.27  
In a federated network like EducationPub, the deployment of these services requires a clear strategy:

* **Instance-Level Deployment:** Each EducationPub instance administrator SHOULD run their own combined STUN/TURN server. Open-source software like coturn is robust, well-documented, and can be installed and configured with relative ease.28 The resource requirements for a STUN server are negligible, and a TURN server can be run on a low-cost VPS, making this feasible for individual instance operators.22  
* **Federated Discovery and Authentication:** The primary challenge is not deployment, but cross-instance usage. A client on instance A may need to connect to a client on instance B, but both are behind symmetric NATs. The most efficient path might be for both to use the TURN server on instance A (or B). This creates two problems: discovery and authentication.  
  1. **Discovery:** How does instance B know the address of instance A's TURN server? This information must be discoverable as part of the federation protocol. An instance should publish the location and capabilities of its STUN/TURN services in a way that other trusted instances can query.  
  2. **Authentication:** TURN servers require credentials to prevent abuse.29 It is not feasible or secure for instance B's user to have a permanent account on instance A's TURN server. Therefore, the signaling protocol must support the negotiation of temporary, time-limited credentials during the call setup process. Instance A's signaling server would generate these credentials and pass them securely to instance B's user, granting them temporary access to its TURN relay for the duration of that specific call.

All communication with TURN servers must be secured using TLS, and servers should be hardened by limiting port exposure and actively monitoring logs for signs of misuse or attack.27  
The analysis of these three core components—signaling, media routing (SFU), and NAT traversal (STUN/TURN)—reveals a deep interconnection. They cannot be treated as independent problems to be solved. A federated signaling protocol needs to orchestrate SFU selection and securely negotiate credentials for TURN servers that may be hosted on different, independent instances. This points away from a simplistic, custom-built signaling solution and toward the need for a comprehensive, integrated federation protocol that addresses all these challenges holistically.

## **Section 3: In-Depth Evaluation of the Matrix Protocol for EducationPub**

The architectural challenges outlined in the previous section—federated signaling, scalable media routing, and secure NAT traversal—demand a holistic solution. A custom-built protocol to address these interconnected issues would be a monumental undertaking, fraught with complexity and risk. This evaluation proposes that the Matrix protocol is not merely a suitable choice, but the ideal foundation for EducationPub's real-time communication features. Matrix offers a mature, open-standard, and natively federated framework that solves these problems by design, aligning perfectly with EducationPub's core principles.

### **3.1 Matrix Architecture: A Philosophical and Technical Mirror of EducationPub**

Matrix is an open standard for secure, decentralized, real-time communication over IP.18 Its architecture is fundamentally aligned with the federated model of EducationPub. The core components are:

* **Clients:** User-facing applications (web, mobile, desktop).  
* **Homeservers:** The server that a user registers on. Each EducationPub instance would run its own homeserver. It stores the user's account data and conversation history.30  
* **Federation:** Homeservers communicate with each other via a standardized Server-Server API, allowing users on different homeservers to communicate seamlessly.18

Unlike protocols where federation is an optional extension, in Matrix, it is the default operational mode. Communication occurs within "rooms," which are not owned by any single server. Instead, the history and state of a room are replicated across all homeservers that have a user participating in that room.31 This "shared-nothing" architecture ensures there is no single point of control or failure; if a homeserver goes offline, the conversation can continue among the remaining participants, and the offline server will re-synchronize when it comes back online.33  
This model is built on the concept of synchronizing a directed acyclic graph (DAG) of JSON objects called "events".31 This is a profoundly powerful primitive. It goes beyond simply passing transient messages; it allows for the reliable, eventually-consistent replication of a room's entire state, including its name, topic, membership list, and permissions. This robustness against network partitions and its inherent state synchronization capabilities make it a perfect technical and philosophical match for EducationPub's federated ecosystem.

### **3.2 MatrixRTC: The Future of Native, Encrypted, and Federated VoIP/Video**

Historically, a significant limitation of Matrix for group voice and video was its reliance on bridging to third-party conferencing systems like Jitsi.18 This approach was functional but lacked deep integration, native end-to-end encryption, and was often complex to configure.  
The introduction of **MatrixRTC** (formalized in Matrix Specification Change proposal MSC4143) fundamentally changes this landscape. MatrixRTC is a new standard for native, end-to-end-encrypted group voice and video conferencing that operates directly over the Matrix protocol.34 This development is the single most compelling reason for its adoption by EducationPub.  
Crucially, MatrixRTC is designed from the ground up to integrate with modern, scalable media architectures. The primary implementation uses the popular open-source **LiveKit SFU** as its media backend (defined in MSC4195).35 This provides a clear, standardized, and high-performance path to building the required "Structured Virtual Classroom" functionality.  
The most elegant aspect of MatrixRTC is its solution to the federated SFU discovery and selection problem. The process is both simple and effective:

1. A homeserver administrator deploys a LiveKit SFU and advertises its availability and JWT authentication endpoint in the homeserver's public .well-known/matrix/client file.35  
2. When a user initiates a call, their client discovers the SFUs available via their own homeserver.  
3. During the call setup within a Matrix room, the protocol dictates that the SFU associated with the **first participant to join the call** is selected as the "focus" for that session. This choice is communicated to all other participants via a state event (foci\_preferred key).35

This mechanism provides a deterministic and decentralized way to select a single SFU for the call, solving a complex coordination problem that would otherwise require a custom, and likely fragile, solution.

### **3.3 Federated Call Establishment and User Discovery Across EducationPub Nodes**

Matrix provides a built-in, federated identity system that is a perfect analog for EducationPub's user model. A Matrix ID (MXID) takes the form @username:homeserver.domain (e.g., @teacher\_alice:edupub.institute).36 This allows EducationPub user IDs to be mapped directly to Matrix IDs.  
This native identity system makes user discovery across the federation trivial. A user on instance-a.com can search for and invite @student\_bob:instance-b.org to a room directly. The Matrix protocol handles the necessary server-to-server DNS lookups and federation of the invitation event via its Server-Server API.33 This completely obviates the need for a custom user discovery mechanism.  
The entire call flow is managed through events within a Matrix room, which effectively becomes the signaling channel:

1. An initiator creates a Matrix room (which can be ephemeral, existing only for the call).  
2. The initiator sends m.call.invite events to other users.  
3. These invites are federated to the recipients' homeservers.  
4. Upon acceptance, the recipient's client sends an m.call.answer event.  
5. The clients then use a series of MatrixRTC-specific events within the same room to negotiate the call parameters, discover and select the SFU, exchange ICE candidates, and manage call state (e.g., holds, mutes).

### **3.4 A Unified Security Model: Integrating Matrix and WebRTC Encryption**

Matrix, combined with WebRTC, offers a multi-layered security model that can provide true end-to-end encryption for all communications.

* **Transport Layer Security (Default):** As a baseline, all communication in the Matrix ecosystem is encrypted at the transport layer. Client-to-server and server-to-server API calls are protected by HTTPS/TLS.37 The media connection between a client and an SFU is protected by DTLS-SRTP, which is a mandatory part of the WebRTC standard.16 This provides strong hop-by-hop encryption.  
* **End-to-End Encryption (E2EE):** The architecture supports a superior level of security where even server administrators cannot access communication content.  
  * **Signaling E2EE:** Matrix has a mature, audited implementation of E2EE for room events, called Olm/Megolm.37 This means the signaling messages themselves—who is calling whom, the metadata of the call—can be encrypted such that only the participants' devices can read them.  
  * **Media E2EE:** MatrixRTC is explicitly designed to leverage Matrix's E2EE key management infrastructure to provide E2EE for the media streams. This is accomplished using WebRTC Insertable Streams, an API that allows a client to intercept and encrypt media frames *before* they are sent to the SFU.16 The SFU can then route the encrypted media packets without having the keys to decrypt them. This provides true end-to-end security for group calls, a feature that is highly sought after but complex to implement from scratch.  
* **Federated Trust:** The WebRTC security model described in RFC 8827 relies on Identity Providers (IdPs) to cryptographically verify the identity of participants.15 In the proposed architecture, each EducationPub/Matrix homeserver naturally serves as the IdP for its users, fitting the RFC's trust model perfectly. Matrix's built-in cryptographic identity verification allows a user on instance A to be certain they are talking to the correct user from instance B, preventing man-in-the-middle attacks by malicious signaling servers.

### **3.5 Matrix Protocol vs. Custom Signaling Solution: A Comparative Analysis**

The decision to adopt Matrix becomes overwhelmingly clear when comparing it to the alternative of building a custom federated communication solution. The scope of work required for a custom build is immense, as it essentially involves reinventing a significant portion of what Matrix already provides as a mature, open standard.

| Feature/Capability | Matrix Protocol (Out-of-the-Box) | Custom Solution (Required Development Effort) |
| :---- | :---- | :---- |
| **Federated Identity & Discovery** | Native (@user:domain), built-in server-to-server lookup. | **Very High:** Requires designing and implementing a new federated identity protocol and discovery mechanism. |
| **Cross-Server Room Sync** | Core feature (replicated event graph), handles eventual consistency. | **Very High:** A distributed systems problem requiring a robust state synchronization and conflict resolution algorithm. |
| **Presence & Typing Notifications** | Native support via Ephemeral Data Units (EDUs). | **Medium:** Requires building a presence system and real-time event bus. |
| **Signaling Transport** | Standardized Client-Server and Server-Server HTTP APIs. | **High:** Requires defining, implementing, and documenting a full set of APIs. |
| **SFU Discovery & Selection** | Standardized via MatrixRTC and .well-known files. | **High:** Requires designing a new discovery and deterministic selection protocol. |
| **Federated Moderation Primitives** | Native via room power levels and state events (kick/ban). | **High:** Requires designing a cross-domain permissions and enforcement protocol. |
| **E2EE for Signaling** | Built-in (Olm/Megolm), audited. | **Very High:** Requires implementing complex cryptographic protocols (e.g., Signal Protocol). |
| **E2EE for Media (Group)** | Supported via MatrixRTC and Insertable Streams. | **Very High:** Requires deep integration with WebRTC and a secure key management/exchange system. |
| **Extensibility (Widgets/Bots)** | Standardized Widget API and Application Service API. | **High:** Requires designing and building a new plugin or integration framework. |
| **Client SDKs (JS, iOS, Android)** | Mature, open-source SDKs are available. | **Very High:** Requires building and maintaining SDKs for all target platforms from scratch. |

*Table 3: Matrix Protocol vs. Custom Signaling Solution: A Comparative Analysis*  
Adopting Matrix is not merely a technical decision for a single feature. It is a strategic move to build upon a comprehensive, open, and interoperable communication operating system. This approach de-risks the project, dramatically accelerates the development timeline, and provides a foundation for a host of future real-time features—such as integrated chat, notifications, and collaborative document editing—in a natively federated manner. This aligns EducationPub with the broader Fediverse movement and ensures its long-term technical architecture is sustainable, extensible, and secure.

## **Section 4: Implementation Blueprint for EducationPub**

Translating the strategic decision to adopt Matrix into a successful product requires a concrete implementation plan. This section provides a high-level architectural blueprint, details the critical communication flows, and outlines specific strategies for building the required educational features on top of the Matrix protocol. The approach described here leverages Matrix's native primitives to simplify development and ensure a robust, federated-by-design system.

### **4.1 Recommended Architecture: A Hybrid Model with MatrixRTC and a LiveKit SFU**

The proposed architecture is designed for scalability, security, and federation. Each independent EducationPub instance will deploy a standardized stack of components, which will interoperate through the Matrix federation protocol.

* **Component Overview:**  
  * **Client-Side:** The EducationPub web and mobile applications will integrate the official **Matrix JavaScript SDK** (or native SDKs for iOS/Android).18 This SDK handles all communication with the homeserver, including authentication, room management, event synchronization, and end-to-end encryption.  
  * **Server-Side (per instance):** Each EducationPub node will be responsible for running a small suite of services:  
    1. **Matrix Homeserver:** This is the core of the instance's communication infrastructure. Production-ready options include **Synapse** (the reference implementation) or **Dendrite** (a more modern, scalable implementation).18  
    2. **LiveKit SFU:** This server will handle the routing of all WebRTC media streams for calls hosted by the instance. It is a high-performance, open-source SFU that integrates directly with MatrixRTC.35  
    3. **STUN/TURN Server:** An instance of **coturn** will be deployed to facilitate NAT traversal for users of that instance and, when necessary, for users from other federated instances.28  
* **Federation:** The Matrix homeservers on each EducationPub instance will federate with one another using the standard Matrix Server-Server API. This is the backbone that enables all cross-instance communication.

The following diagram illustrates the interaction between two federated instances during a call.  
*(A detailed architectural diagram would be inserted here, showing two clouds representing "Instance A" and "Instance B". Each cloud contains a User, an EducationPub App, a Matrix Homeserver, a LiveKit SFU, and a coturn server. The diagram would trace two paths: 1\) A "Signaling Path" showing dashed lines from User A's App to Homeserver A, then across to Homeserver B, and finally to User B's App. 2\) A "Media Path" showing solid lines from both User A and User B's Apps to the LiveKit SFU located in Instance B, illustrating that SFU B was selected for the call.)*

### **4.2 Detailed Federated Communication Flow (User on Node A calls User on Node B)**

This step-by-step walkthrough details the process of establishing a federated call, referencing the components in the architecture above.

* **Step 1 (Initiation & Invitation):** User A (@user-a:instance-a.com) decides to call User B (@user-b:instance-b.com). User A's client application uses the Matrix SDK to create a new, temporary Matrix room and sends an m.call.invite event targeted at User B into that room.  
* **Step 2 (Federation of Invite):** Homeserver A receives this event. Recognizing that User B resides on a different server, it uses the Matrix Server-Server API to federate the room creation and the invitation event to Homeserver B.  
* **Step 3 (Acceptance):** User B's client, which maintains a persistent connection to Homeserver B, receives the invitation. If User B accepts, their client joins the Matrix room and sends an m.call.answer event. This event is federated back to Homeserver A, and User A's client is notified. The signaling channel is now established.  
* **Step 4 (SFU Discovery & Selection):** As the first participant to formally join the call's media session, User B's client takes the lead in selecting the SFU. It queries its own homeserver's (instance-b.com) .well-known/matrix/client configuration file, discovers the advertised LiveKit SFU, and asserts its choice by placing the SFU's details into the foci\_preferred key of its org.matrix.msc3401.call.member state event within the room.35  
* **Step 5 (Signaling & ICE Exchange):** Because Matrix room state is replicated, User A's client immediately sees the updated m.call.member event and knows to connect to the SFU on Instance B. Both clients now begin exchanging ICE candidates by sending them as m.call.candidates events into the Matrix room. The room itself serves as the transport for this negotiation.  
* **Step 6 (Media Flow):** With ICE negotiation complete, both clients establish a secure WebRTC connection to the LiveKit SFU on Instance B. They begin sending their encrypted media streams to the SFU, which then forwards the streams to the other participant. The call is now live.

### **4.3 Integrating Core Educational Features**

The true power of using Matrix as a foundation is the ease with which complex, stateful, and collaborative features can be built.

#### **4.3.1 Implementing Breakout Rooms via Ephemeral Matrix Rooms**

Breakout rooms are an application-level concept, not a native WebRTC feature. They can be elegantly modeled using Matrix's own room structure. This approach is similar to how platforms like Nextcloud Talk implement the feature.38

1. **Creation:** When a moderator initiates breakout rooms, their client sends a single custom state event (e.g., com.educationpub.breakout.config) to the main call's Matrix room. This event contains the configuration: the number of breakout rooms to create and the list of participants assigned to each.  
2. **Execution:** All client applications in the call are listening for this state event. Upon receiving it, each client whose user has been assigned to a breakout room will automatically create (if it doesn't exist) and join a new, temporary Matrix room for that breakout session. The name of this room can be linked back to the parent call room (e.g., "Main Call \- Breakout 1").  
3. **New Call:** Within each new breakout room, a separate MatrixRTC call is initiated among the assigned participants, using the same SFU discovery and selection logic as the main call.  
4. **Moderator Control:** The moderator's client can "broadcast" a message to all breakout rooms by sending a message event to each of the temporary room IDs.38 To rejoin the main call, clients simply leave the breakout room and refocus on the main room.

#### **4.3.2 Integrating a Collaborative Whiteboard via Matrix Widgets**

Matrix Widgets provide a standardized way to embed external web applications into a Matrix client, complete with an API for the widget to communicate with the host client and read/write events to the room.35 This is the ideal mechanism for integrating a collaborative whiteboard, following the model of existing projects like NeoBoard.39

1. **Widget Hosting:** A collaborative whiteboard application is developed as a self-contained JavaScript application and hosted as a static webpage. This application can be built using canvas libraries and can be a custom component for EducationPub.  
2. **Integration:** A moderator adds the whiteboard to the call by sending a m.widget state event to the room, containing the URL of the whiteboard application. Compliant clients like Element (and the custom EducationPub client) will render this URL in an iframe.  
3. **State Persistence:** The entire state of the whiteboard (all drawing commands, text boxes, shapes) is saved as a single custom state event (e.g., com.educationpub.whiteboard.content) in the Matrix room. Whenever a change is made, the widget updates this state event. This ensures that the whiteboard's content is persistent, encrypted (if the room is encrypted), and replicated across the federation. A user joining the call late will receive the latest state event and can render the full whiteboard instantly.  
4. **Real-Time Collaboration:** While state events are perfect for persistence, they can be too slow for fluid, real-time drawing. To solve this, the widget can establish a secondary, direct **WebRTC data channel** between the participants currently in the call.40 Live drawing actions (e.g., mouse movements) are sent over this low-latency data channel for an instantaneous feel, while the final state of a drawing action (e.g., "line drawn from X1,Y1 to X2,Y2") is committed to the Matrix room state event for persistence. This hybrid approach delivers both performance and durability.

### **4.4 UI/UX Design Principles for Initiating and Managing Federated Calls**

The user experience must abstract the underlying complexity of federation to provide a seamless and trustworthy interface.

* **Intuitive Initiation:** The process of starting a call should be simple. From a user's profile, a "Call" button should be present. The UI should use universally recognized icons for video and audio calls. When searching for users to invite, the system should seamlessly search across the federation, presenting users as @username:instance.domain but with clear profile pictures and display names to aid recognition.19  
* **Focused In-Call Experience:** The main call interface should prioritize video content, with controls that are visible on hover but otherwise fade to minimize distraction.42 Core actions—mute/unmute, camera on/off, screen share, chat, and whiteboard—must be immediately accessible from a primary control bar.  
* **Federated Trust Indicators:** It is crucial to manage user expectations regarding trust and safety. When a user from a different EducationPub instance joins a call, the UI should provide a clear visual indicator. This could be as simple as displaying their full federated ID (@student\_bob:instance-b.org) or adding a small "external" icon next to their name. A tooltip could explain, "This user is from a different instance, which may have its own moderation policies." This transparency is key to building a healthy federated ecosystem.

By leveraging Matrix's powerful primitives, the implementation of these advanced pedagogical features is transformed from a series of difficult distributed systems challenges into more manageable application development tasks. The focus shifts from inventing new protocols for state synchronization to simply defining custom event schemas and building user interfaces that interact with the robust, federated backbone that Matrix provides.

## **Section 5: Moderation, Safety, and Governance in a Federated Environment**

The decentralized nature of EducationPub presents unique challenges for content moderation and user safety. In a federated network, no single entity has universal control. An administrator on one instance has no inherent authority over a user on another. Therefore, the system's architecture must provide tools for effective, collaborative governance that respect the autonomy of each instance while ensuring a safe environment for all users. Matrix's design, which treats permissions and moderation actions as part of a room's replicated state, provides a powerful and elegant framework for this purpose.

### **5.1 The Challenge of Cross-Instance Moderation**

In a federated system, each server is an independent administrative domain with its own policies and moderators.43 If a user from  
instance-b.com is causing a disruption in a call hosted on instance-a.com, the administrator of instance A cannot simply ban the user's account. This creates a complex moderation landscape where actions must be targeted, context-specific, and enforced through protocol-level consensus rather than centralized authority. The platform must equip administrators with tools to enforce their local policies within the spaces they control (i.e., the rooms or calls created on their instance) while providing mechanisms to report abuse to the user's home instance.

### **5.2 A Proposed Framework for Handling User Reports and Administrator Actions**

A robust reporting and moderation system can be built directly on top of Matrix's event-based architecture.

* **In-Call Reporting:** The UI must include a "Report User" button, accessible from any participant's profile within the call. When a user clicks this button, the client generates a custom, encrypted Matrix event (e.g., com.educationpub.report). This event should contain structured data: the MXID of the reporter, the MXID of the reported user, a timestamp, the room ID of the call, and a user-provided reason for the report.  
* **Federated Report Routing:** This report event is sent into a dedicated, private moderation room. The homeservers of the instance administrators responsible for the call (e.g., the instance where the call's room was created) can be configured to automatically join or listen to these reports. Crucially, the system should also be configured to forward a copy of the report to the administrators of the *reported user's* homeserver. This ensures the report reaches both the party responsible for the space (the room moderator) and the party responsible for the user (their homeserver admin), allowing for parallel and appropriate action.44  
* **Moderation Actions via State Events:** The key to federated moderation in Matrix lies in its use of replicated state events to manage permissions. All moderation actions are simply changes to the room's state, which are then propagated to and enforced by all participating servers.  
  * **Kicking a User:** A moderator with a sufficient power level in the room can issue an m.room.member state event, changing the target user's membership status to leave. When this event is replicated, all servers in the room will see it and reject any further events from that user in that room, effectively kicking them out.  
  * **Banning a User:** A more permanent action is to set the user's membership to ban. This not only removes them but also prevents them from rejoining the room unless the ban is lifted. This state is, again, replicated and enforced globally across all servers participating in that specific room.

This mechanism is powerful because it doesn't require the moderator's server to have special API access to the banned user's server. The authority is derived from the moderator's role *within the shared room*, and enforcement is a mandatory part of the Matrix federation protocol.

### **5.3 Essential In-Call Moderation Tools**

To make this system effective, the UI must provide moderators with simple, one-click tools that translate into the appropriate Matrix events. For a structured virtual classroom, the creator of the call (the teacher) should automatically be granted the highest moderator power level in the Matrix room.  
The moderator's interface must include:

* **Mute Participant:** This action would send a custom event signaling the target user's client application to mute their microphone. While a moderator cannot directly control a user's hardware, compliant clients will honor this "request to mute" event, effectively silencing the participant.  
* **Stop Video:** Similar to muting, this sends a signal for the participant's client to disable their camera feed.  
* **Remove from Call:** This button would trigger the m.room.member kick event described above, immediately removing the user from the call.  
* **Mute All:** A crucial tool for classroom management, this would send a batch of "request to mute" signals to all participants except for other moderators.  
* **End Call for All:** The moderator can terminate the session by sending a specific state event that signals to all clients that the call is over, perhaps by "kicking" all participants simultaneously.

These tools are not just conveniences; they are essential for creating a safe, focused, and productive learning environment, mirroring the controls that educators expect from platforms like BigBlueButton and services like Slido.6 By building these controls on top of Matrix's state event model, EducationPub can provide powerful, federated moderation capabilities that are both robust and respectful of the decentralized nature of the network.

## **Section 6: Conclusion & Strategic Roadmap**

The integration of real-time communication presents a pivotal opportunity for EducationPub to significantly enhance its value proposition for educators and learners. The analysis conducted in this report leads to a firm recommendation, supported by a clear, phased implementation plan designed to ensure success while managing complexity.

### **6.1 Final Recommendation: Adopting the Matrix Protocol**

The primary recommendation of this report is the adoption of the Matrix protocol as the foundational layer for all real-time communication features within EducationPub. This conclusion is based on a comprehensive evaluation of the platform's unique federated requirements against the capabilities of available technologies.  
A custom-built solution, while theoretically possible, would be prohibitively complex, expensive, and risky. It would require EducationPub to solve numerous difficult distributed systems problems from first principles, including federated identity, cross-server state synchronization, scalable media routing, and secure, decentralized moderation—in essence, reinventing a communication protocol.  
Matrix, in contrast, provides a mature, open-standard, and robust solution to these exact challenges out-of-the-box.

* **Philosophical Alignment:** Its federated-by-default architecture is a natural extension of EducationPub's core principles.  
* **Technical Superiority:** With the advent of MatrixRTC, it offers a standardized, future-proof path for scalable, end-to-end encrypted group video conferencing that natively understands federation.34 It elegantly solves the complex problems of federated SFU discovery and selection.  
* **Accelerated Development:** Matrix provides not just the transport protocol but also the application-level primitives—such as persistent room state, widgets, and power levels—necessary to build the rich pedagogical features like whiteboards, breakout rooms, and advanced moderation that are critical for a competitive educational platform.

By choosing Matrix, EducationPub is not just selecting a technology for a single feature; it is adopting a comprehensive communication operating system that will de-risk development and serve as a foundation for future innovation.

### **6.2 A Phased Implementation Roadmap**

To ensure a successful and manageable rollout, a phased implementation approach is recommended. This allows the team to build foundational expertise, deliver value incrementally, and gather user feedback throughout the process.

* **Phase 1: Core Infrastructure & Foundational Calling (3-4 Months)**  
  * **Objective:** Establish the core federated infrastructure and deliver basic calling functionality.  
  * **Key Tasks:**  
    1. Deploy Matrix Homeservers (e.g., Dendrite), LiveKit SFUs, and coturn TURN servers on a pilot set of EducationPub instances.  
    2. Integrate the Matrix JavaScript SDK into the EducationPub client.  
    3. Implement user authentication, mapping EducationPub accounts to Matrix IDs.  
    4. Develop the basic UI for 1:1 and small group audio/video calls, focusing on the federated call flow from invitation to connection.  
  * **Outcome:** A functional, federated calling system for small groups, validating the core architecture.  
* **Phase 2: Virtual Classroom & Pedagogical Features (4-6 Months)**  
  * **Objective:** Build the feature set required for the structured virtual classroom use case.  
  * **Key Tasks:**  
    1. Design and build the full virtual classroom user interface.  
    2. Implement the collaborative whiteboard using the Matrix Widget API and a hybrid state-event/data-channel model.  
    3. Implement breakout rooms by modeling them as temporary, linked Matrix rooms managed by custom state events.  
    4. Integrate basic in-call text chat.  
  * **Outcome:** A feature-rich virtual classroom environment ready for testing with educators.  
* **Phase 3: Moderation, Safety & Governance (2-3 Months)**  
  * **Objective:** Implement the tools necessary for a safe and well-managed communication environment.  
  * **Key Tasks:**  
    1. Develop the in-call moderation tools for teachers (Mute, Remove, Mute All, etc.) based on Matrix power levels.  
    2. Build the back-end system for handling and routing user reports to the appropriate instance administrators.  
    3. Refine the UI to include clear trust and safety indicators for federated interactions.  
  * **Outcome:** A secure and governable platform that can be safely rolled out to a wider audience.  
* **Phase 4: Full Rollout & Future Exploration (Ongoing)**  
  * **Objective:** Deploy the feature across all EducationPub instances and explore deeper integration.  
  * **Key Tasks:**  
    1. Provide documentation and support for all instance administrators to deploy the required server components.  
    2. Monitor performance, scalability, and user feedback across the network.  
    3. Begin exploring the use of Matrix for other real-time platform features, such as notifications, user-to-user messaging outside of calls, and real-time collaborative editing of educational resources.  
  * **Outcome:** A fully deployed, industry-leading real-time communication feature and a strategic path toward deeper integration with open standards.

### **6.3 Long-Term Strategic Benefits**

The decision to build on Matrix extends far beyond the immediate feature request. It is a strategic investment in the future of the EducationPub platform. By adopting an open, interoperable standard, EducationPub reduces long-term maintenance overhead, avoids vendor lock-in, and strengthens its position as a leading citizen of the open, decentralized web, or "Fediverse".18 This move opens the door to future interoperability with a growing ecosystem of other Matrix-based applications, potentially expanding the reach, utility, and collaborative power of the EducationPub network in ways that a closed, proprietary solution never could. It is a commitment to an open, secure, and user-empowering future for online education.

#### **Works cited**

1. What are the features in BigBlueButton? \- Blindside Networks Customer Support Portal, accessed July 30, 2025, [https://support.blindsidenetworks.com/hc/en-us/articles/360052738972-What-are-the-features-in-BigBlueButton](https://support.blindsidenetworks.com/hc/en-us/articles/360052738972-What-are-the-features-in-BigBlueButton)  
2. BigBlueButton: Virtual Classroom Software, accessed July 30, 2025, [https://bigbluebutton.org/](https://bigbluebutton.org/)  
3. BigBlueButton Features \- Meeting \- BBB Plugin, accessed July 30, 2025, [https://bbbplugin.com/en/bigbluebutton-features/](https://bbbplugin.com/en/bigbluebutton-features/)  
4. Our Users' Ten Favorite Features for Their Virtual Classroom (and a Bonus) \- BigBlueButton, accessed July 30, 2025, [https://bigbluebutton.org/articles/our-users-ten-favorite-features-for-their-virtual-classroom-and-a-bonus/](https://bigbluebutton.org/articles/our-users-ten-favorite-features-for-their-virtual-classroom-and-a-bonus/)  
5. Unveiling BigBlueButton Features: An In-Depth Analysis of Virtual Education Tools \- AI-powered Online Classrooms \- HigherEdLab.com, accessed July 30, 2025, [https://higheredlab.com/bigbluebutton-features-comprehensive-analysis/](https://higheredlab.com/bigbluebutton-features-comprehensive-analysis/)  
6. Elevate Your Virtual Classes with a Fully Customizable Platform \- BigBlueButton Host, accessed July 30, 2025, [https://bigbluebutton.host/bigbluebutton-for-virtual-classes/](https://bigbluebutton.host/bigbluebutton-for-virtual-classes/)  
7. BigBlueButton \- Wikipedia, accessed July 30, 2025, [https://en.wikipedia.org/wiki/BigBlueButton](https://en.wikipedia.org/wiki/BigBlueButton)  
8. About Jitsi Meet | Free Video Conferencing Solutions, accessed July 30, 2025, [https://jitsi.org/jitsi-meet/](https://jitsi.org/jitsi-meet/)  
9. Jitsi vs BigBlueButton: Which One Should You Use?, accessed July 30, 2025, [https://jitsi.guide/blog/jitsi-vs-bigbluebutton/](https://jitsi.guide/blog/jitsi-vs-bigbluebutton/)  
10. Jitsi Meet | DMC \- Prompt, accessed July 30, 2025, [https://dmc.prompt.hu/en/resources/tools/jitsi-meet](https://dmc.prompt.hu/en/resources/tools/jitsi-meet)  
11. Re: \[bigbluebutton-dev\] Jitsi vs Bugbluebutton \- Google Groups, accessed July 30, 2025, [https://groups.google.com/g/bigbluebutton-dev/c/gfRfxaMBH-M](https://groups.google.com/g/bigbluebutton-dev/c/gfRfxaMBH-M)  
12. jitsi-deployment/docs/architecture/architecture.md at master · hpi-schul-cloud/jitsi ... \- GitHub, accessed July 30, 2025, [https://github.com/hpi-schul-cloud/jitsi-deployment/blob/master/docs/architecture/architecture.md](https://github.com/hpi-schul-cloud/jitsi-deployment/blob/master/docs/architecture/architecture.md)  
13. Jitsi Architecture Explained: How Does It Work?, accessed July 30, 2025, [https://jitsi.support/how-to/jitsi-architecture-explained/](https://jitsi.support/how-to/jitsi-architecture-explained/)  
14. Architecture | Jitsi Meet \- GitHub Pages, accessed July 30, 2025, [https://jitsi.github.io/handbook/docs/architecture/](https://jitsi.github.io/handbook/docs/architecture/)  
15. RFC 8827 \- WebRTC Security Architecture \- IETF Datatracker, accessed July 30, 2025, [https://datatracker.ietf.org/doc/html/rfc8827](https://datatracker.ietf.org/doc/html/rfc8827)  
16. End-to-End Encryption \- Dyte, accessed July 30, 2025, [https://dyte.io/blog/end-to-end-encryption/](https://dyte.io/blog/end-to-end-encryption/)  
17. A Complete Guide to WebRTC Architecture in 2025 \- Moon Technolabs, accessed July 30, 2025, [https://www.moontechnolabs.com/blog/webrtc-architecture/](https://www.moontechnolabs.com/blog/webrtc-architecture/)  
18. FAQ \- Matrix.org, accessed July 30, 2025, [https://matrix.org/docs/older/faq/](https://matrix.org/docs/older/faq/)  
19. A UX review of Zoom's video call experience \- GoodUX \- Appcues, accessed July 30, 2025, [https://goodux.appcues.com/blog/zoom-video-call-ux-review](https://goodux.appcues.com/blog/zoom-video-call-ux-review)  
20. Enhancing User Engagement: The Power of In-App Calls and Video Calls \- InAppStory, accessed July 30, 2025, [https://inappstory.com/blog/in-app-video-calls](https://inappstory.com/blog/in-app-video-calls)  
21. Overlay networks based on WebRTC \- Hacker News, accessed July 30, 2025, [https://news.ycombinator.com/item?id=39866325](https://news.ycombinator.com/item?id=39866325)  
22. WebRTC is widely misunderstood. It is not a p2p-enabling technology. It requires... | Hacker News, accessed July 30, 2025, [https://news.ycombinator.com/item?id=39870882](https://news.ycombinator.com/item?id=39870882)  
23. WebRTC Signaling: Servers, Protocols, and How it Works \- VideoSDK, accessed July 30, 2025, [https://www.videosdk.live/developer-hub/webrtc/webrtc-signaling-server](https://www.videosdk.live/developer-hub/webrtc/webrtc-signaling-server)  
24. DWRTC \- Distributed WebRTC Signalling | DWRTC, accessed July 30, 2025, [https://dwrtc.net/](https://dwrtc.net/)  
25. chr15m/webrtc-signaling-mesh: Decentralized signaling for ... \- GitHub, accessed July 30, 2025, [https://github.com/chr15m/webrtc-signaling-mesh](https://github.com/chr15m/webrtc-signaling-mesh)  
26. \[2206.07685\] Decentralized WebRCT P2P network using Kademlia \- arXiv, accessed July 30, 2025, [https://arxiv.org/abs/2206.07685](https://arxiv.org/abs/2206.07685)  
27. WebRTC Security \- Understanding the Role of ICE, STUN, and TURN for Enhanced Communication \- MoldStud, accessed July 30, 2025, [https://moldstud.com/articles/p-webrtc-security-understanding-the-role-of-ice-stun-and-turn-for-enhanced-communication](https://moldstud.com/articles/p-webrtc-security-understanding-the-role-of-ice-stun-and-turn-for-enhanced-communication)  
28. Configure Your Own TURN/STUN Server \- Red5 Pro, accessed July 30, 2025, [https://www.red5.net/docs/red5-pro/users-guide/installation/archive/turn-stun/turnstun/](https://www.red5.net/docs/red5-pro/users-guide/installation/archive/turn-stun/turnstun/)  
29. WebRTC Stun vs Turn Servers \- GetStream.io, accessed July 30, 2025, [https://getstream.io/resources/projects/webrtc/advanced/stun-turn/](https://getstream.io/resources/projects/webrtc/advanced/stun-turn/)  
30. Introduction \- Matrix.org, accessed July 30, 2025, [https://matrix.org/docs/older/introduction/](https://matrix.org/docs/older/introduction/)  
31. Matrix Specification, accessed July 30, 2025, [https://spec.matrix.org/](https://spec.matrix.org/)  
32. Matrix is basically a case study in how not to design a federated chat protoco... | Hacker News, accessed July 30, 2025, [https://news.ycombinator.com/item?id=31143467](https://news.ycombinator.com/item?id=31143467)  
33. Matrix as a Messaging Framework \- IETF, accessed July 30, 2025, [https://www.ietf.org/archive/id/draft-ralston-mimi-matrix-framework-01.html](https://www.ietf.org/archive/id/draft-ralston-mimi-matrix-framework-01.html)  
34. Matrix 2.0 Is Here\!, accessed July 30, 2025, [https://matrix.org/blog/2024/10/29/matrix-2.0-is-here/](https://matrix.org/blog/2024/10/29/matrix-2.0-is-here/)  
35. element-hq/element-call: Group calls powered by Matrix \- GitHub, accessed July 30, 2025, [https://github.com/element-hq/element-call](https://github.com/element-hq/element-call)  
36. The “Join Matrix\!” Guide | Join Matrix\!, accessed July 30, 2025, [https://joinmatrix.org/guide/](https://joinmatrix.org/guide/)  
37. Matrix (protocol) \- Wikipedia, accessed July 30, 2025, [https://en.wikipedia.org/wiki/Matrix\_(protocol)](https://en.wikipedia.org/wiki/Matrix_\(protocol\))  
38. Advanced Talk features — Nextcloud latest User Manual latest ලේඛණය, accessed July 30, 2025, [https://docs.nextcloud.com/server/latest/user\_manual/si/talk/advanced\_features.html](https://docs.nextcloud.com/server/latest/user_manual/si/talk/advanced_features.html)  
39. nordeck/matrix-neoboard: A collaborative whiteboard ... \- GitHub, accessed July 30, 2025, [https://github.com/nordeck/matrix-neoboard](https://github.com/nordeck/matrix-neoboard)  
40. WebRTC Group Video Call Solution – Guide for Developers \- CONTUS Tech, accessed July 30, 2025, [https://www.contus.com/blog/webrtc-video-call/](https://www.contus.com/blog/webrtc-video-call/)  
41. webRTC HTML5 whiteboard/video chat \- javascript \- Stack Overflow, accessed July 30, 2025, [https://stackoverflow.com/questions/15724806/webrtc-html5-whiteboard-video-chat](https://stackoverflow.com/questions/15724806/webrtc-html5-whiteboard-video-chat)  
42. How Social Media Apps' UX & UI Are Designed To Engage… And Be Addictive, accessed July 30, 2025, [https://www.komododigital.co.uk/insights/how-social-media-apps-ux-ui-are-designed-to-engage-and-be-addictive/](https://www.komododigital.co.uk/insights/how-social-media-apps-ux-ui-are-designed-to-engage-and-be-addictive/)  
43. Decentralised Moderation for Interoperable Social Networks: A Conversation-based Approach for Pleroma and the Fediverse \- arXiv, accessed July 30, 2025, [https://arxiv.org/html/2404.03048v2](https://arxiv.org/html/2404.03048v2)  
44. Matrix for Instant Messaging \- Matrix.org, accessed July 30, 2025, [https://matrix.org/docs/](https://matrix.org/docs/)  
45. Advanced Client Reporting Strategies & Best Practices \- AgencyAnalytics, accessed July 30, 2025, [https://agencyanalytics.com/client-reporting-guide/client-reporting-best-practices](https://agencyanalytics.com/client-reporting-guide/client-reporting-best-practices)  
46. Client Reporting: Best Practices for Effective Communication with Clients \- SocialBee, accessed July 30, 2025, [https://socialbee.com/blog/client-reporting-best-practices/](https://socialbee.com/blog/client-reporting-best-practices/)  
47. Slido for Education | Slido \- Audience Interaction Made Easy, accessed July 30, 2025, [https://www.slido.com/education](https://www.slido.com/education)  
48. Moderator Tools \- Collaborative Gain, accessed July 30, 2025, [https://collaborativegain.com/moderators/moderator-tools/](https://collaborativegain.com/moderators/moderator-tools/)  
49. Matrix messaging and collaboration for enterprise \- Element, accessed July 30, 2025, [https://element.io/matrix-benefits](https://element.io/matrix-benefits)