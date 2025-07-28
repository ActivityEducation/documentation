---
title: User Decorator
---

# **Application Architecture: User Parameter Decorator**

## **1\. Introduction: The Role of the User Parameter Decorator**

In NestJS applications, securely accessing authenticated user information within controllers is a common requirement. The User parameter decorator simplifies this process by providing a concise and type-safe way to extract the entire authenticated user object or a specific property from it directly within route handlers. This enhances code readability, reduces boilerplate, and improves developer experience.  
The User decorator ensures:

* **Convenience:** Simplifies access to user data from request.user.  
* **Readability:** Makes controller signatures cleaner and more intuitive.  
* **Flexibility:** Allows extraction of the full user object or a specific nested property.  
* **Consistency:** Promotes a standardized way of accessing user information across the application.

## **2\. Core Principles of Parameter Decorators**

NestJS parameter decorators are functions that receive ExecutionContext and allow you to transform or inject a value into a specific handler parameter. They leverage Node.js's Decorator pattern to provide meta-programming capabilities.

* **createParamDecorator:** NestJS provides this utility function to easily define custom parameter decorators. It takes a factory function that receives data (the argument passed to the decorator, e.g., 'id' in `@User('id')`) and the ExecutionContext.  
* **ExecutionContext:** Provides utilities to access the current request context, allowing you to get the underlying Request object (e.g., from `Express`).  
* **Request Augmentation:** Authentication guards (e.g., using `Passport.js`) attach the authenticated user object to request.user. The parameter decorator then reads from this augmented request.

## **3\. Decorator Structure and Implementation**

### **3.1. Decorator Definition**

The User decorator is defined using createParamDecorator. It accesses request.user and, based on whether a data argument is provided, returns either a specific property or the entire user object.  
```typescript
// src/common/decorators/user.decorator.ts  
import { createParamDecorator, ExecutionContext } from '@nestjs/common';  
import { getNestedProperty } from '../utils/object-property-accessor'; // Required utility for safe nested property access

/**  
 * Custom parameter decorator to extract the authenticated user object (or a specific property)  
 * from the request. This simplifies accessing user data in controllers.  
 * Usage: `@User() user: UserDto` or `@User('id') userId: string` or `@User('actor.activityPubId') actorId: string`.  
 */  
export const User = createParamDecorator(  
  (data: string, ctx: ExecutionContext) => {  
    const request = ctx.switchToHttp().getRequest();  
    // Passport.js (or similar authentication module) attaches the validated user object to \`request.user\`.  
    const user = request.user;

    // If a specific property name (e.g., 'id', 'username', 'actor.activityPubId') is provided,  
    // use a utility function to safely retrieve that nested property.  
    // Otherwise, return the entire user object.  
    return data ? getNestedProperty(user, data) : user;  
  },  
);
```

### **3.2. File Location and Naming Conventions**

Custom decorators that are generic and can be used across multiple modules must reside in a common/decorators/ directory. This aligns with the shared utility component structure defined in modules.md.

* **Path:** src/common/decorators/user.decorator.ts

**Example File Structure:**  
```
src/  
└── common/  
    ├── decorators/  
    │   └── user.decorator.ts  
    └── utils/  
        └── object-property-accessor.ts // Utility for getNestedProperty  
└── modules/  
    └── user/  
        ├── controllers/  
        │   └── user.controller.ts  
        └── services/  
            └── user.service.ts
```

## **4\. Interaction with Other Components**

### **4.1. Application in Controllers**

The User decorator is primarily used in controller methods to easily access the authenticated user's data. It assumes that an authentication guard (e.g., a JWT guard, a local strategy guard) has already run and populated request.user.  
```typescript
// src/modules/user/controllers/user.controller.ts  
import { Controller, Get, UseGuards } from '@nestjs/common';  
import { AuthGuard } from '@nestjs/passport'; // Example authentication guard  
import { User } from '../../common/decorators/user.decorator';  
import { UserService } from '../services/user.service';  
import { UserDto } from '../dto/user.dto'; // DTO for user representation

@Controller('users')  
export class UserController {  
  constructor(private readonly userService: UserService) {}

  // Apply an AuthGuard before the controller method to ensure request.user is populated  
  @UseGuards(AuthGuard('jwt')) // Assuming 'jwt' strategy for authentication  
  @Get('me')  
  getProfile(@User() user: UserDto) { // Injects the full UserDto object  
    // 'user' will contain the authenticated user's data, typically mapped from the User entity.  
    return user;  
  }

  @UseGuards(AuthGuard('jwt'))  
  @Get('my-id')  
  getMyId(@User('id') userId: string) { // Injects only the 'id' property of the User entity  
    return `Your user ID is: ${userId}`;  
  }

  @UseGuards(AuthGuard('jwt'))  
  @Get('my-activitypub-id')  
  getMyActivityPubId(@User('actor.activityPubId') actorId: string) { // Injects a nested property from the associated Actor entity  
    // As per architecture.md's D.1 Data Model, the User entity has a 1:1 relationship with an Actor entity.  
    // This assumes 'request.user' (or the UserDto) contains the nested 'actor' property.  
    return `Your ActivityPub ID is: ${actorId}`;  
  }  
}
```

### **4.2. Dependencies**

* **Authentication Guards:** The User decorator relies on an upstream authentication mechanism (e.g., Passport.js strategies, custom guards) that correctly authenticates the request and populates the request.user object. Without this, request.user would be undefined, and the decorator would return undefined.  
* **object-property-accessor.ts:** The decorator leverages a utility function getNestedProperty (located in `src/common/utils/`) for safely accessing nested properties. This utility must handle cases where a nested property might not exist, preventing runtime errors.

## **5\. Best Practices for User Decorator Usage**

* **Always Pair with Authentication:** The User decorator must always be used in conjunction with an authentication guard (`@UseGuards()`) to ensure request.user is properly populated with authenticated data.  
* **Type Safety:** Leverage TypeScript interfaces or DTOs to provide type hints for the injected user object or property (e.g., user: `UserDto`).  
* **Clear Property Paths:** When requesting specific properties, use clear and correct string paths (e.g., 'id', 'username', 'actor.activityPubId'). These paths should reflect the structure of the object attached to request.user.  
* **Error Handling (Implicit):** While the decorator itself handles undefined properties gracefully (by returning undefined), subsequent business logic must account for the possibility of user or a specific property being undefined if the preceding authentication or data structure assumptions are not met.  
* **Avoid Business Logic:** The decorator's sole responsibility is data extraction. Do not embed complex business logic or validation directly within the decorator's factory function. This belongs in services.