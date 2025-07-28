---
title: Activity Decorator
---

# **Application Architecture: Activity Parameter Decorator**

## **1\. Introduction: The Role of the Activity Parameter Decorator**

In a federated ActivityPub platform, incoming data from other instances is typically in JSON-LD format. This requires specific parsing and compaction to be readily usable within the application's business logic. The Activity parameter decorator streamlines this by automatically extracting, parsing, validating, and transforming the raw JSON-LD request body into a strongly-typed JavaScript object (DTO). This is crucial for handling incoming activities on endpoints like the Inbox.  
The Activity decorator ensures:

* **Automatic Parsing:** Handles the conversion of raw request body (often a Buffer) into a JSON object.  
* **JSON-LD Processing:** Performs JSON-LD compaction based on defined contexts, ensuring a standardized, predictable structure.  
* **Strong Type Enforcement:** Validates and transforms the compacted JSON-LD into a specific Data Transfer Object (DTO), moving away from generic any types.  
* **Granular Validation:** Integrates class-validator for semantic validation against defined DTO schemas, ensuring data integrity early in the request lifecycle.  
* **Reduced Boilerplate:** Eliminates repetitive parsing, JSON-LD processing, and initial validation logic from controller methods.

## **2\. Core Principles of Parameter Decorators for JSON-LD**

NestJS parameter decorators are functions that receive ExecutionContext and allow you to transform or inject a value into a specific handler parameter. For ActivityPub, this means dealing with raw request bodies and applying JSON-LD specific transformations and validations.

* **createParamDecorator:** NestJS provides this utility function to easily define custom parameter decorators. It takes a factory function that receives data (an optional argument passed to the decorator, in our case, the target DTO class) and the ExecutionContext.  
* **ExecutionContext:** Provides utilities to access the current request context, allowing you to get the underlying Request object (e.g., from Express) and its raw body.  
* **Raw Body Requirement:** ActivityPub implementations often require access to the *raw* request body (as a Buffer) for HTTP Signature verification (specifically for Digest header validation) and for JSON-LD processing. This means NestJS must be configured to retain the raw body (e.g., rawBody: true in NestFactory.create() in main.ts).  
* **jsonld.js Library:** This decorator leverages the jsonld.js library for robust JSON-LD parsing and compaction, ensuring adherence to the specification.  
* **class-validator & class-transformer:** These libraries are essential for converting the plain JavaScript object (result of JSON-LD compaction) into a strongly-typed DTO instance and then validating it against the DTO's defined constraints.

## **3\. Decorator Structure and Implementation**

### **3.1. Decorator Definition**

