---
title: Phase 4
sidebar_position: 4
---

# **EducationPub RBAC Implementation: Phase 4 - Operational Security & CLI Tooling Integration**

## **Objective:**

Address critical security configurations and outline future CLI tooling for RBAC management.

## **Tasks:**

### **Task 4.1: Update main.ts for Global Interceptor & Error Handling**

This task ensures global application-wide interceptors are correctly configured for security and consistent error responses.

* **Action:** Modify src/main.ts.  
* **Details:** Ensure ClassSerializerInterceptor is applied globally using app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector))). This ensures @Exclude() decorators are respected for all outgoing API responses. Re-verify HttpExceptionFilter is correctly applied for generic error responses, preventing sensitive internal details from being exposed to API consumers.  
* **Expected Outcome:** Sensitive data is excluded from all API responses, and error messages are generic in production.

```typescript
// src/main.ts  
import { NestFactory } from '@nestjs/core';  
import { AppModule } from './app.module';  
import { Logger, ValidationPipe } from '@nestjs/common';  
import * as bodyParser from 'body-parser';  
import { setupSwagger } from './swagger.setup';  
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';  
import { LoggerService } from './shared/services/logger.service';  
import { ClassSerializerInterceptor } from '@nestjs/common';  
import { Reflector } from '@nestjs/core';

async function bootstrap() {  
  const app = await NestFactory.create(AppModule, {  
    rawBody: true,  
    bodyParser: false,  
    logger: new Logger(),  
  });

  app.use(bodyParser.raw({ type: 'application/ld+json' }));  
  app.use(bodyParser.raw({ type: 'application/activity+json' }));  
  app.use(bodyParser.json({ type: 'application/ld+json' }));  
  app.use(bodyParser.json({ type: 'application/activity+json' }));  
  app.use(bodyParser.json());  
  app.use(bodyParser.urlencoded({ extended: true }));

  const loggerService = await app.resolve(LoggerService);  
  loggerService.setContext('Bootstrap');

  app.useGlobalFilters(new HttpExceptionFilter(loggerService));  
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, }));  
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector))); // Global ClassSerializerInterceptor

  app.enableCors({ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', credentials: true, allowedHeaders: 'Content-Type, Accept, Authorization, Signature, Date, Digest', exposedHeaders: 'Signature, Date, Digest', });  
  app.setGlobalPrefix('api', { exclude: ['.well-known/(.*)', 'nodeinfo/(.*)', 'ns/(.*)', 'health', 'robots.txt'], });  
  setupSwagger(app);

  await app.listen(80);  
  loggerService.log(`Application is running on: ${await app.getUrl()}`, 'Bootstrap');  
}  
bootstrap();
```

### **Task 4.2: Implement Stale Roles Cleanup on Startup**

This task adds a proactive check to identify and warn about data inconsistencies related to user roles.

* **Action:** Modify src/shared/config/permission-config.service.ts.  
* **Details:** In PermissionConfigService.onModuleInit, after loading YAML, add a call to a private method checkStaleRolesOnStartup(). This method will query all users from the database, identify any user.roles that are no longer defined in the loaded YAML configuration, and log a WARN message for each instance of stale roles. It should also invalidate any cached AppAbility instances in Redis for users with stale roles (e.g., by iterating through affected users and deleting their rbac:ability:$&lcub;userId&rcub; keys).  
* **Expected Outcome:** System logs warnings for data inconsistencies, prompting admin action.

