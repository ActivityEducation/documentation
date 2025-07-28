---
title: HTTP Signature Verification Guard
---

# **Application Architecture: HTTP Signature Verification Guard**

## **1\. Introduction: The Role of the HTTP Signature Verification Guard**

In a decentralized and federated platform, ensuring the authenticity, integrity, and freshness of incoming requests from external systems is paramount. The HTTP Signature Verification Guard is a crucial NestJS component designed to enforce these security properties. As the **first security gate in the request lifecycle** (as detailed in the architecture.md's "Request Lifecycle & Security" section), it plays a critical role in all inbound federated interactions, particularly for ActivityPub Inbox endpoints.  
The Guard ensures:

* **Authenticity:** Verifies that the request originated from the claimed sender.  
* **Integrity:** Confirms that the request payload and specified headers have not been tampered with in transit.  
* **Freshness:** Ensures the request is recent and protects against replay attacks by checking timestamp validity.  
* **Interoperability:** Adheres to the HTTP Signatures specification, crucial for seamless communication within the Fediverse, aligning with the "Key Specifications & Standards" (architecture.md).

## **2\. Core Principles of HTTP Signature Verification**

HTTP Signatures provide a cryptographic mechanism to sign parts of an HTTP message. Key principles include:

* **Cryptographic Proof:** Uses public-key cryptography (e.g., RSA) to verify the sender's identity. The sender signs the request with their private key, and the receiver verifies it with the sender's publicly available key.  
* **Immutability:** Ensures that signed parts of the request (headers, body digest) cannot be altered without invalidating the signature.  
* **Non-repudiation:** Provides strong evidence of the sender's origin, making it difficult for them to falsely deny sending a request.  
* **Digest Header (Digest):** An optional but highly recommended header that contains a cryptographic hash of the request body. If included and signed, it provides strong body integrity checking for the request body.

## **3\. NestJS Guard Structure and Implementation**

### **3.1. Guard Definition**

The HTTP Signature Verification Guard is a NestJS Guard, implementing the CanActivate interface. This interface requires the implementation of a `canActivate()` method, which determines whether a request should be processed.  
```typescript
// src/common/guards/http-signature-verification.guard.ts  
import {  
  Injectable,  
  CanActivate,  
  ExecutionContext,  
  BadRequestException,  
  UnauthorizedException,  
} from '@nestjs/common';  
import { Request } from 'express';  
import { KeyManagementService } from '../../core/services/key-management.service';  
import * as HttpSignature from '@peertube/http-signature';  
import { LoggerService } from '../services/logger.service';

// Custom exceptions for clarity  
export class HttpSignatureVerificationError extends UnauthorizedException {  
  constructor(message: string) {  
    super(`HTTP Signature Verification Failed: ${message}`);  
  }  
}

export class InvalidDigestError extends BadRequestException {  
  constructor(message: string) {  
    super(`Invalid Digest: ${message}`);  
  }  
}

@Injectable()  
export class HttpSignatureVerificationGuard implements CanActivate {  
  private readonly MAX_CLOCK_SKEW_SECONDS = 300; // 5 minutes

  constructor(  
    private keyManagementService: KeyManagementService,  
    private readonly logger: LoggerService,  
  ) {  
    this.logger.setContext(HttpSignatureVerificationGuard.name);  
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {  
    const req = context.switchToHttp().getRequest<Request>();  
    // ... verification logic (detailed below in 3.3)  
    return true; // if successful  
  }  
}
```

### **3.2. File Location and Naming Conventions**

Guards for cross-cutting concerns like HTTP Signature verification typically reside in a shared common/guards/ directory, as established in the modules.md document's file structure best practices.

* **Path:** `src/common/guards/http-signature-verification.guard.ts`

**Example File Structure:**  
```
src/  
└── common/  
    ├── guards/  
    │   └── http-signature-verification.guard.ts  
    └── services/  
        └── logger.service.ts  
└── core/  
    └── services/  
        └── key-management.service.ts  
└── modules/  
    └── inbox/  
        ├── controllers/  
        │   └── inbox.controller.ts  
        └── inbox.module.ts
```

### **3.3. Verification Process (canActivate Method)**

The canActivate method orchestrates a multi-step verification process:

1. **Header Presence Check:** Verifies that either a Signature or Authorization header is present.  
2. **Request Preparation:** Constructs a request object suitable for the `@peertube/http-signature` library, including the original URL, HTTP method, headers, and the raw request body. The raw body is crucial for accurate Digest header verification.  
3. **Signature Parsing:** Uses `HttpSignature.parse()` to extract components like keyId, algorithm, and signed headers from the signature string. Strict checks ensure all required components are present and valid.  
4. **Algorithm Validation:** Ensures the signature uses a supported algorithm (e.g., rsa-sha256 or hs2019), as per ActivityPub interoperability requirements outlined in the "Key Specifications & Standards" (architecture.md).  
5. **Date Freshness Check (Replay Protection):** If the date header is included in the signature, it verifies that the request timestamp is within an acceptable clock skew (e.g., 5 minutes) to prevent replay attacks.  
6. **Public Key Retrieval:** Uses the injected `KeyManagementService` (likely a global provider from CoreModule as per modules.md and architecture.md) to fetch the public key associated with the keyId from the parsed signature. For federated interactions, this service is responsible for discovering and caching public keys of remote actors.  
7. **Signature Verification:** Calls `HttpSignature.verify()` with the parsed signature and the fetched public key. This step cryptographically validates the signature against the request data and headers. If a Digest header was included and signed, this library typically validates it implicitly as part of the overall signature.  
8. **Error Handling:** Catches various errors throughout the process (e.g., missing headers, invalid format, cryptographic mismatch, key not found) and throws specific custom exceptions (`HttpSignatureVerificationError`, `InvalidDigestError`) for clear error reporting.

## **4\. Interaction with Other Components**

### **4.1. Application to Controllers**

The HttpSignatureVerificationGuard is applied to specific controller methods or entire controllers using the `@UseGuards()` decorator. As per the endpoints.md document, it is **primarily applied to the /inbox endpoint**, which is the central point for receiving all incoming federated activities. This application is crucial for the MVP's "Core ActivityPub Federation" capabilities, including the ingestion of edu:Flashcard and edu:FlashcardModel objects (scope.md).  
```typescript
// src/modules/inbox/controllers/inbox.controller.ts  
import { Controller, Post, UseGuards, Body } from '@nestjs/common';  
import { HttpSignatureVerificationGuard } from '../../common/guards/http-signature-verification.guard';  
import { InboxService } from '../services/inbox.service';

@Controller('inbox')  
export class InboxController {  
  constructor(private readonly inboxService: InboxService) {}

  @UseGuards(HttpSignatureVerificationGuard) // Apply the guard here  
  @Post()  
  async handleActivity(@Body() activity: any): Promise<void> {  
    // After successful signature verification, the Data Integrity Guard and  
    // then the InboxService/ActivityHandlerRegistry will process the activity.  
    await this.inboxService.processIncomingActivity(activity);  
    // ...  
  }  
}
```

### **4.2. Dependencies on Services**

The guard relies on other services for its functionality:

* **KeyManagementService:** Injected into the guard's constructor to retrieve public keys needed for verification. As indicated by the architecture.md's "Module Structure & Dependencies" diagram, this service likely resides in the core/services directory and is provided globally to ensure its availability across modules. It is responsible for managing and fetching public keys from various sources (e.g., caching, remote HTTP requests to actor profiles).  
* **LoggerService:** Used for consistent and detailed logging of the verification process, including debug information and error reporting. This service is typically provided from the common/services directory.

## **5\. Best Practices for HTTP Signature Guard Implementation**

* **Strict Conformance:** Adhere rigorously to the HTTP Signatures specification and ActivityPub's specific requirements (e.g., required headers, algorithms) to ensure maximum interoperability within the Fediverse.  
* **Comprehensive Error Handling:** Provide granular and informative error messages to aid debugging, while ensuring sensitive information is not exposed. Use custom exceptions to categorize verification failures.  
* **Clock Skew Tolerance:** Implement a reasonable tolerance for clock skew between servers to account for time synchronization differences. The `MAX_CLOCK_SKEW_SECONDS` constant is crucial for this.  
* **Robust Key Management:** Ensure the `KeyManagementService` is highly reliable, performs caching of public keys, and handles key rotation and revocation mechanisms if necessary. This is vital for the long-term health of federated connections.  
* **Performance:** Optimize public key retrieval and cryptographic operations, as signature verification can be CPU-intensive under high load. Caching plays a significant role here, as well as considering asynchronous key fetching.  
* **Logging and Monitoring:** Implement detailed logging for successful verifications and, critically, for all failures. Integrate with monitoring systems to detect and alert on unusual patterns of signature verification failures, which could indicate attack attempts or interoperability issues.  
* **Raw Body Access:** Ensure NestJS is configured to provide access to the raw request body (e.g., `using express.json({ verify: ... })` middleware) as the Digest header requires the raw body bytes for verification. This is a common point of failure for signature validation.