The Activity decorator is defined using createParamDecorator. It first parses the request body (prioritizing req.rawBody), then compacts the JSON-LD, and finally validates and transforms the result into a specified DTO.  
```typescript
// src/common/decorators/activity.decorator.ts  
import {  
  createParamDecorator,  
  ExecutionContext,  
  BadRequestException,  
} from '@nestjs/common';  
import { Request } from 'express';  
import * as jsonld from 'jsonld';  
import { validateOrReject, ValidationError } from 'class-validator';  
import { plainToInstance } from 'class-transformer';

// Required for custom loading of contexts (e.g., EducationPub context)  
import '../contexts/custom-document.loader';

/**  
 * Custom parameter decorator to extract, parse, and validate an ActivityPub JSON-LD body  
 * from the raw request body into a strongly-typed DTO.  
 *  
 * This decorator assumes that `rawBody: true` is set in `NestFactory.create`  
 * in `main.ts` and that `bodyParser.raw()` middleware is used to populate `req.rawBody`  
 * or `req.body` with the raw buffer for ActivityPub content types.  
 *  
 * Usage:  
 * @Post('actors/:username/inbox')  
 * async inbox(@Param('username') username: string, @Activity(CreateActivityDto) activity: CreateActivityDto) {  
 * // 'activity' will be a validated instance of CreateActivityDto  
 * }  
 */  
export const Activity = createParamDecorator(  
  async (expectedType: new (...args: any[]) => any, ctx: ExecutionContext) => {  
    const request = ctx.switchToHttp().getRequest<Request>();  
    let parsedBody: any;

    // Prioritize rawBody if available, as it's explicitly configured for ActivityPub JSON-LD  
    if ((request as any).rawBody instanceof Buffer) {  
      try {  
        parsedBody = JSON.parse((request as any).rawBody.toString('utf8'));  
      } catch (error) {  
        throw new BadRequestException(`Invalid JSON payload from rawBody: ${error.message}`);  
      }  
    } else if (request.body instanceof Buffer) {  
      // Fallback to request.body if it's a Buffer  
      try {  
        parsedBody = JSON.parse(request.body.toString('utf8'));  
      } // LCOV_EXCL_START  
      catch (error) {  
        // This catch block is for completeness but should ideally not be hit if rawBody is handled.  
        throw new BadRequestException(`Invalid JSON payload from body (Buffer): ${error.message}`);  
      } // LCOV_EXCL_STOP  
    } else if (request.body && typeof request.body === 'object' && request.body !== null) {  
      // If request.body is already a parsed object (e.g., by another bodyParser.json() middleware)  
      parsedBody = request.body;  
    } else {  
      throw new BadRequestException(  
        'Raw request body not found or not in expected format. Ensure rawBody: true in NestFactory.create() and bodyParser.raw() middleware are configured correctly for ActivityPub content types.',  
      );  
    }

    try {  
      // Define the target context for compaction. This should include all relevant ActivityPub  
      // and application-specific contexts (e.g., EducationPub).  
      const targetContext = {  
        '@context': [  
          'https://www.w3.org/ns/activitystreams',  
          'https://schema.org/', // Included for potential broader semantic data  
          'https://w3id.org/security/v1',  
          'https://w3id.org/identity/v1',  
          'https://edupub.social/ns/education-pub', // Our custom EducationPub context  
        ],  
      };

      // `custom-document.loader` intercepts requests for these context URIs  
      // and serves cached content, preventing external network calls during `jsonld.compact`.  
      // This is crucial for performance and resilience in a federated system.  
      const compactedActivity = await jsonld.compact(  
        parsedBody,  
        targetContext,  
      );

      // Convert the compacted plain object to an instance of the expected DTO class  
      // enableImplicitConversion helps with basic type conversions (e.g., string to number, string to Date)  
      const activityInstance = plainToInstance(expectedType, compactedActivity, {  
        enableImplicitConversion: true,  
      });

      // Validate the DTO instance against its class-validator rules  
      await validateOrReject(activityInstance, {  
        whitelist: true, // Remove properties not defined in the DTO  
        forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are found  
        validationError: { target: false, value: true }, // Customize error output  
      });

      return activityInstance; // Return the strongly typed and validated DTO instance  
    } catch (error) {  
      // Handle validation errors from class-validator  
      if (Array.isArray(error) && error.length > 0 && error[0] instanceof ValidationError) {  
        const validationErrors = error.map(e => Object.values(e.constraints || {})).flat();  
        throw new BadRequestException(`Validation failed: ${validationErrors.join(', ')}`);  
      }  
      // Catch specific jsonld errors or re-throw as BadRequestException for consistency  
      if (error instanceof SyntaxError) {  
        throw new BadRequestException(`Invalid JSON payload: ${error.message}`);  
      }  
      throw new BadRequestException(  
        `Failed to process ActivityPub JSON-LD payload: ${error.message}`,  
      );  
    }  
  },  
);
```

### **3.1.1. How jsonld.compact Transforms Data**

The primary goal of jsonld.compact is to make the JSON-LD document more human-readable and application-friendly by applying a specified `@context`. Here's a detailed breakdown of how it alters the data structure:

1. IRI to Term Resolution (Shorter Keys):  
   Full Internationalized Resource Identifiers (IRIs) or prefixed IRIs are replaced with their shorter, defined terms from the @context. This is the most common and noticeable change.  
   * **Example 1: ActivityStreams Core Terms**  
     * **Input (expanded or verbose):** "http://www.w3.org/ns/activitystreams\#Create"  
     * Output (compacted using as: prefix or default vocab): "Create"  
       (As ActivityStreams context maps as:Create to Create when @vocab is _: and as is defined)  
   * **Example 2: EducationPub Custom Terms**  
     * **Input (full IRI):** "https://edupub.social/ns/education-pub\#Flashcard"  
     * Output (compacted using edu: prefix): "edu:Flashcard"  
       (As EducationPub context defines edu as prefix for its namespace)  