```typescript
// src/shared/config/permission-config.service.ts  
import { Injectable, OnModuleInit, InternalServerErrorException, BadRequestException } from '@nestjs/common';  
import { ConfigService } from '@nestjs/config';  
import { LoggerService } from '../services/logger.service';  
import * as yaml from 'js-yaml';  
import * as fs from 'fs';  
import * as path from 'path';  
import { UserEntity } from 'src/features/auth/entities/user.entity';  
import { InjectRepository } from '@nestjs/typeorm';  
import { Repository } from 'typeorm';  
import { Inject } from '@nestjs/common';  
import Redis from 'ioredis';

export interface PermissionRule {  
  action: string; subject: string; conditions?: object; fields?: string; type?: 'allow' | 'deny';  
}  
interface RoleConfig { name: string; permissions: PermissionRule[]; }

@Injectable()  
export class PermissionConfigService implements OnModuleInit {  
  private rolesPermissionsMap: `Map<string, PermissionRule[]>`= new Map();  
  private rolesYamlPath: string;

  constructor(  
    private readonly configService: ConfigService, private readonly logger: LoggerService,  
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,  
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,  
  ) {  
    this.logger.setContext('PermissionConfigService');  
    this.rolesYamlPath = path.join(process.cwd(), 'config', 'roles.yaml');  
  }

  async onModuleInit() {  
    await this.loadRolesAndPermissionsFromYaml();  
    await this.checkStaleRolesOnStartup();  
  }

  private async loadRolesAndPermissionsFromYaml(): Promise<void> {  
    this.logger.log('Loading roles and permissions from YAML files...');  
    try {  
      if (!fs.existsSync(this.rolesYamlPath)) {  
        this.logger.error(`Roles YAML file not found at: ${this.rolesYamlPath}. RBAC will be limited.`);  
        return;  
      }  
      const rolesYamlContent = fs.readFileSync(this.rolesYamlPath, 'utf8');  
      const yamlRoles: RoleConfig[] = yaml.load(rolesYamlContent) as RoleConfig[];

      this.rolesPermissionsMap.clear();  
      for (const yamlRole of yamlRoles) {  
        if (!yamlRole.name || !Array.isArray(yamlRole.permissions)) {  
          this.logger.warn(`Malformed role entry in YAML: ${JSON.stringify(yamlRole)}. Skipping.`);  
          continue;  
        }  
        this.rolesPermissionsMap.set( yamlRole.name, yamlRole.permissions.map(p => ({ ...p, type: p.type || 'allow' })) );  
        this.logger.debug(`Loaded role '${yamlRole.name}' with ${yamlRole.permissions.length} permissions.`);  
      }  
      this.logger.log(`Successfully loaded ${this.rolesPermissionsMap.size} roles from YAML.`);  
    } catch (error) {  
      this.logger.error(`Failed to load roles and permissions from YAML: ${error.message}`, error.stack);  
      throw new InternalServerErrorException('Failed to load RBAC configuration. Check roles.yaml.');  
    }  
  }

  getPermissionsForRole(roleName: string): PermissionRule[] {  
    return this.rolesPermissionsMap.get(roleName) || [];  
  }

  getAllRoleNames(): string[] {  
    return Array.from(this.rolesPermissionsMap.keys());  
  }

  private async checkStaleRolesOnStartup(): Promise<void> {  
    try {  
      const allUsers = await this.userRepository.find({ select: ['id', 'username', 'roles'] });  
      const definedRoles = this.getAllRoleNames();  
      let staleRolesDetected = false;

      for (const user of allUsers) {  
        const invalidRoles = user.roles.filter(roleName => !definedRoles.includes(roleName));  
        if (invalidRoles.length > 0) {  
          this.logger.warn(  
            `User '${user.username}' (ID: ${user.id}) has stale role(s) not defined in roles.yaml: ${invalidRoles.join(', ')}. ` \+  
            `These roles will not grant any permissions. Consider running the 'cleanup-stale-roles' CLI command.`  
          );  
          staleRolesDetected = true;  
          await this.redisClient.del(`rbac:ability:${user.id}`);  
          this.logger.debug(`Invalidated cached AppAbility for user ID: ${user.id} due to stale roles.`);  
        }  
      }  
      if (!staleRolesDetected) { this.logger.log('No stale roles detected for any users on startup.'); }  
    } catch (error) { this.logger.error(`Error during stale role check on startup: ${error.message}`, error.stack); }  
  }  
}
```

## **5\. Security Considerations**

This section highlights crucial security aspects of the RBAC implementation.

### **5.1. Least Privilege Principle & admin Role (manage: all)**

The admin role with action: manage, subject: all in the YAML grants absolute power. While convenient for development and small deployments, it's a significant security consideration.

* **Recommendation for Production:** For a truly robust system, especially in a production environment, consider defining **explicit granular administrative permissions** instead of a single manage: all rule. For example, instead of manage: all, define manage permissions for each critical subject (e.g., manage: UserEntity, manage: FlashcardEntity, manage: RobotRuleEntity, etc.). This forces a more deliberate and auditable granting of broad administrative powers.  
* **"Break Glass" Procedure:** For extreme emergencies (e.g., system compromise, misconfigured RBAC locking out all legitimate admins), a separate "break glass" procedure should be documented. This involves a highly restricted, auditable, and temporary elevation of privileges, typically outside the day-to-day RBAC system (e.g., direct database access, a special CLI command that is heavily logged). This is an operational security measure, not a CASL rule.

### **5.2. Input Validation (Addressed)**

The global ValidationPipe with transform: true, whitelist: true, and forbidNonWhitelisted: true is a strong security measure. It ensures that only properties explicitly defined and decorated in DTOs are accepted in incoming request bodies, preventing mass assignment vulnerabilities and unexpected data. All DTOs must be meticulously defined with appropriate class-validator decorators.

### **5.3. Sensitive Data Handling & Logging**

While @Exclude() and ClassSerializerInterceptor prevent sensitive data (like passwordHash, privateKeyPem) from being returned in API responses, they do not automatically redact sensitive data from *incoming request bodies* or *intermediate data structures* that might be logged internally.

