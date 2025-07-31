---
sidebar_position: 3
title: HTTP Signature Verification for Inbox
---

# **Research Report: HTTP Signature Verification in NestJS for ActivityPub Inbox Implementation**

## **I. Introduction to HTTP Signatures in ActivityPub**

This report provides a comprehensive guide for implementing HTTP Signature verification within a NestJS application, specifically for incoming messages from ActivityPub instances. The objective is to detail the functionality of relevant libraries, specify ActivityPub's requirements for HTTP signatures, address critical security considerations, and outline the precise steps for constructing a robust NestJS Guard.

### **A. Purpose and Importance of HTTP Signatures in ActivityPub**

HTTP Message Signatures constitute a cryptographic framework designed to ascertain the authenticity and integrity of HTTP messages or their constituent components. This is achieved by generating a deterministic serialization of selected HTTP message parts and subsequently signing them with a private key. The http-message-signatures library, for instance, is engineered to facilitate this process of signing and verifying HTTP messages in accordance with the HTTP Working Group draft specifications.1  
Within the ActivityPub protocol, these signatures are indispensable for server-to-server communication. They furnish a verifiable assurance that an incoming activity, such as a Follow, Like, or Create activity, genuinely originates from the asserted sender and has not been subjected to unauthorized alteration during transmission. This capability is foundational for establishing and maintaining trust and security within a decentralized social network. ActivityPub explicitly recommends HTTP Signature as the primary authentication method for server-to-server interactions, particularly for POST requests directed to an inbox.2 Mastodon, a prominent ActivityPub implementation, mandates the use of HTTP signatures to validate the authorship of any received activity.3 Without such cryptographic authentication, a malicious entity could readily forge messages, impersonate users, or inject spurious activities, thereby compromising the integrity of the entire federated network. The decentralized nature of ActivityPub, where servers interact directly without a centralized authority, elevates the criticality of robust cryptographic authentication. HTTP Signatures provide this essential trust anchor, enabling a receiving server to independently verify the sender's identity and message integrity without reliance on a third party. Consequently, HTTP signature verification is not an optional feature but a mandatory security control for any ActivityPub inbox implementation; its absence renders the NestJS application susceptible to severe spoofing and data integrity vulnerabilities.

### **B. Overview of ActivityPub Server-to-Server Authentication**

ActivityPub, a decentralized social networking protocol, is fundamentally based on the ActivityStreams 2.0 data format.2 It delineates two distinct API protocols: a client-to-server protocol and a server-to-server protocol.6 This report primarily concerns the server-to-server or "Federation Protocol," which governs the distribution of activities between users residing on different servers, thereby interconnecting them into a unified social graph.6  
Authentication for these server-to-server interactions predominantly relies on HTTP Signatures.2 While Linked Data Signatures are also referenced within the ActivityPub specification and by implementations like Mastodon 2, they are not commonly enforced by most ActivityPub-compatible software at present.2 Therefore, the primary focus for secure inbox message processing remains on HTTP Signature verification. Incoming activities destined for an inbox typically manifest as HTTP  
POST requests, with the ActivityStreams object embedded within the request body.5

### **C. Scope of this Report: Focus on Verification in NestJS**

This report is specifically tailored to address the process of *verifying* incoming HTTP Signatures on ActivityPub inbox messages within a NestJS application. It does not encompass the signing of outgoing requests, although the underlying cryptographic principles are shared. The overarching objective is to equip an AI Agent with the necessary knowledge and precise steps to construct a robust NestJS Guard capable of performing this critical verification.

## **II. Deep Dive into HTTP Signature Verification with http-message-signatures and activitypub-http-signatures**

This section delves into the practical application of Node.js libraries for HTTP signature verification, specifically focusing on the http-message-signatures library and its more specialized counterpart, activitypub-http-signatures, in the context of ActivityPub inbox message processing.

### **A. The http-message-signatures and activitypub-http-signatures Libraries: Overview and Capabilities**

The Node.js ecosystem offers several libraries for handling HTTP message signatures. The http-message-signatures library 1 serves as a general-purpose implementation for HTTP message signing and verification, aligning with the HTTP Working Group draft specifications. It leverages Node.js's native crypto module for all necessary cryptographic operations, supporting both message signing and verification functionalities.1  
A more specialized alternative, the activitypub-http-signatures library 7, is specifically designed for ActivityPub. This library provides higher-level utilities that streamline both the signing and verification of HTTP signatures in a manner compliant with ActivityPub conventions. Given its explicit domain focus,  
activitypub-http-signatures is often the more direct and recommended choice for implementing HTTP signature verification within a NestJS Guard for ActivityPub. The selection of a domain-specific library, such as activitypub-http-signatures, over a more general-purpose one, like http-message-signatures, can substantially reduce implementation complexity and mitigate potential errors stemming from protocol-specific nuances. The activitypub-http-signatures library's parser.parse and signature.verify methods, coupled with its example for fetching public keys via fetch(signature.keyId), directly align with the ActivityPub verification workflow.7 This design choice lessens the burden on the implementing agent to manually manage ActivityPub-specific header parsing or public key resolution logic, thereby promoting more efficient and accurate code generation.

### **B. Anatomy of an ActivityPub HTTP Signature for Inbox Messages**

ActivityPub server-to-server interactions, particularly POST requests directed to inboxes, necessitate that specific HTTP headers are signed. This ensures the authenticity of the sender and the integrity of the message content.

#### **1\. Required Headers and Derived Components**