2. Prefixing/Un-prefixing based on @context:  
   Properties originating from different vocabularies will be prefixed according to the targetContext definitions. If a property in the input is already prefixed but the targetContext defines a shorter alias, it will be un-prefixed.  
   * **Example:** If an incoming object uses as:actor and as:object, but the targetContext aliases as:actor to actor and as:object to object (common in ActivityStreams), the output will use actor and object directly.  
3. Nesting/Flattening (Context-Driven Grouping):  
   The targetContext dictates the preferred nesting for properties.  
   * If the context defines a property as nested (e.g., a name property within an object that itself has multiple language variations using @container: @language), compact will introduce this nesting if the input is flat.  
   * Conversely, if deeply nested properties in the input are defined as flat in the targetContext, it might flatten them. This ensures the output adheres to a canonical, readable structure preferred by our application.  
   * **Example (Hypothetical ActivityStreams property 'image' with 'url'):**  
     * **Input (flat):** `{ "actor": "...", "image_url": "http://example.com/pic.jpg" }`  
     * **If context defines image as nested `{ "@id": "as:image", "@type": "@id" }` and then maps a url within it:**  
     * **Output (nested):** `{ "actor": "...", "image": { "url": "http://example.com/pic.jpg" } }`
4. Type Coercion:  
   jsonld.compact can apply type coercions defined in the @context. For instance, properties marked with "@type": "@id" will be treated as IRIs, ensuring they are properly resolved if relative or validated as valid URIs.  
   * **Example:** For ActivityStreams properties like actor, object, target, which are defined with "@type": "@id" in the context, jsonld.js will ensure their values are handled as URIs.  
5. Handling of Arrays and Lists (@container: @list):  
   Properties defined with @container: @list in the context (like orderedItems in OrderedCollection) will ensure that the values are always treated as an ordered array, even if the input only provides a single value (it will be wrapped in an array).  
6. Removal of Unmapped Properties:  
   Any properties in the incoming JSON-LD that are not defined or mapped within the targetContext might be dropped from the compacted output unless the @context uses an open vocabulary mapping (e.g., @vocab). This is generally a good thing, ensuring only expected and semantically understood data is processed.

### **3.2. File Location and Naming Conventions**

Custom decorators that are generic and handle cross-cutting concerns like ActivityPub payload parsing should reside in a common/decorators/ directory. This aligns with the shared utility component structure defined in modules.md.

* **Path:** src/common/decorators/activity.decorator.ts

**Example File Structure:**  
```
src/  
└── common/  
    ├── decorators/  
    │   └── activity.decorator.ts  
    │   └── user.decorator.ts  
    ├── contexts/  
    │   └── custom-document.loader.ts // For JSON-LD context loading  
└── modules/  
    └── inbox/  
        ├── controllers/  
        │   └── inbox.controller.ts  
        └── services/  
            └── inbox.service.ts
```

### **3.3. DTO Definitions for ActivityPub and EducationPub**

