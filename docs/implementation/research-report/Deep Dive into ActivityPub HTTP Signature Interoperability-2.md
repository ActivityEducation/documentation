---
sidebar_position: 2
title: "ActivityPub HTTP Signature Interoperability"
---

# **Research Report: Deep Dive into ActivityPub HTTP Signature Interoperability**

## **Executive Summary**

The ActivityEducation/backend ActivityPub implementation faces significant challenges in reliably verifying incoming HTTP Signatures, primarily manifesting as "Digest mismatch" errors. This issue critically impedes seamless federation with other Fediverse instances, particularly Mastodon, preventing the correct processing of activities such as follow requests and content interactions. The core of the problem appears to stem from discrepancies in JSON-LD canonicalization processes, the potential inclusion of signature-related fields in digest calculations, and subtle byte stream variations during serialization.  
This report provides a comprehensive analysis of the prevailing HTTP Signature standards, a detailed examination of Mastodon's specific implementation quirks, and an evaluation of the activitypub-http-signatures library's integration hurdles. It identifies that the Fediverse's continued reliance on an outdated draft specification, draft-cavage-http-signatures-12, alongside the slow adoption of newer RFCs, necessitates an adaptive interoperability strategy. Recommendations include strict adherence to Mastodon's unique requirements, implementing a "double-knocking" mechanism for outgoing requests to support both legacy and modern standards, and establishing a robust, automated testing framework for canonicalization and signature verification. Addressing these fundamental discrepancies and adopting best practices for error reporting and testing are paramount to achieving robust and reliable communication across the Fediverse.

## **1\. Introduction to ActivityPub Federation and the HTTP Signature Challenge**

### **1.1. Overview of ActivityPub and its Role in Decentralized Social Networking**

ActivityPub stands as a W3C-recommended decentralized social networking protocol, built upon the ActivityStreams 2.0 data format.1 This protocol is instrumental in enabling a distributed social web, offering both client-to-server (C2S) APIs for content creation, updates, and deletion, and federated server-to-server (S2S) APIs for the delivery of notifications and content.1 The essence of ActivityPub's federation lies in its S2S communication model, where instances exchange information primarily through HTTP POST requests directed at designated "inbox" endpoints, carrying ActivityStreams activities.3 This architecture allows diverse social platforms to interoperate, forming the expansive network known as the Fediverse.

### **1.2. Problem Statement: The "Digest Mismatch" and its Impact on Federation**

The ActivityEducation/backend implementation currently encounters a significant barrier to effective federation: the inability to reliably verify incoming HTTP Signatures. This manifests predominantly as a "Digest mismatch" error, directly compromising the system's capacity for seamless interaction with other Fediverse instances, such as Mastodon \[User Query\]. The consequence is a breakdown in fundamental federated functionalities, including the reception of follow requests, unfollows, and other critical activities. Initial diagnostic efforts have pinpointed several contributing factors to this persistent issue. These include an incomplete custom JSON-LD canonicalization process, the erroneous inclusion of signature-related fields within the digest calculation, subtle byte stream differences during data serialization, and various integration challenges encountered with the activitypub-http-signatures library, such as TypeScript type definition discrepancies, incorrect import/usage patterns, parser input expectations, and complexities in Docker build and dependency management \[User Query\].

### **1.3. Research Objectives: Achieving Robust Interoperability with Mastodon and the Fediverse**

To overcome these challenges and ensure robust, reliable communication within the Fediverse, the research focuses on several key objectives. These include a comprehensive analysis of the activitypub-http-signatures library, a deep investigation into Mastodon's specific HTTP Signature implementation, a broader understanding of the Fediverse's interoperability landscape, and strategies for future-proofing the ActivityEducation/backend through alignment with evolving specifications \[User Query\]. The aim is to resolve the immediate "Digest mismatch" and establish a resilient foundation for long-term federation.

## **2\. HTTP Signature Standards: Evolution and Core Concepts**

### **2.1. Analysis of draft-cavage-http-signatures-12 and its Prevalence in the Fediverse**

draft-cavage-http-signatures-12 has historically served as the de facto standard for HTTP signatures across the Fediverse. This draft specification outlines a mechanism for creating and verifying digital signatures over components of an HTTP message.4 Its widespread adoption is evident among major Fediverse implementations, including Mastodon, PeerTube, Misskey, Pleroma, and Pixelfed.4  
The continued reliance on this expired draft by a significant portion of the Fediverse, despite the existence of a finalized RFC, presents a notable challenge in coordinating protocol upgrades across a decentralized network. This "legacy" standard is a primary interoperability target for the ActivityEducation/backend project. The user's primary goal is robust communication with Mastodon, and it is explicitly stated that Mastodon utilizes draft-cavage-http-signatures-12.12 Other sources confirm this draft remains the most commonly supported version across the Fediverse.7 The fact that this critical security and interoperability mechanism is built upon an expired draft, which is still the prevalent standard, highlights a significant hurdle for new implementations. It implies that strict adherence to this specific draft's nuances, rather than a more modern RFC, is necessary for immediate Mastodon compatibility. This situation underscores a fundamental tension between the current state of Fediverse interoperability and the pursuit of future specification alignment.

### **2.2. Introduction to RFC 9421: HTTP Message Signatures and RFC 9530: Digest Fields**

RFC 9421: HTTP Message Signatures represents the official Internet Standards Track replacement for draft-cavage-http-signatures-12. This RFC provides a more robust and refined mechanism for ensuring end-to-end integrity and authenticity for components of an HTTP message.13 It introduces strict canonicalization rules for message components, designed to ensure that signatures remain verifiable even if messages undergo permitted transformations by intermediaries.  
Complementing RFC 9421 is RFC 9530: Digest Fields, which obsoletes the older RFC 3230\. RFC 9530 defines new HTTP fields, namely Content-Digest and Repr-Digest, specifically for communicating integrity digests of HTTP message content and representations.6 This RFC supports algorithm agility, allowing for flexibility in hashing algorithms, and is explicitly designed to be used in conjunction with HTTP Message Signatures.  
The transition from draft-cavage-http-signatures-12 to RFC 9421 and RFC 9530 is an ongoing process within the Fediverse, but its adoption has been slow. While these RFCs offer significant improvements in security and clarity, many existing Fediverse implementations have not yet fully embraced them, leading to a fragmented landscape. This means that new implementations, such as ActivityEducation/backend, must often support older, less precise specifications to achieve broad compatibility. This situation necessitates strategies like "double-knocking" for outgoing requests, where a modern RFC-compliant signature is attempted first, with a fallback to the older draft if the initial attempt fails.21 This approach allows for communication with both cutting-edge and legacy Fediverse instances.

### **2.3. Principles of JSON Canonicalization for Cryptographic Integrity**

For cryptographic operations such as hashing and digital signing, the data must be expressed in an invariant, or canonical, format. This ensures that the operations are reliably repeatable, meaning that both the sender and receiver will produce the identical input for the cryptographic function, regardless of minor variations in data representation.22 This principle allows the original data to be transmitted "on the wire" while cryptographic operations performed at both ends of the communication generate consistent results.  
Several canonicalization schemes exist for JSON data:

* **JSON Canonicalization Scheme (JCS):** JCS is designed to create a canonical representation of JSON data by building on the strict serialization methods for JSON primitives defined by ECMAScript's JSON.stringify(). It constrains JSON data to the Internet JSON (I-JSON) subset and employs deterministic property sorting.22 A key advantage of JCS is its ability to allow a JSON object to remain a JSON object even after being signed, simplifying system design and logging.  
* **RDF Dataset Canonicalization (URDNA2015 / RDFC-1.0):** This method is specifically designed for JSON-LD documents. It involves a multi-step process: first, the JSON-LD document is expanded into its full RDF graph representation. Then, this RDF dataset is normalized using algorithms like URDNA2015 or its successor, RDFC-1.0. This normalization process includes deterministic handling of blank nodes (anonymous resources in RDF graphs). Finally, the normalized RDF dataset is serialized into a canonical string format, typically N-Quads.26 It is important to note that URDNA2015 is deprecated but supported as an alias for RDFC-1.0, though minor differences in canonical N-Quads output can still occur in some edge cases.27

The fundamental difference in canonicalization approaches (JSON-based JCS versus RDF-based URDNA2015/RDFC-1.0) is a primary suspect for the "Digest mismatch" problem. A digest is a cryptographic hash of the message body. For the hash to be consistent between the sender and receiver, the *exact* byte stream of the body must be identical. If the ActivityEducation/backend is using a different JSON canonicalization method (e.g., a standard JSON.stringify() or a JCS implementation) or an incomplete JSON-LD processing, the resulting byte stream will inevitably differ from Mastodon's, which is known to use RDF canonicalization.28 Even subtle variations in whitespace, character encoding, number representation, or the ordering of properties during serialization will lead to different byte streams, and consequently, different SHA-256 digests. This represents a critical, low-level cause underlying the interoperability failures.

## **3\. Mastodon's HTTP Signature and JSON-LD Implementation**

### **3.1. Mastodon's Specific Requirements for HTTP Signature Algorithms and Signed Headers**

Mastodon's implementation of HTTP Signatures adheres to a strict set of requirements. It mandates the use of RSA-2048 for the key size and SHA-256 for the hashing algorithm; no other algorithms are accepted for signature verification.12 The  
Signature header within the HTTP request must explicitly specify the algorithm used. Furthermore, specific headers are required to be included in the signature base string. These mandatory headers include (request-target), digest, host, and date.12  
Mastodon uses hs2019 as the algorithm identifier within the Signature header. This identifier is a generic placeholder that instructs the verifier to derive the actual cryptographic algorithm from the metadata associated with the keyId.7 However, for Mastodon's internal operations and its interactions with other instances,  
hs2019 consistently resolves to rsa-sha256. This fixed mapping is a crucial detail for any system aiming to interoperate with Mastodon.  
The ActivityEducation/backend must strictly adhere to Mastodon's specific, and somewhat idiosyncratic, HTTP Signature requirements. This involves not only using the fixed RSA-2048 and SHA-256 algorithms but also ensuring that the mandatory headers are precisely included in the signature base string. Any deviation in the ActivityEducation/backend's signature generation process—such as employing a different cryptographic algorithm, omitting a required header, or failing to maintain the correct order of headers in the signing string—will inevitably lead to verification failures on Mastodon's side. This constitutes a direct and non-negotiable set of requirements for achieving interoperability.  
**Table 1: Key HTTP Signature Headers and Their Role in ActivityPub Federation**

| Header Name | Description | Mastodon Requirement | Example Value |
| :---- | :---- | :---- | :---- |
| (request-target) | Pseudo-header representing the HTTP method and path of the request. | Mandatory pseudo-header. | (request-target): post /inbox |
| Digest | SHA-256 hash of the HTTP request body, base64-encoded and prefixed. | Mandatory for POST requests. | sha-256=X48E9qOokqqrvzprM\~ |
| Host | The host and port number of the server to which the request is being sent. | Mandatory header. | example.com |
| Date | The date and time at which the message was originated. | Mandatory header. | Tue, 20 Apr 2021 02:07:55 GMT |
| Signature | Contains the signature parameters and the digital signature itself. | Mandatory header. | keyId="https://example.com/users/alice\#main-key",headers="(request-target) host date digest",signature="BASE64\_ENCODED\_SIGNATURE" |
| Signature parameters: |  |  |  |
| keyId | Identifies the key used to sign the request, typically a URL pointing to the actor's public key. | Mandatory parameter. | https://example.com/users/alice\#main-key |
| headers | A space-separated list of HTTP header fields (and pseudo-headers) included in the signature base string. | Mandatory parameter, must include (request-target) host date digest. | (request-target) host date digest |
| signature | The base64-encoded digital signature value. | Mandatory parameter. | mceeOjqm65vBIC1dfZyJxLC+... |
| algorithm | The signing algorithm used. | Mandatory parameter, Mastodon expects hs2019 which resolves to rsa-sha256. | hs2019 |

### **3.2. Deep Dive into Mastodon's JSON-LD Canonicalization Process**

Mastodon's approach to JSON-LD processing, particularly for cryptographic purposes, is sophisticated and relies on specific Ruby gems. The platform utilizes the json-ld and json-canonicalization gems for handling JSON-LD documents.33 The  
json-ld gem is responsible for parsing and serializing JSON-LD into RDF, and it supports operations such as expansion, compaction, and framing of JSON-LD data.33  
Crucially, for cryptographic integrity, Mastodon (and other Fediverse projects that implement Linked Data Signatures, which share canonicalization principles) performs a multi-step JSON-LD canonicalization process. This involves:

1. **Expanding the JSON-LD document:** This converts the compact JSON-LD representation into a full RDF graph, resolving all compacted IRIs and terms into their absolute forms.  
2. **Converting to an RDF dataset:** The expanded JSON-LD document is transformed into an RDF dataset, which is a set of RDF triples or quads.  
3. **Normalizing the RDF dataset:** This is a critical step where the RDF graph is normalized using the URDNA2015 algorithm (or its current alias, RDFC-1.0), typically facilitated by the rdf-normalize gem.28 This normalization process ensures a canonical representation of the graph, particularly by deterministically handling blank nodes (anonymous resources) which can otherwise lead to varying serializations.  
4. **Hashing the normalized RDF dataset:** The normalized RDF dataset is then serialized into a canonical string format, usually N-Quads, with newlines separating each quad. This serialized string is then hashed using SHA-256.28

Mastodon's JSON-LD canonicalization is not a simple JSON stringification. It involves a complex, multi-step process: JSON-LD expansion, conversion to an RDF graph, RDF graph normalization (including blank node handling), and then serialization of the normalized RDF. This intricate chain is a prime source of subtle byte stream differences if not precisely replicated by the ActivityEducation/backend. The problem statement highlights "Incomplete Custom JSON-LD Canonicalization" and "Subtle Byte Stream Differences," and this complex RDF-based canonicalization process directly explains why these issues arise. The rdf-normalize gem, which implements URDNA2015 (now RDFC-1.0), is designed to handle complex RDF graph structures, including blank nodes.29 If the  
ActivityEducation/backend is not following this exact sequence, or if its chosen JSON-LD library (e.g., jsonld.js or rdf-canonize in JavaScript/TypeScript) implements these steps with different internal logic or defaults (for instance, URDNA2015 and RDFC-1.0 have minor differences that can cause canonical output variations 27), then the resulting byte stream used for the digest calculation will inevitably differ, leading to the "Digest mismatch." This is a deep, technical causal relationship that must be addressed.

### **3.3. Investigation of "Embedded Signature Field in Digest Calculation" and "Subtle Byte Stream Differences"**