The core of an HTTP signature resides within the Signature: header. This header comprises three essential parameters: keyId, which identifies the public key used for signing; headers, a space-separated list enumerating the HTTP headers and derived components included in the signature string; and the signature value, which is the Base64-encoded cryptographic output.3  
For ActivityPub, commonly signed components include (request-target), host, and date.3 Furthermore, for implementations adhering to newer specifications, such as RFC9421-compatible signatures (as required by Mastodon), the  
@method and @target-uri (which is functionally equivalent to (request-target)) derived components, along with the created timestamp parameter, are mandatory inclusions within the signature.3 The  
(request-target) component represents the "request target portion of the request line".1 While the  
http-message-signatures library notes challenges in reliably constructing this value for *outgoing* Node.js requests, it is generally extractable for *incoming* requests, and libraries like activitypub-http-signatures are designed to handle this extraction.1

#### **2\. The Digest Header for POST Requests**

A critical requirement for POST requests within ActivityPub, particularly enforced by implementations like Mastodon, is the inclusion of a Digest: header. This header must contain an RSA-SHA256 digest hash of the raw request body.3 The presence of this header ensures the integrity of the message payload. Crucially, the  
Digest: header itself *must* be explicitly listed within the headers parameter of the Signature: header. This inclusion signifies that the digest value is part of the signed string, thereby binding the signature to the content of the request body and providing a strong guarantee against tampering.3

#### **3\. Understanding (request-target) and its Challenges**

The (request-target) derived component, representing the HTTP method and request path (e.g., post /inbox), is a mandatory element for signed ActivityPub requests in implementations like Mastodon.3 However, the  
http-message-signatures library acknowledges a difficulty in reliably calculating this value for incoming Node.js requests, even recommending its avoidance.1 This poses a direct conflict with ActivityPub's established practices. To ensure compliance and successful verification, the NestJS Guard must explicitly construct the  
(request-target) string from the incoming request's method and URL (e.g., by concatenating req.method.toLowerCase() and req.url) and ensure this correctly formatted value is provided to the verification library.  
The necessity of accessing the *raw* request body for Digest header verification is absolute.9 Without the raw body, it is impossible to re-calculate or validate the  
Digest hash, compromising the integrity check. Therefore, the NestJS application must be configured with rawBody: true during its initialization (NestFactory.create()) to expose the req.rawBody property, which returns the raw body as a Buffer.9 The Guard will then utilize this raw body to perform the necessary  
Digest validation.

### **C. Table 1: HTTP Signature Components for ActivityPub Verification**

The following table summarizes the essential HTTP signature components for verifying incoming ActivityPub inbox messages, specifically for POST requests. This structured representation provides a clear directive for an AI Agent to understand the precise data points required for verification. The table consolidates requirements from various sources, particularly Mastodon's implementation details, which are critical for interoperability within the Fediverse.1  
**Table 1: Essential HTTP Signature Components for ActivityPub Inbox Verification (POST Requests)**

| Component Name | Source in Request | Purpose | ActivityPub/Mastodon Requirement | Notes |
| :---- | :---- | :---- | :---- | :---- |
| keyId | Signature header | Identifies the public key used for signing. | MUST be present. | Typically actorID\#main-key. Used for public key lookup. |
| headers | Signature header | Lists the HTTP headers and derived components included in the signature string. | MUST be present. | Must include (request-target), host, date, digest. |
| signature | Signature header | The Base64-encoded cryptographic signature. | MUST be present. | The actual signature value. |
| (request-target) | Derived from HTTP method and URL path. | Verifies the request method and path. | MUST be signed (@method and @target-uri for RFC9421). | Manually constructed in NestJS Guard (e.g., post /inbox). |
| host | Host header | Verifies the host the request was sent to. | SHOULD be signed. | Standard HTTP header. |
| date | Date header | Provides a timestamp for the request, crucial for replay attack prevention. | MUST be signed; created parameter MUST be present (RFC9421). | Check against a reasonable time window. |
| digest | Digest header | SHA-256 hash of the raw request body, ensuring body integrity. | MUST be present and signed for POST requests. | Requires raw body access in NestJS. |

## **III. ActivityPub Actor Public Key Retrieval and Structure**

Successful HTTP signature verification hinges on the ability to reliably retrieve the corresponding public key of the sender. This section details the structure of public keys within ActivityPub actor objects and outlines robust retrieval strategies.

### **A. Public Key Location within an ActivityPub Actor Object**

ActivityPub actors, representing entities such as users or applications, are identified by unique URIs and are structured as ActivityStreams Object types.4 Integral to these actor objects, particularly for cryptographic operations like HTTP Signatures, is the inclusion of a  
publicKey property.4 This property encapsulates the necessary public key information required for signature validation.

### **B. Structure of the publicKey Property**

The publicKey property within an ActivityPub actor object is an embedded JSON object containing several critical fields 4:

* id: This field serves as the unique identifier for the public key itself. Conventionally, it is constructed by appending the fragment \#main-key to the actor's id (e.g., https://mastodon.social/users/Gargron\#main-key).4  
* owner: This property explicitly specifies the id of the actor who possesses or controls this public key, which is simply the actor's own URI.4 This establishes a clear link between the key and its owner.  
* publicKeyPem: This field contains the actual public key data. It is represented as a multi-line string encoded in PEM (Privacy-Enhanced Mail) format, typically delimited by \-----BEGIN PUBLIC KEY----- and \-----END PUBLIC KEY----- markers.4

### **C. Public Key Retrieval Process: Challenges and Best Practices**