To ensure strong typing and semantic validation, specific Data Transfer Objects (DTOs) will be defined for various ActivityPub activities and EducationPub objects. These DTOs will leverage class-validator decorators for validation rules and class-transformer for object-to-instance conversion.  
**Example DTO Structure:**  
```typescript
// src/common/dto/activitypub/activity-base.dto.ts  
import { IsString, IsUrl, IsOptional, IsArray, ValidateNested } from 'class-validator';  
import { Type } from 'class-transformer';

export class ActivityBaseDto {  
  @IsUrl()  
  id: string; // Canonical URI for the activity

  @IsString({ each: true }) // Can be a string or array of strings (e.g., \['Create', 'Activity'\])  
  type: string | string[];

  @IsUrl()  
  actor: string; // IRI of the actor performing the activity

  @IsString()  
  published: string; // ISO 8601 timestamp

  @IsOptional()  
  @IsUrl({ each: true })  
  to?: string | string[]; // Recipient(s) of the activity

  @IsOptional()  
  @IsUrl({ each: true })  
  cc?: string | string[]; // Carbon copy recipients  
}

// src/common/dto/activitypub/create-activity.dto.ts  
import { IsString, IsUrl, ValidateNested } from 'class-validator';  
import { Type } from 'class-transformer';  
import { ActivityBaseDto } from './activity-base.dto';  
// Assuming your specific content DTOs (e.g., FlashcardDto) reside in their respective modules,  
// or in common/dto/education if they are generic enough.  
import { FlashcardDto } from '../../../modules/education/dto/flashcard.dto'; // Example import

// A base DTO for ActivityPub objects like Note, Article, or our custom Flashcard  
export class ActivityObjectDto {  
  @IsUrl()  
  id: string;

  @IsString({ each: true })  
  type: string | string[]; // e.g., 'Note', 'Document', \['edu:Flashcard', 'Document'\]

  @IsOptional()  
  @IsString()  
  content?: string; // For objects with direct content (e.g., Note)

  @IsOptional()  
  @IsUrl()  
  url?: string; // Canonical URL for the object

  // Conditional validation or more specific nested DTOs can be added here  
  // based on the 'type' field using @ValidateIf.  
  // For 'edu:Flashcard', it will be structured via jsonld.compact to have edu:flashcard or similar.  
  // The @Type is crucial for plainToInstance to create nested DTO instances.  
  @IsOptional()  
  @ValidateNested()  
  @Type(() => FlashcardDto) // Use specific DTOs for custom types within 'object'  
  'edu:flashcard'?: FlashcardDto; // Example: if a custom property "edu:flashcard" holds the Flashcard data  
}

export class CreateActivityDto extends ActivityBaseDto {  
  type: 'Create'; // Explicitly type the activity

  @ValidateNested()  
  @Type(() => ActivityObjectDto)  
  object: ActivityObjectDto; // The object being created (e.g., a Note, a Flashcard)  
} 

// src/common/dto/activitypub/follow-activity.dto.ts  
import { ActivityBaseDto } from './activity-base.dto';

export class FollowActivityDto extends ActivityBaseDto {  
  type: 'Follow';

  @IsUrl()  
  object: string; // The IRI of the actor being followed  
}

// src/modules/education/dto/flashcard.dto.ts  
// This DTO would live within the education module as it's specific to edu: vocabulary  
import { IsString, IsUrl, IsObject, IsArray, IsOptional } from 'class-validator';

export class FlashcardDto {  
  @IsUrl()  
  id: string;

  @IsString({ each: true })  
  type: ['edu:Flashcard', 'Document'];

  @IsString()  
  name: string;

  @IsUrl()  
  'edu:model': string; // Reference to the FlashcardModel IRI

  @IsObject()  
  'edu:fieldsData': Record<string, any>; // Flexible object for field data

  @IsOptional()  
  @IsArray()  
  @IsString({ each: true })  
  'edu:tags'?: string[];

  // ... other edu:Flashcard specific properties from vocabulary spec  
}
```

## **4\. Interaction with Other Components**

### **4.1. Application in Controllers**

The Activity decorator is primarily used in controller methods responsible for receiving ActivityPub payloads, most notably the Inbox endpoint (/inbox or /actors/:username/inbox). It's typically used in conjunction with the HttpSignatureVerificationGuard which processes the raw body first.  