The problem statement explicitly identifies "Embedded Signature Field in Digest Calculation" as a contributing factor to the "Digest mismatch" \[User Query\]. For cryptographic integrity, the data being signed or hashed for a digest must *not* include the signature itself or any placeholder for it. Such an inclusion creates a circular dependency, rendering the signature invalid or impossible to verify. In the context of Linked Data Signatures (which, while distinct from HTTP Signatures, share underlying canonicalization principles for the body), Mastodon's approach involves removing the signature property from the JSON-LD document *before* canonicalization and hashing.28 If the  
ActivityEducation/backend is calculating the Digest header on a JSON body that still contains a signature property (even if it's an empty object or a placeholder), the resulting digest will be incorrect. When the actual HTTP signature is later added to the request, the body's digest (calculated *before* the signature was finalized or removed) will no longer match the *actual* body being transmitted, thereby guaranteeing a "Digest mismatch." This represents a fundamental violation of cryptographic integrity.  
Beyond this, "Subtle Byte Stream Differences" can arise from various factors in JSON serialization, even when the logical content is identical:

* **Whitespace:** Canonicalization schemes, such as JCS, explicitly state that "Whitespace between JSON tokens MUST NOT be emitted".25 Any extraneous whitespace in the  
  ActivityEducation/backend's serialized output would lead to a different digest.  
* **Property Ordering:** JCS dictates deterministic property sorting based on UTF-16 code units.22 Similarly, RDF canonicalization imposes a deterministic order on quads.28 If the  
  ActivityEducation/backend's JSON serializer does not strictly sort properties, or if its JSON-LD to RDF conversion and subsequent serialization process results in a different quad order, the digest will differ.  
* **Number Representation:** ECMAScript's JSON.stringify() (and by extension, JCS) can lead to numbers being rounded or their exponential notation being altered (e.g., 1.0 might become 1, or 1e+30 might be used instead of 10000...).25 These subtle changes in numerical representation can alter the byte stream.  
* **Unicode Escaping:** Different systems might escape Unicode characters differently (e.g., \\u000a versus \\n for a newline character). JCS specifies strict rules for this to ensure consistency.25

The "Digest mismatch" is a consequence of these byte-level differences in the canonicalized JSON-LD payload. These discrepancies are often subtle and can stem from variations in whitespace, key ordering, number/string serialization, or the handling of JSON-LD specific features like @context expansion/compaction or blank node normalization. The problem is a testament to the extreme precision required in cryptographic canonicalization. Even seemingly trivial differences in JSON serialization can invalidate a signature. The ActivityEducation/backend must achieve byte-for-byte fidelity with Mastodon's canonicalization process to ensure successful digest verification.  
**Table 2: Comparative Analysis of JSON Canonicalization Approaches**

| Feature | URDNA2015 / RDFC-1.0 (Mastodon) | JSON Canonicalization Scheme (JCS) | Standard JSON.stringify() (Default) |  |
| :---- | :---- | :---- | :---- | :---- |
| **Input** | JSON-LD document | JSON object | JSON object |  |
| **Process** | 1\. JSON-LD expansion. 2\. Conversion to RDF graph. 3\. RDF graph normalization (e.g., blank node labeling). 4\. Serialization to N-Quads. | 1\. ECMAScript-compatible serialization of primitives. 2\. Constraint to I-JSON subset. 3\. Lexicographical property sorting. 4\. No whitespace. | Default serialization based on language runtime. |  |
| **Key Characteristics** | Handles Linked Data semantics, graph-based canonicalization. Addresses blank nodes. | Focuses on deterministic JSON object serialization. Preserves JSON structure. | Varies by implementation, often non-deterministic for property order, inconsistent whitespace. |  |
| **Output** | Canonical N-Quads string. | Canonical JSON string. | Non-canonical JSON string (unless specific options applied). |  |
| **Primary Implementations (Examples)** | Ruby json-ld \+ rdf-normalize (Mastodon) 28, | digitalbazaar/rdf-canonize (JS/TS) 27 | cyberphone/json-canonicalization (JS) 24, RFC 8785 22 | Native JSON.stringify() in JavaScript/TypeScript. |
| **Implications for Digest Calculation** | Essential for ActivityPub's JSON-LD, but complex to replicate precisely. Minor differences in RDF normalization (e.g., URDNA2015 vs RDFC-1.0) can cause byte mismatches. | Provides consistent JSON serialization, but might not be sufficient for full JSON-LD semantic canonicalization required by ActivityPub. | Highly likely to cause byte mismatches due to non-deterministic output. |  |

## **4\. Analysis of activitypub-http-signatures Library and Integration Hurdles**

### **4.1. Overview of the Library's Capabilities and Specification Adherence**

The user's project is developed in TypeScript, which immediately raises a point of clarification regarding the activitypub-http-signatures library. While apsig 4 is a Python library, the  
@misskey-dev/node-http-message-signatures library 6 is a highly relevant JavaScript/TypeScript implementation for HTTP Signatures within the ActivityPub context. This library is designed to support both the older  
draft-cavage-http-signatures-12 and the newer RFC 9421: HTTP Message Signatures, along with RFC 3230 and its successor RFC 9530: Digest Fields.6 It also aims for broad ActivityPub compatibility, including the ability to handle multiple public keys (supporting Ed25519 in addition to RSA).8 The library was developed to replace older, slower  
http-signature implementations, indicating a focus on performance and modern cryptographic practices.6  
The discrepancy between the user's project being in TypeScript and the initial mention of apsig (a Python library) suggests either a misidentification of the specific library in use or a complex interop layer. If the ActivityEducation/backend is indeed using a TypeScript library, its precise implementation of JSON-LD canonicalization and HTTP Signature string construction is a likely source of the current interoperability issues. The problem statement's explicit mention of "activitypub-http-signatures Library Integration Hurdles" directly points to this area as a critical point of failure.

### **4.2. Addressing TypeScript Type Definition Discrepancies, Incorrect Import/Usage Patterns, and Parser Input Expectations**

The problem statement highlights "TypeScript Type Definition Discrepancies, Incorrect Import/Usage Patterns, and Parser Input Expectations" as significant hurdles \[User Query\]. These are common challenges in software development, particularly when integrating complex protocols like ActivityPub.

* **TypeScript Type Definition Discrepancies:** Mismatched or incomplete TypeScript type definitions can lead to situations where incorrect data structures are passed to signature generation or verification functions. While a library like siranweb/activitypub-types 39 provides ActivityPub interfaces, if the core signature library has its own internal type expectations or relies on specific runtime structures, type mismatches can occur silently or lead to runtime errors that are difficult to trace. This can result in the wrong data being canonicalized or signed.  
* **Incorrect Import/Usage Patterns:** Developers might not be invoking the library's canonicalization or signing functions with the precise options or inputs required. For instance, failing to specify the correct canonicalization algorithm, or passing an un-canonicalized JSON body when a pre-canonicalized string is expected, would lead to invalid digests or signatures \[User Query\].  
* **Parser Input Expectations:** The signature library or the underlying JSON-LD parser might have strict expectations about the format of the incoming JSON-LD data. If these expectations are not met (e.g., invalid JSON-LD syntax, unexpected property types), the parser might throw errors or, more subtly, produce an incorrect internal representation that leads to an invalid digest. For example, a change log for Fedify mentions fixing a bug where an inbox handler threw a jsonld.SyntaxError for invalid JSON-LD, causing a 500 Internal Server Error, and now correctly logs the error and returns a 400 Bad Request.21 This illustrates that parser input expectations are a tangible concern.

Beyond the core cryptographic and canonicalization issues, these practical integration challenges can prevent the correct byte stream from being generated for hashing, or lead to incorrect signature string construction. They are symptoms of integration gaps that require clearer documentation, stricter type enforcement, or better examples for the activitypub-http-signatures library to improve the developer experience.

### **4.3. Docker Build and Dependency Management Complexity**

The presence of "Docker Build and Dependency Management Complexity" as a contributing factor indicates a potential source of environmental instability for the ActivityEducation/backend \[User Query\]. Cryptographic operations are highly sensitive to the exact environment in which they are performed, including the specific versions of libraries, underlying system dependencies (such as OpenSSL), and even the architecture of the host system.  
Inconsistent Docker environments or issues with dependency management can lead to non-deterministic behavior in cryptographic operations, making debugging extremely difficult. For instance, if different versions of json-canonicalization or rdf-canonize are inadvertently pulled into different build environments, the generated byte streams or signature outputs might vary. This can result in intermittent or hard-to-diagnose "Digest mismatch" errors that are not directly related to the code logic but rather to the build and deployment pipeline. Ensuring a stable, well-defined, and reproducible build environment is paramount for achieving consistent and verifiable results in sensitive areas like HTTP Signatures.

## **5\. Root Cause Analysis: Unpacking the Digest Mismatch**

### **5.1. Comparative Study of Canonicalization Outputs**

The "Digest mismatch" is the primary symptom indicating a fundamental discrepancy in the cryptographic integrity process. This error occurs when the SHA-256 hash of the HTTP request body, computed by the sender, does not align with the hash independently calculated by the receiver.7 The core hypothesis is that the  
ActivityEducation/backend's JSON-LD canonicalization process diverges from Mastodon's established Ruby-based RDF canonicalization.  
To precisely identify the source of this difference, a systematic comparative study is necessary. This involves:

1. **Selecting a representative ActivityPub JSON-LD object:** This object should encompass various data types, nested structures, and potentially blank nodes to thoroughly test the canonicalization process.  
2. **Processing the object through Mastodon's canonicalization pipeline:** This can be achieved by sending the object to a controlled Mastodon instance and capturing the outgoing signed request, or by replicating Mastodon's canonicalization logic (using Ruby's json-ld and rdf-normalize gems) in a controlled environment to obtain the exact byte stream it generates for hashing.  
3. **Processing the same object through the ActivityEducation/backend's activitypub-http-signatures library:** This involves feeding the identical JSON-LD object into the ActivityEducation/backend's current signing pipeline, specifically isolating the JSON-LD processing and serialization step.  
4. **Comparing the resulting byte streams *before* hashing:** A byte-for-byte comparison of the canonicalized output from both systems is critical. This direct comparison will reveal the precise points of divergence, whether they are single character differences, ordering issues, or variations in escaping.

The "Digest mismatch" is a direct consequence of byte-level differences in the canonicalized JSON-LD payload. These differences are often subtle and can stem from variations in whitespace, key ordering, number/string serialization, or the handling of JSON-LD specific features such as @context expansion/compaction or blank node normalization. The problem is a direct logical outcome of the fact that a cryptographic hash function will produce a different output for even a single bit change in its input. Therefore, pinpointing these byte-level discrepancies is the most critical step in diagnosing and resolving the "Digest mismatch."

### **5.2. Detailed Examination of Whitespace, Property Ordering, and JSON-LD Context Handling Discrepancies**

A closer examination of the canonicalization process reveals several common areas where subtle byte stream differences can arise:

* **Whitespace:** Canonicalization schemes, including JCS, explicitly mandate that "Whitespace between JSON tokens MUST NOT be emitted".25 Similarly, Mastodon's underlying Ruby  
  json-canonicalization gem is designed to generate canonical JSON output.35 Any additional or inconsistent whitespace (e.g., spaces after commas, newlines) in the  
  ActivityEducation/backend's serialized output will result in a different byte stream and, consequently, a different digest.  
* **Property Ordering:** Deterministic ordering of properties within JSON objects is fundamental to canonicalization. JCS dictates lexicographical sorting of property names based on their UTF-16 code units.22 In the context of RDF canonicalization, the process also imposes a deterministic order on the quads (subject, predicate, object, graph) that constitute the RDF dataset.28 If the  
  ActivityEducation/backend's JSON serializer does not strictly sort properties, or if its JSON-LD to RDF conversion and subsequent serialization process results in a different quad order, the digest will differ.  
* **JSON-LD Context Handling:** Mastodon's JSON-LD processing involves a multi-stage approach of expansion and compaction, as handled by its json-ld Ruby gem.33 Variations in how the  
  @context is applied, how IRIs are expanded or compacted, or how blank nodes are handled during the RDF normalization phase (URDNA2015/RDFC-1.0) can lead to different RDF graphs or different N-Quads serializations.27 For instance,  
  URDNA2015 and its successor RDFC-1.0 have "minor differences in the canonical N-Quads form that could cause canonical output differences in some cases".27 If the  
  ActivityEducation/backend's JSON-LD library uses a different version or a slightly different interpretation of these canonicalization rules, even for seemingly identical logical data, the resulting byte stream will diverge. This level of precision is critical for cryptographic integrity.

### **5.3. Identification of Specific Byte Stream Differences Leading to Digest Failures**

Based on the comparative study, specific byte-level discrepancies can be identified that directly lead to digest failures. These might include:

* **Whitespace variations:** For example, an extra space after a comma or colon, or inconsistent use of newlines where none are expected by the canonical form.  
* **Character escaping:** Differences in how special characters (e.g., " or \\) or Unicode characters are escaped (e.g., \\" vs. \\u0022, or \\n vs. \\u000A).25  
* **Property ordering inconsistencies:** Keys not being sorted alphabetically, or differences in how nested object properties are ordered.  
* **Number serialization:** Variations in precision or exponential notation for floating-point numbers (e.g., 1.0 vs. 1, or 1e+30 vs. 1000000000000000000000000000000).25  
* **Blank node identifier differences:** During RDF canonicalization, blank nodes are assigned deterministic identifiers (e.g., \_: followed by a string). If the blank node labeling algorithm in ActivityEducation/backend differs from Mastodon's URDNA2015 implementation, the resulting N-Quads will have different blank node identifiers, leading to a byte mismatch.28

The "Digest mismatch" is a testament to the extreme precision required in cryptographic canonicalization. Even seemingly trivial differences in JSON serialization can invalidate a signature. The ActivityEducation/backend must achieve byte-for-byte fidelity with Mastodon's canonicalization process to resolve these issues. The RFC 9421 specification itself emphasizes that "Message component values therefore need to be canonicalized before they are signed, to ensure that a signature can be verified despite such intermediary transformations".14

## **6\. Fediverse Interoperability Guidelines and Best Practices**

### **6.1. Common Pitfalls and Solutions for HTTP Signature Interoperability**

Interoperating within the Fediverse, particularly concerning HTTP Signatures, presents several common pitfalls that developers frequently encounter:

* **Using different HTTP Signature draft/RFC versions:** The Fediverse has historically relied on draft-cavage-http-signatures-12, while RFC 9421 is the modern standard.12 Mismatching these versions can lead to verification failures.  
* **Incorrect algorithms:** Mastodon strictly requires RSA-2048 and SHA-256.12 Using any other algorithm will result in rejection.  
* **Missing or incorrect signed headers:** The absence of mandatory headers like (request-target), digest, host, or date in the signature base string will cause validation to fail.12  
* **Timestamp discrepancies:** If the signed Date header falls outside an acceptable time window (typically a few minutes), the request may be rejected as a replay attack or due to clock skew.7  
* **Public key fetching issues:** Problems can arise if the remote server returns a 410 Gone status for a deleted actor's keyId, or if the keyId resolution process is incorrect, preventing the retrieval of the necessary public key for verification.7  
* **Lack of clear documentation:** The absence of precise documentation for specific instance requirements often forces developers to reverse-engineer implementations, leading to errors.12

To address these pitfalls, solutions include strict adherence to draft-cavage-http-signatures-12 for Mastodon compatibility, ensuring correct key pair generation and public key exposure (e.g., via the publicKeyPem property in the actor's profile) 44, and implementing robust public key caching and refreshing mechanisms to handle key rotations or actor deletions gracefully.7

### **6.2. Recommendations for Robust Communication Strategies, including "Double-Knocking" for Signature Versions**

The decentralized and asynchronously evolving nature of the Fediverse necessitates an adaptive strategy for HTTP Signature handling. A pragmatic solution for outgoing requests is the implementation of a "double-knocking" mechanism:

1. **Primary Attempt:** The system should first attempt to sign and send requests using RFC 9421, which is the modern and more robust standard.  
2. **Fallback Mechanism:** If the remote server responds with a 401 (Unauthorized) or a similar authentication error, the system should then retry the identical request, this time signing it using draft-cavage-http-signatures-12.9 This approach ensures compatibility with both modern and legacy Fediverse instances.

For incoming requests, the ActivityEducation/backend must be prepared to verify signatures against both RFC 9421 and draft-cavage-http-signatures-12 specifications.6 This adaptive interoperability is crucial because the Fediverse's asynchronous evolution means instances operate on different specification versions.7 The "double-knocking" strategy balances immediate interoperability with forward compatibility, allowing the  
ActivityEducation/backend to communicate effectively across the diverse Fediverse landscape without being limited to the oldest common denominator.  
**Table 3: Fediverse HTTP Signature Algorithm and Specification Support Matrix**

| Fediverse Instance | HTTP Signature Spec Supported | Supported Algorithms | Digest Spec Supported | Notes/Quirks |
| :---- | :---- | :---- | :---- | :---- |
| **Mastodon** | draft-cavage-http-signatures-12 | RSA-2048/SHA-256 (via hs2019) | RFC 3230 (Digest header) | Requires (request-target) host date digest headers. hs2019 algorithm maps to rsa-sha256. "Authorized Fetch" mode requires signatures for public posts/profiles.9 |
| **Pleroma** | draft-cavage-http-signatures-12 | RSA-2048/SHA-256 (via hs2019) | RFC 3230 (Digest header) | Uses pleroma/http\_signatures implementation. Shares many practices with Mastodon. May support Ed25519 in newer versions.7 |
| **Misskey** | draft-cavage-http-signatures-12, RFC 9421 | RSA-SHA256, Ed25519 | RFC 3230, RFC 9530 | @misskey-dev/node-http-message-signatures supports both draft and RFC. Motivates Ed25519 support. Can have multiple public keys.6 |
| **GoToSocial** | draft-cavage-http-signatures-12 (Cavage RFC) | RSA-SHA256, RSA-SHA512, Ed25519 | RFC 3230 (Digest header) | Implements "double-knocking" for query parameters and signature validation (tries with/without). Uses hs2019 for outgoing, resolves to rsa-sha256. keyId format differs (no fragment).9 |
| **Pixelfed** | draft-cavage-http-signatures-12 | RSA-2048/SHA-256 | RFC 3230 (Digest header) | Aligns with Mastodon's Authorized Fetch. Includes timestamps for replay prevention. Uses HTTP Signatures for federation requests.11 |
| **Friendica** | Supports HTTP Signatures, likely draft-cavage-http-signatures-12 | Not explicitly detailed, likely RSA-SHA256 | Not explicitly detailed | Supports ActivityPub, including follow/unfollow, public/non-public communication. Authentication via HTTP Basic and OAuth.49 |
| **NodeBB** | draft-cavage-http-signatures-12, RFC 9421 | Not explicitly detailed | Not explicitly detailed | Plugin supports incoming RFC 9421 signatures. Option to use modern signature format for outgoing. Fetches public key to determine correct verification method.13 |
| **Threads** | draft-cavage-http-signatures-12 (IETF draft) | Not explicitly detailed | Not explicitly detailed | Implements the de facto Fediverse HTTP message signature standard. Signs outgoing POST/GET requests and requires incoming requests to be signed (except Webfinger API). Behaves like Mastodon with AUTHORIZED\_FETCH enabled.10 |

## **7\. Recommendations for Enhanced Error Reporting and Debugging**

### **7.1. Strategies for Detailed Logging and Diagnostic Output for Signature Verification Failures**

Generic error messages like "Digest mismatch" provide insufficient information for effective debugging. To facilitate rapid diagnosis and resolution of HTTP Signature verification failures, implementing granular and detailed logging is critical. The system should provide specific error messages that differentiate between various failure modes, similar to Mastodon's SignatureVerificationError types.32 These should include:

* **Unsupported signature algorithm:** Indicating if the received signature uses an algorithm not supported by the instance's policy.32  
* **Signed request date outside acceptable time window:** Flagging requests that are too old or too far in the future, suggesting replay attacks or clock synchronization issues.7  
* **Missing mandatory signed headers:** Explicitly identifying if required headers (e.g., Digest, Date, Host, (request-target)) are absent from the headers parameter of the Signature header.32  
* **Invalid Digest value:** Specifying if the provided Digest header value is not correctly base64 encoded, or if the hash size is incorrect.32  
* **Actual signature verification failure:** This indicates that all preliminary checks passed, but the cryptographic signature itself is invalid when verified against the public key.54  
* **Public key retrieval failures:** Reporting issues such as a 410 Gone HTTP status code for a deleted actor's keyId, or if the keyId provided in the signature header cannot be resolved to a valid public key.32

Furthermore, for debugging purposes, it is crucial to log the exact string that is being signed or verified (often referred to as the "signature base string") and the calculated digest value at various stages of the process.12 This allows for direct comparison against expected values derived from other implementations, pinpointing the precise point of divergence. The logs should also clearly indicate which canonicalization method was attempted and any deviations from expected canonical forms.

### **7.2. Proposals for Improving Developer Experience During Debugging**

Improving the developer experience during debugging is paramount for efficiently resolving complex interoperability issues. This involves providing tools and practices that enable proactive diagnostics rather than reactive debugging:

* **Develop internal tooling or scripts:** Create dedicated tools or scripts that can perform JSON-LD canonicalization and digest calculation on sample ActivityPub payloads. These tools should allow for quick iteration and byte-for-byte comparison of their output against Mastodon's expected canonicalized forms. This helps isolate canonicalization issues from signature generation issues.  
* **Integrate a "debug mode":** Implement a configurable debug mode within the ActivityEducation/backend that, when activated, outputs verbose details about the HTTP Signature process. This should include parsed headers, signature parameters, the constructed signature base string, and intermediate canonicalized forms of the JSON-LD body. Such detailed output is invaluable for tracing the exact flow and identifying discrepancies.  
* **Improve TypeScript type definitions:** Review and enhance the TypeScript type definitions within the activitypub-http-signatures library and related ActivityPub data structures. Clearer and stricter type definitions can prevent common usage errors by guiding developers toward correct data structures and function parameters.39 This proactive measure can prevent many subtle issues from arising in the first place.

Implementing detailed, step-by-step error reporting and providing internal debugging tools will drastically reduce the time and effort required to diagnose and resolve interoperability issues. This shifts the debugging paradigm from merely identifying a failure to precisely pinpointing its root cause, accelerating the path to a robust and reliable ActivityPub implementation.

## **8\. Future-Proofing and Specification Alignment**

### **8.1. Pathways for Transitioning to RFC 9421 and RFC 9530**

While immediate interoperability with Mastodon necessitates adherence to draft-cavage-http-signatures-12, a long-term strategy for the ActivityEducation/backend must involve a phased transition towards the more modern and robust RFC 9421 and RFC 9530\.  
The primary pathway for this transition involves prioritizing RFC 9421 and RFC 9530 for new outgoing requests, while maintaining draft-cavage-http-signatures-12 as a fallback mechanism through the "double-knocking" strategy.13 This approach allows the system to leverage the benefits of the newer, more secure, and clearly defined RFCs while still ensuring compatibility with the significant portion of the Fediverse that has not yet upgraded. It is crucial to ensure that the chosen  
activitypub-http-signatures library (such as @misskey-dev/node-http-message-signatures) fully supports both specifications and their respective canonicalization rules, including the nuances of RFC 9530 for digest calculations.6 Over time, as more Fediverse instances adopt the newer RFCs, the reliance on  
draft-cavage-http-signatures-12 can be gradually deprecated, streamlining the codebase and enhancing overall security.

### **8.2. Consideration of Relevant Fediverse Enhancement Proposals (FEPs) for Long-Term Stability and Security**

Beyond the current RFCs, the Fediverse community is actively developing Fediverse Enhancement Proposals (FEPs) to address long-standing challenges and introduce new capabilities. These FEPs represent the community-led evolution of ActivityPub and should be considered for long-term stability and security:

* **FEP-8b32: Object Integrity Proofs:** This proposal explores the concept of embedding cryptographic signatures directly within JSON objects rather than relying solely on HTTP Signatures.4 The rationale is that placing signatures on the objects themselves would make them fully self-describing and self-authenticating, addressing the "weirdness" of verifying an object via a request header.55 While this approach is likely not backwards-compatible with existing implementations, it represents a desired future direction for enhanced cryptographic integrity and portability of activities across the network.  
* **FEP-521a: Representing Actor's Public Keys:** This FEP addresses the current limitation where most ActivityPub implementations expect a single RSA public key for an actor's publicKey attribute.56 FEP-521a proposes the addition of an  
  assertionMethod property, leveraging vocabulary from the Verifiable Credential Data Integrity (VCDI) standard, to allow actors to publish multiple public keys, including more modern and efficient cryptographic algorithms like Ed25519, using Multikey serialization.8 This is crucial for adopting stronger and more efficient cryptographic primitives in the future.

While immediate interoperability requires addressing draft-cavage-http-signatures-12 and its specific quirks, the long-term strategy should involve a phased migration towards RFC 9421/RFC 9530 and a readiness to adopt FEPs like Object Integrity Proofs and enhanced public key representation. This approach ensures that the ActivityEducation/backend not only resolves current issues but also remains compatible, secure, and adaptable in the dynamically evolving Fediverse landscape. The @misskey-dev/node-http-message-signatures library's existing support for Ed25519 and RFC 9421 8 positions it well for incorporating these future standards.

## **9\. Testing Strategy Proposal for Interoperability**

### **9.1. Comprehensive Testing Methodologies for HTTP Signatures and JSON-LD Canonicalization**

To ensure and maintain robust interoperability, a comprehensive testing strategy is essential, focusing on both unit-level precision and integration-level functionality.  
**Unit Tests:** Each component of the HTTP Signature and JSON-LD canonicalization process should be rigorously tested:

* **JSON-LD Canonicalization:** Tests should cover various ActivityPub object types, including Note, Question, Create, Follow, Like, Announce, and Delete.11 These tests must include complex nested structures, different JSON-LD contexts, and scenarios involving blank nodes. The output of the  
  ActivityEducation/backend's canonicalization process should be compared byte-for-byte against expected canonicalized examples obtained from a controlled Mastodon instance. This direct comparison is vital for identifying subtle differences in whitespace, property ordering, or character encoding.  
* **Digest Calculation:** Unit tests should verify the correct SHA-256 hash generation on the canonicalized bodies, ensuring that the hashing algorithm is correctly applied and produces the expected output.  
* **Signature String Construction:** Tests must validate the precise order and formatting of headers within the signature base string (e.g., (request-target) host date digest). Any deviation in order or format will invalidate the signature.  
* **Signature Generation/Verification:** Core cryptographic functions should be tested with RSA-2048/SHA-256 key pairs, ensuring that signatures generated by the ActivityEducation/backend can be successfully verified by a standard cryptographic library, and vice-versa.

**Integration Tests:** These tests focus on the interaction between components and with external systems:

* **Simulated Outgoing Requests:** Develop tests that simulate outgoing POST requests from the ActivityEducation/backend, including signed HTTP Signatures, to a mock Mastodon inbox. These tests should verify that the signature base string is correctly constructed and that the digest calculation matches expectations.  
* **Simulated Incoming Requests:** Create tests that simulate incoming signed requests from a mock Mastodon instance. These tests should verify that the ActivityEducation/backend successfully validates both the HTTP Signature and the Digest header.

### **9.2. Cross-Instance Compatibility Testing and Automated Validation**

Manual debugging of federation issues is time-consuming and prone to human error. A robust, automated testing strategy, including byte-level canonicalization comparison and cross-instance integration tests, is essential for ensuring and maintaining interoperability in the dynamic Fediverse.

* **Test Federation Environment:** Set up a dedicated test federation environment comprising instances of various Fediverse software, including Mastodon (ideally multiple versions), Pleroma, Misskey, and GoToSocial. This environment allows for realistic testing of inter-instance communication.  
* **Automated End-to-End Tests:** Implement automated end-to-end tests for common ActivityPub interactions, such as Follow, Create, Like, Announce, and Delete activities.2 These tests should verify that signatures are correctly generated by the  
  ActivityEducation/backend and successfully verified by all target Fediverse instances, and that incoming activities from these instances are correctly processed.  
* **Traffic Inspection Tools:** Utilize network traffic inspection tools (e.g., Wireshark, custom HTTP proxies) during debugging. These tools can capture and analyze raw HTTP headers and body payloads, allowing for precise byte-level comparison of the transmitted data against expected canonical forms.  
* **Continuous Integration:** Integrate these tests into a continuous integration (CI) pipeline. This ensures that any changes to the ActivityEducation/backend's ActivityPub implementation are automatically validated against the established interoperability requirements, preventing regressions and quickly identifying new compatibility issues.

This proactive validation approach will significantly reduce the time and effort required to diagnose and resolve interoperability issues, moving from reactive debugging to a more efficient, diagnostic-driven development cycle.

## **10\. Conclusion**

The persistent "Digest mismatch" errors plaguing the ActivityEducation/backend's ActivityPub implementation are primarily attributable to fundamental discrepancies in JSON-LD canonicalization and potentially erroneous inclusion of signature-related fields in the digest calculation. Mastodon's reliance on a multi-step, RDF-based canonicalization process (URDNA2015/RDFC-1.0), distinct from simpler JSON canonicalization schemes, is a critical factor. Even subtle byte-level variations in whitespace, property ordering, number representation, or Unicode escaping during serialization can invalidate cryptographic digests. Furthermore, the Fediverse's fragmented adoption of HTTP Signature specifications, with widespread adherence to the outdated draft-cavage-http-signatures-12 alongside the slow transition to RFC 9421 and RFC 9530, necessitates a nuanced approach to interoperability.  
To achieve robust and reliable communication, the following recommendations are paramount:

1. **Precise Canonicalization Alignment:** The ActivityEducation/backend must meticulously replicate Mastodon's JSON-LD to RDF canonicalization process, ensuring byte-for-byte fidelity of the serialized body before digest calculation. This includes correctly handling JSON-LD expansion, RDF graph normalization (especially blank nodes), and N-Quads serialization.  
2. **Strict HTTP Signature Adherence:** Implementations must strictly adhere to Mastodon's specific HTTP Signature requirements, including the mandatory use of RSA-2048/SHA-256 (via hs2019) and the precise inclusion of (request-target), digest, host, and date headers in the signature base string. The signature field must be removed from the JSON-LD body before digest calculation.  
3. **Adaptive Interoperability Strategy:** For outgoing requests, a "double-knocking" mechanism is advised, attempting RFC 9421 first and falling back to draft-cavage-http-signatures-12 upon authentication failure. Incoming requests should be prepared for verification against both specifications.  
4. **Enhanced Error Reporting and Debugging:** Implement granular error messages for signature verification failures, distinguishing between various causes (e.g., algorithm mismatch, timestamp issues, missing headers, invalid digest value). Crucially, detailed logging of the exact signature base string and intermediate canonicalized forms will provide invaluable diagnostic data.  
5. **Comprehensive Automated Testing:** Establish a robust testing strategy that includes unit tests for byte-level canonicalization accuracy, and integration tests within a multi-instance Fediverse environment to validate end-to-end communication and signature exchange for common ActivityPub activities.

By addressing these technical intricacies and adopting a proactive, adaptive approach to interoperability and testing, the ActivityEducation/backend can overcome its current federation challenges, ensuring seamless and reliable communication within the broader Fediverse. Long-term stability will further benefit from monitoring and strategically adopting relevant FEPs, such as Object Integrity Proofs and enhanced public key representations, as the decentralized social web continues to evolve.

#### **Works cited**

1. ActivityPub \- W3C on GitHub, accessed July 19, 2025, [https://w3c.github.io/activitypub/](https://w3c.github.io/activitypub/)  
2. ActivityPub \- W3C, accessed July 19, 2025, [https://www.w3.org/TR/activitypub/](https://www.w3.org/TR/activitypub/)  
3. activitypub/implementation.md at gh-pages \- GitHub, accessed July 19, 2025, [https://github.com/mastodon/activitypub/blob/gh-pages/implementation.md](https://github.com/mastodon/activitypub/blob/gh-pages/implementation.md)  
4. fedi-libs/apsig: Signature implementation used in ActivityPub. \- GitHub, accessed July 19, 2025, [https://github.com/AmaseCocoa/apsig](https://github.com/AmaseCocoa/apsig)  
5. Ensuring Message Integrity with HTTP Signatures | by Sathya Bandara | Medium, accessed July 19, 2025, [https://technospace.medium.com/ensuring-message-integrity-with-http-signatures-86f121ac9823](https://technospace.medium.com/ensuring-message-integrity-with-http-signatures-86f121ac9823)  
6. @misskey-dev/node-http-message-signatures \- npm, accessed July 19, 2025, [https://www.npmjs.com/package/@misskey-dev/node-http-message-signatures](https://www.npmjs.com/package/@misskey-dev/node-http-message-signatures)  
7. ActivityPub and HTTP Signatures, accessed July 19, 2025, [https://swicg.github.io/activitypub-http-signature/](https://swicg.github.io/activitypub-http-signature/)  
8. An JavaScript (Node.js and browsers) implementation for HTTP Message Signatures (RFC 9421\) \- GitHub, accessed July 19, 2025, [https://github.com/misskey-dev/node-http-message-signatures](https://github.com/misskey-dev/node-http-message-signatures)  
9. HTTP Signatures \- GoToSocial Documentation, accessed July 19, 2025, [https://docs.gotosocial.org/en/latest/federation/http\_signatures/](https://docs.gotosocial.org/en/latest/federation/http_signatures/)  
10. HTTP message signature standards to federate with Threads | Instagram Help Center, accessed July 19, 2025, [https://help.instagram.com/1458364851378561/?helpref=related\_articles](https://help.instagram.com/1458364851378561/?helpref=related_articles)  
11. ActivityPub | Pixelfed Docs \- GitHub Pages, accessed July 19, 2025, [https://pixelfed.github.io/docs-next/spec/ActivityPub.html](https://pixelfed.github.io/docs-next/spec/ActivityPub.html)  
12. HTTP Signatures (and mastodon) continue to confound \- Python ..., accessed July 19, 2025, [https://socialhub.activitypub.rocks/t/http-signatures-and-mastodon-continue-to-confound/3801](https://socialhub.activitypub.rocks/t/http-signatures-and-mastodon-continue-to-confound/3801)  
13. HTTP Signature Upgrades Coming Soon | NodeBB Community, accessed July 19, 2025, [https://community.nodebb.org/topic/e9dbb7f1-557a-442e-aeb9-e96f28b6afc3/http-signature-upgrades-coming-soon](https://community.nodebb.org/topic/e9dbb7f1-557a-442e-aeb9-e96f28b6afc3/http-signature-upgrades-coming-soon)  
14. RFC 9421: HTTP Message Signatures, accessed July 19, 2025, [https://www.rfc-editor.org/rfc/rfc9421.html](https://www.rfc-editor.org/rfc/rfc9421.html)  
15. RFC 9421: HTTP Message Signatures, accessed July 19, 2025, [https://ftp.st.ryukoku.ac.jp/pub/internet/rfc/rfc9421.pdf](https://ftp.st.ryukoku.ac.jp/pub/internet/rfc/rfc9421.pdf)  
16. HTTP Signatures \- OAuth.net, accessed July 19, 2025, [https://oauth.net/http-signatures/](https://oauth.net/http-signatures/)  
17. RFC 9530 \- Digest Fields \- Datatracker \- IETF, accessed July 19, 2025, [https://datatracker.ietf.org/doc/rfc9530/](https://datatracker.ietf.org/doc/rfc9530/)  
18. Digest Fields \- Web Concepts, accessed July 19, 2025, [https://webconcepts.info/specs/IETF/RFC/9530.html](https://webconcepts.info/specs/IETF/RFC/9530.html)  
19. BibTeX \- IETF Datatracker, accessed July 19, 2025, [https://datatracker.ietf.org/doc/rfc9530/bibtex/](https://datatracker.ietf.org/doc/rfc9530/bibtex/)  
20. dhensby/node-http-message-signatures: A node package for signing and verifying HTTP messages as per RFC 9421 \- HTTP Message Signatures specification \- GitHub, accessed July 19, 2025, [https://github.com/dhensby/node-http-message-signatures](https://github.com/dhensby/node-http-message-signatures)  
21. Fedify changelog, accessed July 19, 2025, [https://fedify.dev/changelog](https://fedify.dev/changelog)  
22. RFC 8785: JSON Canonicalization Scheme (JCS), accessed July 19, 2025, [https://www.rfc-editor.org/rfc/rfc8785](https://www.rfc-editor.org/rfc/rfc8785)  
23. RFC 8785 \- JSON Canonicalization Scheme (JCS) \- IETF Datatracker, accessed July 19, 2025, [https://datatracker.ietf.org/doc/rfc8785/](https://datatracker.ietf.org/doc/rfc8785/)  
24. JSON Canonicalization Scheme (JCS) \- GitHub, accessed July 19, 2025, [https://github.com/cyberphone/json-canonicalization](https://github.com/cyberphone/json-canonicalization)  
25. RFC 8785 \- JSON Canonicalization Scheme (JCS) \- IETF Datatracker, accessed July 19, 2025, [https://datatracker.ietf.org/doc/html/rfc8785](https://datatracker.ietf.org/doc/html/rfc8785)  
26. RDF Dataset Canonicalization and Hash 1.0 Processor Conformance, accessed July 19, 2025, [https://w3c.github.io/rdf-canon/reports/](https://w3c.github.io/rdf-canon/reports/)  
27. digitalbazaar/rdf-canonize: An implementation of the RDF ... \- GitHub, accessed July 19, 2025, [https://github.com/digitalbazaar/rdf-canonize](https://github.com/digitalbazaar/rdf-canonize)  
28. Making sense of RsaSignature2017 \- SocialHub, accessed July 19, 2025, [https://socialhub.activitypub.rocks/t/making-sense-of-rsasignature2017/347](https://socialhub.activitypub.rocks/t/making-sense-of-rsasignature2017/347)  
29. Module: RDF::Normalize \- Gregg Kellogg, accessed July 19, 2025, [http://rdf.greggkellogg.net/yard/RDF/Normalize.html](http://rdf.greggkellogg.net/yard/RDF/Normalize.html)  
30. Class: RDF::Writer Abstract \- Ruby-rdf.github.com, accessed July 19, 2025, [https://ruby-rdf.github.io/rdf/RDF/Writer](https://ruby-rdf.github.io/rdf/RDF/Writer)  
31. Update HTTP signatures to support IETF draft from October 2021 · Issue \#21429 \- GitHub, accessed July 19, 2025, [https://github.com/mastodon/mastodon/issues/21429](https://github.com/mastodon/mastodon/issues/21429)  
32. mastodon/app/controllers/concerns/signature\_verification.rb at main \- GitHub, accessed July 19, 2025, [https://github.com/mastodon/mastodon/blob/main/app/controllers/concerns/signature\_verification.rb](https://github.com/mastodon/mastodon/blob/main/app/controllers/concerns/signature_verification.rb)  
33. json-ld | RubyGems.org | your community gem host, accessed July 19, 2025, [https://rubygems.org/gems/json-ld/versions/3.2.5](https://rubygems.org/gems/json-ld/versions/3.2.5)  
34. Bump json-ld from 3.1.8 to 3.1.9 (\#15812) · 287aa75f2e \- mastodon, accessed July 19, 2025, [https://eugit.opencloud.lu/OpenCloud/mastodon/commit/287aa75f2ecc9bbbb75047e96e64882d8d14fd82](https://eugit.opencloud.lu/OpenCloud/mastodon/commit/287aa75f2ecc9bbbb75047e96e64882d8d14fd82)  
35. json-canonicalization | RubyGems.org | your community gem host, accessed July 19, 2025, [https://rubygems.org/gems/json-canonicalization/versions/1.0.0](https://rubygems.org/gems/json-canonicalization/versions/1.0.0)  
36. json-ld | RubyGems.org | your community gem host, accessed July 19, 2025, [https://rubygems.org/gems/json-ld/versions/3.3.2](https://rubygems.org/gems/json-ld/versions/3.3.2)  
37. mastodon/app/lib/activitypub/linked\_data\_signature.rb at main \- GitHub, accessed July 19, 2025, [https://github.com/mastodon/mastodon/blob/master/app/lib/activitypub/linked\_data\_signature.rb](https://github.com/mastodon/mastodon/blob/master/app/lib/activitypub/linked_data_signature.rb)  
38. digitalbazaar/jsonld.js: A JSON-LD Processor and API implementation in JavaScript \- GitHub, accessed July 19, 2025, [https://github.com/digitalbazaar/jsonld.js/](https://github.com/digitalbazaar/jsonld.js/)  
39. siranweb/activitypub-types: ActivityPub types for Typescript \- GitHub, accessed July 19, 2025, [https://github.com/siranweb/activitypub-types](https://github.com/siranweb/activitypub-types)  
40. JSON-LD 1.1 Processing Algorithms and API, accessed July 19, 2025, [https://w3c.github.io/json-ld-api/](https://w3c.github.io/json-ld-api/)  
41. JSON-LD 1.0 Processing Algorithms and API, accessed July 19, 2025, [https://json-ld.org/spec/FCGS/json-ld-api/20130328/](https://json-ld.org/spec/FCGS/json-ld-api/20130328/)  
42. Unable to verify signature for remote actor 'Delete' activity · Issue \#10286 \- GitHub, accessed July 19, 2025, [https://github.com/tootsuite/mastodon/issues/10286](https://github.com/tootsuite/mastodon/issues/10286)  
43. Activitypub & Mastodon, how to get an Actor? \- Stack Overflow, accessed July 19, 2025, [https://stackoverflow.com/questions/75025657/activitypub-mastodon-how-to-get-an-actor](https://stackoverflow.com/questions/75025657/activitypub-mastodon-how-to-get-an-actor)  
44. How to implement a basic ActivityPub server \- Mastodon Blog, accessed July 19, 2025, [https://blog.joinmastodon.org/2018/06/how-to-implement-a-basic-activitypub-server/](https://blog.joinmastodon.org/2018/06/how-to-implement-a-basic-activitypub-server/)  
45. Linked Data Signatures \+ public key URI · Issue \#203 · w3c/activitypub \- GitHub, accessed July 19, 2025, [https://github.com/w3c/activitypub/issues/203](https://github.com/w3c/activitypub/issues/203)  
46. ActivityPub \- Mastodon documentation, accessed July 19, 2025, [https://docs.joinmastodon.org/spec/activitypub/](https://docs.joinmastodon.org/spec/activitypub/)  
47. Pleroma / Elixir libraries / http\_signatures · GitLab, accessed July 19, 2025, [https://git.pleroma.social/pleroma/elixir-libraries/http\_signatures](https://git.pleroma.social/pleroma/elixir-libraries/http_signatures)  
48. Pixelfed \- Decentralized social media, accessed July 19, 2025, [https://pixelfed.org/](https://pixelfed.org/)  
49. Friendica API \- Documentation \[Friendica / Wiki\], accessed July 19, 2025, [https://wiki.friendi.ca/docs/api](https://wiki.friendi.ca/docs/api)  
50. Friendica API authentication, accessed July 19, 2025, [https://wiki.friendi.ca/docs/api-authentication](https://wiki.friendi.ca/docs/api-authentication)  
51. Friendica API \- GitHub, accessed July 19, 2025, [https://github.com/friendica/friendica/wiki/Friendica-API](https://github.com/friendica/friendica/wiki/Friendica-API)  
52. ActivityPub support in Friendica, accessed July 19, 2025, [https://friendi.ca/2018/11/18/activitypub-support-in-friendica/](https://friendi.ca/2018/11/18/activitypub-support-in-friendica/)  
53. ActivityPub: the present state, or why saving the 'worse is better' virus is both possible and important \- Ariadne's Space, accessed July 19, 2025, [https://ariadne.space/2019/01/09/activitypub-the-present-state-or.html](https://ariadne.space/2019/01/09/activitypub-the-present-state-or.html)  
54. HTTP signature claimed to be invalid \- Python \- SocialHub, accessed July 19, 2025, [https://socialhub.activitypub.rocks/t/http-signature-claimed-to-be-invalid/3111](https://socialhub.activitypub.rocks/t/http-signature-claimed-to-be-invalid/3111)  
55. Desired changes for a future revision of ActivityPub and ... \- SocialHub, accessed July 19, 2025, [https://socialhub.activitypub.rocks/t/desired-changes-for-a-future-revision-of-activitypub-and-activitystreams/4534](https://socialhub.activitypub.rocks/t/desired-changes-for-a-future-revision-of-activitypub-and-activitystreams/4534)  
56. The Path to Decentralized Identity in ActivityPub, accessed July 19, 2025, [https://arcanican.is/primer/ap-decentralization.php](https://arcanican.is/primer/ap-decentralization.php)