To verify an incoming HTTP signature, the keyId extracted from the Signature header is used to locate and fetch the corresponding public key.1 The conventional process involves dereferencing the actor's  
id URL, which often forms the base URI of the keyId (before any \#main-key fragment). Upon successful retrieval of the actor object, the publicKey property is accessed, and the publicKeyPem value is extracted for use in the verification process.4  
This seemingly straightforward retrieval process is complicated by certain aspects of the ActivityPub ecosystem, notably the "Authorized Fetch" mechanism (referred to as "secure mode" in Mastodon 10) and historical issues related to the  
\#main-key URI fragment.11 A direct fetch of the  
keyId URL could potentially lead to a "ping-pong bug" if the actor profile itself is protected by "Authorized Fetch," requiring a signature to retrieve it, thus creating a circular dependency where a key is needed to fetch the key.11 A common approach to circumvent this is the understanding that actors can often be fetched without a signature, but in such cases, they may return only "technical attributes," which crucially include the public key information.11 This implies that a resilient public key retrieval logic might need to attempt a standard fetch, and if it encounters an authentication barrier, it should fall back to a method designed to retrieve only the technical attributes, or ensure the initial fetch for the key is performed without requiring a signature. This nuanced handling is critical for ensuring interoperability across various ActivityPub implementations.

### **D. Table 2: ActivityPub Actor Public Key Structure**

The following table provides a detailed breakdown of the publicKey property within an ActivityPub actor object, illustrating its essential fields as observed in common implementations like Mastodon.4 This structured information is directly actionable for an AI Agent designing the public key retrieval and parsing logic.  
**Table 2: ActivityPub Actor Public Key Structure**

| Field Name | Type | Description |
| :---- | :---- | :---- |
| id | String (URI) | The unique identifier for this specific public key. Typically \#main-key. |
| owner | String (URI) | The URI of the ActivityPub actor who owns this public key. This should match the actor's id. |
| publicKeyPem | String | The public key itself, encoded in PEM format. This is the cryptographic material used for verification. |

### **E. Caching Strategies for Public Keys**

Fetching public keys from remote ActivityPub instances involves network requests, which inherently introduce latency and can become a significant performance bottleneck, especially given that HTTP signature verification is often a synchronous operation in the request processing pipeline.11 Repeatedly fetching the same public key for every incoming signed request would severely degrade system performance.  
Therefore, implementing a robust caching mechanism for retrieved public keys is not merely a performance optimization but a fundamental requirement for a scalable and resilient ActivityPub implementation.5  
A comprehensive caching policy should incorporate the following elements:

* **Respecting HTTP Caching Headers:** The caching mechanism should honor standard HTTP caching directives, such as Cache-Control and Expires, provided by the remote server in its response.5 This ensures that the local cache adheres to the freshness policies set by the key's origin.  
* **Cache Eviction Policy:** Implement a time-to-live (TTL) or a least-recently-used (LRU) eviction policy to manage cache size and ensure that stale or infrequently used keys are appropriately removed.  
* **Fetch-and-Fallback Strategy:** To address the complexities of "Authorized Fetch" and potential network transient issues, a resilient retrieval service should employ a "fetch-and-fallback" strategy. This involves first checking the local cache; if the key is not found or is expired, an attempt is made to fetch the full actor object (which contains the key). If this initial fetch fails due to authentication requirements, a fallback mechanism should attempt to retrieve only the "technical attributes" of the actor, which are typically available without requiring a signature and include the public key information.11 This multi-tiered approach enhances both performance and fault tolerance.

The performance implications of repeated key fetches necessitate a sophisticated caching layer. This is not solely about accelerating the verification process but also about bolstering the resilience of the federated network, where remote instances may experience temporary unavailability. A well-designed cache significantly reduces external dependencies during critical path operations, minimizing the impact of network latency and remote server load.

## **IV. Mitigating Replay Attacks in ActivityPub HTTP Signatures**

Replay attacks represent a significant security vulnerability in distributed systems, including ActivityPub. This section details the nature of these attacks and outlines comprehensive mitigation strategies essential for a secure NestJS ActivityPub inbox.

### **A. Understanding Replay Attacks in Decentralized Protocols**

A replay attack occurs when a legitimate, valid data transmission, such as a signed message or transaction, is maliciously intercepted and subsequently re-transmitted or "replayed" to gain unauthorized access or trigger unintended actions.13 In the context of ActivityPub, an attacker could intercept a valid signed activity (e.g., a  
Like or Follow action) and replay it multiple times, potentially causing denial-of-service, spamming, or other undesirable side effects. Technologies lacking robust signature-based authentication or proper mechanisms to invalidate used signatures are particularly susceptible.14

### **B. Key Mitigation Strategies**

To defend against replay attacks, a multi-layered approach incorporating timestamps, message digests, and nonce-like mechanisms is imperative.

#### **1\. Timestamp Validation (Date Header)**

The Date HTTP header, when included in the signed components of an HTTP signature, serves as a fundamental mechanism for preventing basic replay attacks.14 The  
Date header provides a timestamp for the request, and its inclusion in the signature ensures that an attacker cannot alter it without invalidating the signature. Mastodon, for instance, requires the created parameter (a timestamp) to be present in RFC9421-compatible signatures.3  
Upon receiving a signed request, the server must validate the Date header against its current time. Requests with a timestamp that falls outside a predefined, narrow acceptable time window (e.g., a few minutes in the past or future to account for clock skew between federated servers) should be rejected.15 This ensures that old, intercepted messages cannot be replayed indefinitely. However, timestamps alone are not entirely sufficient, as multiple requests could legitimately occur within the same time window, potentially allowing for replays within that brief period.16 Accurate time synchronization across federated servers is crucial for this mitigation to be effective, as significant clock skew can lead to legitimate requests being rejected.17

#### **2\. Digest Header Verification**

For POST requests, which are common for ActivityPub inbox messages, the Digest header provides a powerful mechanism for message integrity and implicit replay prevention of the body content. As mandated by Mastodon and reinforced by ActivityPub best practices, the Digest header must contain an RSA-SHA256 hash of the raw request body and must be included in the Signature header's headers parameter.3  
Verification of the Digest header involves re-calculating the hash of the received raw request body and comparing it against the value provided in the Digest header. If the values do not match, it indicates that the body has been tampered with or is not the original content that was signed. This mechanism effectively acts as a content-specific nonce for the request body, preventing an attacker from replaying a signature with a modified payload.8 The absence of  
Digest header verification for POST requests renders the system vulnerable to body tampering and certain replay attacks where the signature remains valid but the message content changes.

#### **3\. Nonce-Based Prevention (Conceptual)**

A nonce, or "number used once," is a unique and typically random string designed to uniquely identify each signed request.13 Nonces provide a more robust defense against replay attacks than timestamps alone, especially when multiple requests might occur within the same timestamp window.16 The core principle is that a nonce, once consumed (i.e., used in a successful or even failed transaction), is marked as invalid for future use.13  
While the HTTP Signature specification itself does not explicitly mandate a nonce header beyond the Date header's created parameter, ActivityPub's specification includes a form of application-level replay prevention. The ActivityPub inbox specification requires servers to perform de-duplication of activities based on their id property.5 This means if an activity with a specific  
id has already been processed, subsequent activities with the same id should be discarded to prevent re-processing. This acts as a nonce at the ActivityPub object level. For an AI Agent implementing the guard, this implies a two-tiered approach to replay prevention: HTTP header-level checks (timestamp, digest) and application-level checks (Activity id de-duplication).

### **C. Table 4: Replay Attack Mitigation Techniques Comparison**

The following table compares various techniques for mitigating replay attacks, highlighting their applicability and considerations within the context of ActivityPub HTTP Signature verification. This comparison aids in understanding the multi-faceted approach required for comprehensive security.  
**Table 4: Replay Attack Mitigation Techniques Comparison**

| Technique | Description | Applicability to ActivityPub HTTP Signatures | Considerations |
| :---- | :---- | :---- | :---- |
| **Timestamps** (Date header) | Include a timestamp in the signed message and reject requests outside a narrow time window. | **Primary:** Date header (and created parameter in RFC9421) MUST be signed and validated. | Requires synchronized clocks between servers. Offers protection against older replays. |
| **Message Digest** (Digest header) | Include a hash of the message body in the signed headers. | **Crucial for POST:** Digest header MUST be present and signed for ActivityPub POSTs. | Ensures body integrity. Acts as a content-specific nonce. Requires raw body access. |
| **Nonces** (unique per request) | Include a unique "number used once" in the signed message. | **Implicit/Application-level:** ActivityPub id de-duplication acts as an activity-level nonce. | Requires persistent storage of used nonces. More robust than timestamps alone for same-timestamp replays. |
| **Session Management** | Generate and manage unique session identifiers for each authenticated session. | Less direct for S2S ActivityPub (stateless requests). | More relevant for client-to-server or persistent connections. |
| **Unique Identifiers** | Assign a distinct identifier to each transaction/communication. | Overlaps with ActivityPub id for activities; keyId for public keys. | Ensures uniqueness at various protocol layers. |

## **V. Implementing HTTP Signature Verification as a NestJS Guard**

NestJS Guards provide an ideal architectural component for implementing HTTP signature verification. This section details the fundamental aspects of NestJS Guards and provides explicit instructions for constructing a robust HttpSignatureGuard.

### **A. NestJS Guards: Role and Lifecycle**

In NestJS, a Guard is a class annotated with @Injectable() that implements the CanActivate interface.18 Guards are primarily responsible for authorization, determining whether a given request should be handled by a route handler based on runtime conditions such as permissions or roles.18  
The execution order of Guards within the NestJS request lifecycle is critical: they are executed *after* all middleware but *before* any interceptor or pipe.18 This positioning makes Guards perfectly suited for authentication and authorization tasks, as they can prevent unauthorized requests from reaching the core business logic. Guards have access to the  
ExecutionContext instance, which provides comprehensive information about the current request context, including the controller class and the handler method that is about to be executed.18 The  
canActivate() method, which must be implemented by every Guard, returns a boolean, a Promise, or an Observable to indicate whether the request is permitted (true) or denied (false).18

### **B. Accessing Request Data within a NestJS Guard**

To perform HTTP signature verification, the Guard requires access to various components of the incoming HTTP request, including headers, the HTTP method, the URL, and crucially, the raw request body.

#### **1\. Enabling Raw Body Access**

For webhook signature validations, such as those required for ActivityPub's Digest header, access to the *unserialized* raw request body is essential.9 By default, NestJS's built-in body parsers consume the raw body, making it inaccessible later. To enable raw body access, the NestJS application must be configured during its creation:

```TypeScript

import { NestFactory } from '@nestjs/core';  
import type { NestExpressApplication } from '@nestjs/platform-express';  
import { AppModule } from './app.module';

async function bootstrap() {  
  const app \= await NestFactory.create\<NestExpressApplication\>(AppModule, {  
    rawBody: true, // Crucial for accessing raw request body  
  });  
  //... further configuration  
  await app.listen(3000);  
}  
bootstrap();
```

This configuration ensures that the raw body is retained and made available on the request object.9 It is important to note that this feature can only be used if the built-in global body parser middleware is enabled (i.e.,  
bodyParser: false must not be passed when creating the app).9 Furthermore, if the expected body size exceeds the default limits (e.g., 100kb for Express, 1MiB for Fastify), the body parser limit should be increased accordingly.9

#### **2\. Extracting Headers, Method, URL, and Raw Body**

Within the canActivate() method of a NestJS Guard, the underlying HTTP request object can be accessed via the ExecutionContext instance. The context.switchToHttp().getRequest() method provides access to this object.18  
Once the request object is obtained, its properties can be accessed:

* **Headers:** The request.headers property (or request.get('header-name') for specific headers) provides access to all incoming HTTP headers.21  
* **Method:** The request.method property returns the HTTP request method (e.g., 'POST', 'GET').22  
* **URL:** The request.url property contains the request URL path (e.g., /inbox). For Express-based applications, request.originalUrl might be more appropriate if routing rewrites the URL.7  
* **Raw Body:** With rawBody: true enabled, the raw request body is available as a Buffer via request.rawBody. The RawBodyRequest interface can be used for type safety.9

### **C. Table 3: NestJS ExecutionContext Request Data Access**

The following table illustrates how to access the necessary request components within a NestJS Guard's canActivate method, which are vital for HTTP signature verification.  
**Table 3: NestJS ExecutionContext Request Data Access for HTTP Signature Verification**

| Request Component | Access Method within canActivate(context: ExecutionContext) | Type | Purpose for Signature Verification |
| :---- | :---- | :---- | :---- |
| **Request Object** | const request \= context.switchToHttp().getRequest(); | RawBodyRequest\<Request\> (Express) or RawBodyRequest\<FastifyRequest\> (Fastify) | Provides access to all underlying HTTP request details. |
| **HTTP Headers** | request.headers or request.get('Header-Name') | IncomingHttpHeaders (Express) or RawHeaders (Fastify) | Retrieve Signature, Digest, Host, Date headers. |
| **HTTP Method** | request.method | string | Used to construct (request-target) derived component. |
| **URL Path** | request.url (Express) or request.originalUrl (Express) | string | Used to construct (request-target) derived component. |
| **Raw Body** | request.rawBody | Buffer | Essential for calculating/verifying the Digest header. |

### **D. Constructing the HttpSignatureGuard**

The HttpSignatureGuard will encapsulate the logic for parsing the signature, retrieving the public key, and performing the cryptographic verification.

#### **1\. Guard Structure and canActivate Method**

The HttpSignatureGuard must be an @Injectable() class implementing CanActivate. It will likely inject a service responsible for public key retrieval and potentially a logger.

```TypeScript

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, BadRequestException } from '@nestjs/common';  
import { Request } from 'express'; // Or 'fastify' for Fastify applications  
import { RawBodyRequest } from '@nestjs/common';  
import { verifyMessage, parse } from 'http-message-signatures'; // Or 'activitypub-http-signatures'  
import { PublicKeysService } from './public-keys.service'; // Custom service for key retrieval  
import { createHash } from 'crypto';

@Injectable()  
export class HttpSignatureGuard implements CanActivate {  
  constructor(private readonly publicKeysService: PublicKeysService) {}

  async canActivate(context: ExecutionContext): Promise\<boolean\> {  
    const request \= context.switchToHttp().getRequest\<RawBodyRequest\<Request\>\>();

    // 1\. Extract necessary request components  
    const method \= request.method.toLowerCase();  
    const url \= request.originalUrl |

| request.url; // Use originalUrl for Express if path rewriting occurs  
    const headers \= request.headers;  
    const rawBody \= request.rawBody; // Available due to { rawBody: true } config

    if (\!headers.signature) {  
      throw new UnauthorizedException('Missing HTTP Signature header');  
    }

    // 2\. Parse the Signature header  
    let parsedSignature;  
    try {  
      // If using 'activitypub-http-signatures', use its parser  
      // const { signature } \= parse({ url, method, headers });  
      // parsedSignature \= signature;  
      // If using 'http-message-signatures', it might require manual parsing or specific input format  
      // For http-message-signatures, you'd typically pass the request object directly  
      // or construct a compatible object. The parse function is not directly exposed for this.  
      // Assuming headers.signature is already parsed by a middleware or similar for http-message-signatures.  
      // For this example, we'll assume \`activitypub-http-signatures\`'s parse function.  
      const signatureHeader \= headers.signature as string;  
      parsedSignature \= parse(signatureHeader); // Simplified for demonstration  
      if (\!parsedSignature) {  
        throw new BadRequestException('Malformed HTTP Signature header');  
      }  
    } catch (error) {  
      throw new BadRequestException(\`Failed to parse HTTP Signature: ${error.message}\`);  
    }

    // 3\. Public Key Resolution  
    const keyId \= parsedSignature.keyid;  
    if (\!keyId) {  
      throw new BadRequestException('Signature header missing keyId parameter');  
    }  
    const publicKeyPem \= await this.publicKeysService.getPublicKey(keyId);  
    if (\!publicKeyPem) {  
      throw new UnauthorizedException(\`Public key not found for keyId: ${keyId}\`);  
    }

    // 4\. Replay Attack Prevention: Timestamp Validation  
    const dateHeader \= headers.date;  
    if (\!dateHeader) {  
      throw new BadRequestException('Missing Date header for signature validation');  
    }  
    const requestDate \= new Date(dateHeader);  
    const now \= new Date();  
    const fiveMinutes \= 5 \* 60 \* 1000; // 5 minutes in milliseconds

    // Check if the request is too old or from the future (accounting for clock skew)  
    if (Math.abs(now.getTime() \- requestDate.getTime()) \> fiveMinutes) {  
      throw new UnauthorizedException('Request timestamp is outside acceptable window');  
    }

    // 5\. Replay Attack Prevention: Digest Header Verification for POST requests  
    if (method \=== 'post' && rawBody) {  
      const digestHeader \= headers.digest as string;  
      if (\!digestHeader) {  
        throw new BadRequestException('Missing Digest header for POST request');  
      }  
      // Expected format: "sha-256=:BASE64\_HASH:"  
      const \[algo, encodedHash\] \= digestHeader.split('=');  
      if (algo\!== 'sha-256' ||\!encodedHash) {  
        throw new BadRequestException('Unsupported Digest algorithm or malformed Digest header');  
      }

      const calculatedHash \= createHash('sha256').update(rawBody).digest('base64');  
      if (encodedHash.slice(1, \-1)\!== calculatedHash) { // Remove leading/trailing ':'  
        throw new UnauthorizedException('Digest mismatch: request body integrity compromised');  
      }  
    }

    // 6\. Perform cryptographic signature verification  
    try {  
      // Construct the request object for verifyMessage based on what was signed  
      // This is a crucial step that depends on the exact library and signed headers.  
      // For http-message-signatures, the request object passed to verifyMessage  
      // must contain the headers that were signed.  
      // For ActivityPub, this means (request-target), host, date, and digest.  
      const requestToVerify \= {  
        method: method.toUpperCase(), // Library might expect uppercase  
        url: url,  
        headers: {...headers }, // Copy all headers  
      };

      // Manually add (request-target) if the library expects it this way  
      // This part is highly dependent on the exact 'http-message-signatures' version/usage  
      // or if 'activitypub-http-signatures' handles it internally.  
      // For demonstration, assuming it expects standard headers \+ raw body for digest.  
      // The \`http-message-signatures\` library's \`verifyMessage\` function  
      // is designed to take a request object and a lookup key function.  
      // It will internally parse the \`Signature\` header and verify against the provided request.  
      const verified \= await verifyMessage({  
        lookupKey: async (params: { keyid: string; alg: string }) \=\> {  
          // The lookupKey function needs to return an object with id, alg, and verify property  
          // or a key object that the library can use.  
          // For http-message-signatures, it expects { id, alg, verify: createVerifier(publicKeyPem, alg) }  
          // or similar. This is where the publicKeyPem obtained earlier is used.  
          return {  
            id: params.keyid,  
            alg: params.alg,  
            // The library's \`createVerifier\` function is used to bind the PEM key.  
            // This assumes the \`alg\` from the signature is compatible.  
            verify: (signingString: string, signature: string) \=\> {  
              // This internal verify function would use Node.js crypto  
              // to check the signature against the signing string and the PEM key.  
              // The http-message-signatures library handles this internally if you pass the PEM.  
              // So, we just need to return the PEM.  
              return { id: params.keyid, alg: params.alg, publicKeyPem: publicKeyPem };  
            }  
          };  
        },  
        request: requestToVerify,  
      });

      if (\!verified) {  
        throw new UnauthorizedException('HTTP Signature verification failed');  
      }

      // 7\. Application-level Replay Prevention (Activity ID de-duplication)  
      // This step requires parsing the ActivityPub body (JSON-LD) to get its 'id'.  
      // This is typically done \*after\* signature verification.  
      // For example:  
      // const activity \= JSON.parse(rawBody.toString('utf8'));  
      // if (activity.id && await this.publicKeysService.isActivityIdProcessed(activity.id)) {  
      //   throw new BadRequestException('Duplicate activity ID received (replay detected)');  
      // }  
      // await this.publicKeysService.markActivityIdAsProcessed(activity.id);

      return true; // Signature is valid, request can proceed  
    } catch (error) {  
      // Log error details for debugging  
      console.error('HTTP Signature verification error:', error.message, error.stack);  
      if (error instanceof UnauthorizedException |

| error instanceof BadRequestException) {  
        throw error; // Re-throw specific HTTP errors  
      }  
      throw new UnauthorizedException('HTTP Signature verification failed unexpectedly');  
    }  
  }  
}
```

#### **2\. Integrating http-message-signatures for Verification**

The verifyMessage function from http-message-signatures is the core of the cryptographic validation.1 It requires a  
lookupKey function that, given parameters from the Signature header (like keyid and alg), returns the corresponding public key in a format suitable for verification. The publicKeyPem obtained from the PublicKeysService is crucial here. The verifyMessage function also takes the request object itself, allowing it to reconstruct the signed string from the actual incoming request headers and compare it against the provided signature.1

#### **3\. Public Key Resolution Strategy within the Guard**

The PublicKeysService is a dedicated NestJS service responsible for fetching and caching public keys. Its getPublicKey(keyId: string) method would implement the robust retrieval strategy discussed in Section III. This service would handle:

* **Caching:** Storing retrieved publicKeyPem values by keyId with appropriate TTLs and eviction policies.5  
* **Remote Fetching:** Using NestJS's HttpService (from @nestjs/axios) or a direct node-fetch call to retrieve actor objects from remote ActivityPub instances.23  
* **Authorized Fetch Handling:** Implementing the fallback logic to retrieve technical attributes if a full actor fetch requires authentication.11  
* **Parsing:** Extracting the publicKeyPem from the fetched actor object.4

#### **4\. Handling Verification Outcomes**

If any step of the verification process fails (e.g., missing headers, malformed signature, key not found, digest mismatch, timestamp out of range, or cryptographic verification failure), the Guard should throw an appropriate NestJS exception, such as UnauthorizedException or BadRequestException.24 This will automatically result in the corresponding HTTP status code being returned to the sender (e.g., 401 Unauthorized for signature issues, 400 Bad Request for malformed headers).24 If the  
canActivate method returns true, the request is deemed valid and proceeds to the controller handler.

### **E. Insights on NestJS Guard Implementation**

The choice of NestJS Guards for HTTP signature verification is architecturally sound due to their position in the request lifecycle and their ability to encapsulate authorization logic.18 The requirement for  
rawBody: true in the NestJS application configuration is a fundamental prerequisite for correctly verifying ActivityPub HTTP signatures for POST requests. Without access to the original, untampered request body, the Guard cannot recompute and verify the Digest hash, leaving the system vulnerable to body tampering and certain replay attacks. This configuration underscores how framework-level settings can have profound security implications for protocol adherence.  
The implementation of the HttpSignatureGuard necessitates careful attention to detail regarding the specific headers required by ActivityPub (e.g., (request-target), host, date, digest), as well as robust public key management, including caching and handling of "Authorized Fetch" complexities. The multi-layered approach to replay attack prevention, combining timestamp validation, Digest header verification, and application-level Activity ID de-duplication, is crucial for maintaining the integrity and security of the ActivityPub inbox.

## **VI. Conclusion and Recommendations for AI Agent Implementation**

This report has detailed the intricate process of HTTP Signature verification for ActivityPub inbox messages within a NestJS environment. It has covered the functional aspects of relevant Node.js libraries, the specific header requirements mandated by ActivityPub implementations like Mastodon, the complexities of public key retrieval and caching, and robust strategies for mitigating replay attacks.

### **A. Summary of Key Verification Steps**

The verification process, as implemented within a NestJS Guard, involves the following critical steps:

1. **Request Data Extraction:** Obtain the HTTP method, URL, all headers, and the raw request body from the NestJS ExecutionContext. Crucially, ensure rawBody: true is configured in the NestJS application.  
2. **Signature Header Parsing:** Parse the Signature header to extract keyId, the list of signed headers, and the signature value.  
3. **Public Key Retrieval:** Use the keyId to fetch the corresponding public key (in PEM format) from a remote ActivityPub actor's profile, leveraging a dedicated, cached PublicKeysService that handles "Authorized Fetch" complexities.  
4. **Timestamp Validation:** Verify the Date header's value against the current time, ensuring it falls within an acceptable, narrow time window to prevent basic replay attacks.  
5. **Digest Verification (for POST requests):** For POST requests, re-calculate the SHA-256 hash of the raw request body and compare it against the value provided in the Digest header. This confirms body integrity and acts as a content-specific nonce.  
6. **Cryptographic Verification:** Utilize the http-message-signatures (or activitypub-http-signatures) library to cryptographically verify the signature against the reconstructed signed string (incorporating (request-target), host, date, and digest) and the retrieved public key.  
7. **Application-Level De-duplication:** After successful HTTP signature verification, parse the ActivityPub message body to extract its id and perform application-level de-duplication to prevent re-processing of already handled activities.

### **B. Architectural Considerations for Robustness and Scalability**

For an AI Agent tasked with building a production-grade ActivityPub inbox, several architectural considerations are paramount:

* **Modularity:** Encapsulate public key retrieval and caching logic within a dedicated service (e.g., PublicKeysService). This promotes separation of concerns, testability, and maintainability.  
* **Caching Strategy:** Implement a sophisticated caching layer for public keys, respecting HTTP caching headers and incorporating a resilient fallback mechanism for key retrieval failures. This is essential for performance and reliability in a federated environment.  
* **Error Handling:** Implement granular error handling within the Guard to provide specific UnauthorizedException or BadRequestException responses, aiding in debugging and interoperability with sending instances.  
* **Logging and Monitoring:** Integrate comprehensive logging to track signature verification attempts, successes, and failures, which is vital for operational visibility and security auditing.  
* **Configuration:** Externalize configurable parameters such as the acceptable timestamp window for replay prevention, allowing for flexible deployment and adjustment.

### **C. Future Considerations**

The ActivityPub ecosystem is dynamic, with ongoing discussions and evolving specifications. An AI Agent should remain cognizant of future developments:

* **RFC9421 and RFC9530 Adoption:** As the community increasingly adopts newer RFCs for HTTP Message Signatures and Digests, ensure the chosen libraries and implementation details remain compliant.  
* **Linked Data Signatures:** While not currently enforced, the ActivityPub specification recommends Linked Data Signatures for increased security.2 Future implementations might need to incorporate verification for these signatures.  
* **Algorithm Agility:** The current standard typically relies on RSASSA-PKCS1-v1\_5 Using SHA-256.3 However, cryptographic best practices evolve, and the system should be designed to accommodate new or stronger algorithms as they emerge.

By adhering to the principles and detailed steps outlined in this report, an AI Agent can construct a highly secure, performant, and interoperable NestJS Guard for HTTP Signature verification, forming a robust foundation for a local ActivityPub implementation.

#### **Works cited**

1. http-message-signatures \- npm, accessed July 19, 2025, [https://www.npmjs.com/package/http-message-signatures](https://www.npmjs.com/package/http-message-signatures)  
2. ActivityPub compliance — ActivityPods, accessed July 19, 2025, [https://activitypods.org/specs/activitypub](https://activitypods.org/specs/activitypub)  
3. Security \- Mastodon documentation, accessed July 19, 2025, [https://docs.joinmastodon.org/spec/security/](https://docs.joinmastodon.org/spec/security/)  
4. ActivityPub \- Mastodon documentation, accessed July 19, 2025, [https://docs.joinmastodon.org/spec/activitypub/](https://docs.joinmastodon.org/spec/activitypub/)  
5. ActivityPub \- W3C, accessed July 19, 2025, [https://www.w3.org/TR/activitypub/](https://www.w3.org/TR/activitypub/)  
6. ActivityPub \- W3C, accessed July 19, 2025, [https://www.w3.org/TR/2016/WD-activitypub-20160128/](https://www.w3.org/TR/2016/WD-activitypub-20160128/)  
7. activitypub-http-signatures \- NPM, accessed July 19, 2025, [https://www.npmjs.com/package/activitypub-http-signatures](https://www.npmjs.com/package/activitypub-http-signatures)  
8. Towards an HTTP signature FEP \- SocialHub, accessed July 19, 2025, [https://socialhub.activitypub.rocks/t/towards-an-http-signature-fep/3896](https://socialhub.activitypub.rocks/t/towards-an-http-signature-fep/3896)  
9. Raw Body | NestJS \- A progressive Node.js framework, accessed July 19, 2025, [https://docs.nestjs.com/faq/raw-body](https://docs.nestjs.com/faq/raw-body)  
10. Configuring your environment \- Mastodon documentation, accessed July 19, 2025, [https://docs.joinmastodon.org/admin/config/](https://docs.joinmastodon.org/admin/config/)  
11. Authorized Fetch and the Instance Actor \- ActivityPub \- SocialHub, accessed July 19, 2025, [https://socialhub.activitypub.rocks/t/authorized-fetch-and-the-instance-actor/3868](https://socialhub.activitypub.rocks/t/authorized-fetch-and-the-instance-actor/3868)  
12. Improving Resilience of ActivityPub Services \- Anil Madhavapeddy, accessed July 19, 2025, [https://anil.recoil.org/ideas/activitypub-resilience](https://anil.recoil.org/ideas/activitypub-resilience)  
13. Solodit Checklist Explained (9): Replay Attack \- Cyfrin, accessed July 19, 2025, [https://www.cyfrin.io/blog/solodit-checklist-explained-9-replay-attack](https://www.cyfrin.io/blog/solodit-checklist-explained-9-replay-attack)  
14. A Guide to Replay Attacks And How to Defend Against Them, accessed July 19, 2025, [https://www.packetlabs.net/posts/a-guide-to-replay-attacks-and-how-to-defend-against-them](https://www.packetlabs.net/posts/a-guide-to-replay-attacks-and-how-to-defend-against-them)  
15. How does Timestamp helps in preventing Replay Attacks in webservices \- Stack Overflow, accessed July 19, 2025, [https://stackoverflow.com/questions/10022053/how-does-timestamp-helps-in-preventing-replay-attacks-in-webservices](https://stackoverflow.com/questions/10022053/how-does-timestamp-helps-in-preventing-replay-attacks-in-webservices)  
16. What's the point of a timestamp in OAuth if a Nonce can only be used one time?, accessed July 19, 2025, [https://stackoverflow.com/questions/6865690/whats-the-point-of-a-timestamp-in-oauth-if-a-nonce-can-only-be-used-one-time](https://stackoverflow.com/questions/6865690/whats-the-point-of-a-timestamp-in-oauth-if-a-nonce-can-only-be-used-one-time)  
17. one way authentication what does timestamp and nonce mean? \- Stack Overflow, accessed July 19, 2025, [https://stackoverflow.com/questions/4751172/one-way-authentication-what-does-timestamp-and-nonce-mean](https://stackoverflow.com/questions/4751172/one-way-authentication-what-does-timestamp-and-nonce-mean)  
18. Guards | NestJS \- A progressive Node.js framework, accessed July 19, 2025, [https://docs.nestjs.com/guards](https://docs.nestjs.com/guards)  
19. Request lifecycle \- FAQ | NestJS \- A progressive Node.js framework, accessed July 19, 2025, [https://docs.nestjs.com/faq/request-lifecycle](https://docs.nestjs.com/faq/request-lifecycle)  
20. NestJS Middleware vs Guard vs Pipe: Understanding the Request Flow | by Bale \- Medium, accessed July 19, 2025, [https://medium.com/@bloodturtle/nestjs-middleware-vs-guard-vs-pipe-understanding-the-request-flow-c26276dbe373](https://medium.com/@bloodturtle/nestjs-middleware-vs-guard-vs-pipe-understanding-the-request-flow-c26276dbe373)  
21. How do I get the domain originating the request (of the front-end) in NestJS \- Stack Overflow, accessed July 19, 2025, [https://stackoverflow.com/questions/60929949/how-do-i-get-the-domain-originating-the-request-of-the-front-end-in-nestjs](https://stackoverflow.com/questions/60929949/how-do-i-get-the-domain-originating-the-request-of-the-front-end-in-nestjs)  
22. Controllers | NestJS \- A progressive Node.js framework, accessed July 19, 2025, [https://docs.nestjs.com/controllers](https://docs.nestjs.com/controllers)  
23. HTTP module | NestJS \- A progressive Node.js framework, accessed July 19, 2025, [https://docs.nestjs.com/techniques/http-module](https://docs.nestjs.com/techniques/http-module)  
24. ActivityPub/Primer/HTTP status codes for delivery \- W3C Wiki, accessed July 19, 2025, [https://www.w3.org/wiki/ActivityPub/Primer/HTTP\_status\_codes\_for\_delivery](https://www.w3.org/wiki/ActivityPub/Primer/HTTP_status_codes_for_delivery)