```typescript
// src/modules/inbox/controllers/inbox.controller.ts  
import { Controller, Post, UseGuards, Param, Req } from '@nestjs/common';  
import { Request } from 'express';  
import { HttpSignatureVerificationGuard } from '../../common/guards/http-signature-verification.guard';  
import { Activity } from '../../common/decorators/activity.decorator'; // Our custom decorator  
import { InboxService } from '../services/inbox.service';  
import { CreateActivityDto } from '../../common/dto/activitypub/create-activity.dto'; // Import specific DTO  
import { FollowActivityDto } from '../../common/dto/activitypub/follow-activity.dto'; // Import specific DTO

@Controller('actors')  
export class InboxController {  
  constructor(private readonly inboxService: InboxService) {}

  @UseGuards(HttpSignatureVerificationGuard)  
  @Post(':username/inbox')  
  async handleInboxActivity(  
    @Param('username') username: string,  
    // Use an intelligent switch or mapping based on 'type' from the raw body to select DTO.  
    // For simplicity in this example, assuming a 'Create' or 'Follow' activity:  
    @Activity(CreateActivityDto) // Pass the DTO class to the decorator  
    activity: CreateActivityDto | FollowActivityDto, // Union type if multiple types are expected here  
    @Req() req: Request, // Original request, rawBody available for HTTP Signature (though guard already ran)  
  ) {  
    // At this point, 'activity' is a validated and strongly-typed DTO instance.  
    // Business logic can now process the activity with full type safety.  
    if (activity.type === 'Create') {  
      await this.inboxService.processCreateActivity(activity as CreateActivityDto);  
    } else if (activity.type === 'Follow') {  
      await this.inboxService.processFollowActivity(activity as FollowActivityDto);  
    }  
    return { status: 'accepted' };  
  }  
}
```

### **4.2. Dependencies**

* **Raw Body Availability:** The decorator fundamentally relies on the NestJS application being configured to provide access to the raw request body. This is typically achieved by setting rawBody: true in NestFactory.create() and ensuring the appropriate body-parsing middleware (e.g., bodyParser.raw()) is used for ActivityPub content types.  
* **jsonld.js Library:** This external library is essential for performing the JSON-LD parsing, expansion, and compaction.  
* **class-validator & class-transformer:** These libraries are crucial for transforming plain objects into DTO instances and applying robust validation rules.  
* **Context Loaders:** The decorator explicitly imports ../contexts/custom-document.loader. This implies that the application uses a custom JSON-LD document loader to handle resolution of @context URIs, particularly for https://social.bleauweb.org/ns/education-pub and others, by caching or custom fetching mechanisms. This is critical for the jsonld.compact function to correctly interpret terms from our custom vocabulary (edu:).

## **5\. Best Practices for Activity Decorator Usage**

* **Ensure Raw Body Configuration:** It is paramount that the NestJS application's main.ts and middleware setup correctly handle incoming ActivityPub content types (application/activity+json, application/ld+json) to ensure the raw body is available as a Buffer.  
* **Comprehensive Contexts:** The targetContext within the decorator must include *all* relevant JSON-LD contexts (ActivityStreams, Schema.org, Security vocabularies, and crucially, https://social.bleauweb.org/ns/education-pub) to ensure correct parsing and compaction of various ActivityPub and EducationPub types.  
* **Robust Error Handling:** The decorator's internal error handling is designed to catch parsing, JSON-LD processing, and DTO validation errors, throwing BadRequestException for invalid payloads. Downstream services should ideally assume a valid, strongly-typed activity object is received.  
* **Granular DTOs:** Create specific DTOs for each distinct ActivityPub activity type (Create, Follow, Like, Announce, Update, Delete, Undo) and for any custom objects within them (e.g., FlashcardDto, FlashcardModelDto). This ensures precise validation and type safety.  
* **Maintain DTOs with Vocabulary:** Keep DTOs synchronized with the EducationPub Vocabulary Specification and ActivityStreams 2.0 to reflect changes in the data models.  
* **Performance Considerations (Advanced):** While jsonld.js is optimized, processing extremely large or complex JSON-LD payloads on every request can be CPU-intensive. For very high-throughput scenarios, advanced caching strategies for common activity types (beyond simple content caching) or offloading parsing to worker threads could be explored in future iterations.  
* **Order of Guards/Interceptors:** Ensure the HttpSignatureVerificationGuard runs *before* this Activity decorator in the chain. The guard requires the raw body and its verification step typically precedes payload interpretation and transformation. NestJS's execution order for guards and decorators is predictable, but explicit @UseGuards() placement helps clarity.