* **Recommendation for Logging Sensitive Data:**  
  * **Explicit Redaction:** Before logging any request body or DTO that might contain sensitive fields (e.g., registerDto, loginDto), explicitly create a sanitized version or redact sensitive properties. For example, when logging registerDto, log registerDto.username and registerDto.email but replace registerDto.password with ***REDACTED***.  
  * **Custom Logging Interceptor/Formatter (Advanced):** For more complex scenarios, consider implementing a custom logging interceptor or a custom Winston formatter that specifically identifies and redacts sensitive fields from log messages based on predefined rules or patterns. This ensures consistent redaction across all logged requests.

### **5.4. Resource-Scoped Permissions (IDOR Prevention)**

The plan implements resource-scoped permissions to prevent Insecure Direct Object References (IDOR).

* **Mechanism:**  
  1. **@Resource() Parameter Decorator:** This new decorator is applied to controller method parameters that represent a resource ID (e.g., @Param('id')). It fetches the *actual entity instance* from the database (e.g., a FlashcardEntity by its ID) and attaches it to the request object (req.resource). It also loads necessary relations (like creator or user) for ownership checks.  
  2. **Enhanced AbilitiesGuard:** This guard runs *after* @Resource(). It retrieves the authenticated user (req.user) and the fetched resource instance (req.resource). It then performs the CASL check: ability.can(action, resourceInstance, conditions). CASL inherently evaluates the conditions (e.g., `{ creator: { id: "{{user.id}}" } }`) against the provided resourceInstance.  
* **Benefit:** This approach centralizes resource-scoped authorization logic within the NestJS pipeline, keeping service methods cleaner and effectively preventing IDOR by ensuring that permissions are checked against the specific resource being accessed and its properties (like ownership).

## **6\. Operational Security & CLI Tooling**

This section outlines critical operational security considerations and how a future CLI tool will support these.

### **6.1. YAML File System Permissions (Critical for Source of Truth)**

* **Requirement:** In a production environment, the config directory (specifically config/roles.yaml) **must be configured with read-only file system permissions for the application process**. This prevents unauthorized modification of RBAC rules by a compromised application instance or malicious actors with limited shell access.  
* **Documentation:** This crucial step will be part of the administration and setup documentation.

### **6.2. Initial Admin User Creation**

For production deployments, the creation of the *first* admin user is a critical security bootstrap that should not rely on standard API registration.

* **CLI Command:** A future CLI tool will include a secure command for creating the initial admin user.  
  * **Example CLI Command:** npx edu-cli create-admin --username `<user>` --password `<pass>` --email `<email>`  
  * **Functionality:** This command would bypass normal registration logic, directly hash the password, create the UserEntity and associated ActorEntity, and assign the ['admin'] role to the user in the database. It should be designed for secure, one-time execution.

### **6.3. CLI Commands for RBAC User Management**

To manage user roles without modifying YAML files via API, the future CLI tool will provide dedicated commands.

* **assign-roles:** Assigns specific roles to a user.  
  * **Example:** npx edu-cli assign-roles `<userId/username>` user moderator  
  * **Action:** Updates the roles JSONB array on the UserEntity in the database. Validates that the assigned roles exist in the loaded roles.yaml.  
* **remove-roles:** Removes specific roles from a user.  
  * **Example:** npx edu-cli remove-roles `<userId/username>` admin  
  * **Action:** Removes the specified role names from the roles JSONB array on the UserEntity.  
* **list-user-roles:** Lists roles assigned to a user.  
  * **Example:** npx edu-cli list-user-roles `<userId/username>`  
* **list-available-roles:** Lists all role names defined in roles.yaml.  
  * **Example:** npx edu-cli list-available-roles

### **6.4. Error Handling & Information Disclosure**

* **Recommendation:** Ensure that detailed error messages (e.g., stack traces, internal system details, specific validation failures) from authorization failures or other security-sensitive operations are **not exposed directly to API consumers** in production. They should be logged internally for debugging but return generic, safe messages externally (e.g., a simple "Forbidden" for 403 errors, or "Bad Request" for 400 errors without listing specific invalid fields). The HttpExceptionFilter should be configured to handle this.

### **6.5. Operational Gaps (Stale Roles Cleanup)**

The user.roles column in the database could contain role names that are no longer defined in roles.yaml (stale roles), if roles are removed from the YAML configuration. While these stale roles won't grant permissions, they represent data inconsistency.

* **Startup Warning:** The PermissionConfigService.onModuleInit will include a check to iterate through all users and log a WARN message if any user has roles not defined in the currently loaded roles.yaml. This alerts administrators to the inconsistency.  
* **CLI Command:** A CLI command will be provided to clean up these stale roles from user entities in the database.  
  * **Example:** npx edu-cli cleanup-stale-roles  
  * **Functionality:** This command would iterate through all users, compare their assigned roles against the currently loaded YAML roles, and remove any roles that are no longer defined. It would log which users had roles cleaned up.

This revised and expanded plan provides a comprehensive and secure approach to implementing RBAC with CASL.js, addressing the concerns raised.