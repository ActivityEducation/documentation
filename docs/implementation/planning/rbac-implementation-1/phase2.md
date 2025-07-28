---
title: Phase 2
sidebar_position: 2
---

# **EducationPub RBAC Implementation: Phase 2 - Core Authentication & Authorization Pipeline**

## **Objective:**

Integrate roles into the authentication flow and set up the core CASL authorization guard.

## **Tasks:**

### **Task 2.1: Update AuthService for Role Assignment**

This task modifies the authentication service to assign roles to new users and manage role assignments for existing users, including invalidating cached abilities.

* **Action:** Modify src/features/auth/auth.service.ts.  
* **Details:**  
  * Inject PermissionConfigService and the RedisClient.  
  * In the register method, assign the default role (UserRole.USER) as a string array directly to newUser.roles. Validate that the assigned role exists in PermissionConfigService.getAllRoleNames().  
  * In the login method, ensure the user.roles (string array) is included in the JWT payload.  
  * Implement an assignRolesToUser(userId: string, roleNames: string[]) method:  
    * Fetch the UserEntity by userId.  
    * Validate that all roleNames exist in PermissionConfigService.getAllRoleNames().  
    * Update the user.roles array in the database.  
    * **Crucially, after assigning roles, invalidate any cached AppAbility for this user in Redis** (e.g., delete the rbac:ability:$&lcub;userId&rcub; key). This ensures the user's permissions are re-evaluated on their next request.  
* **Expected Outcome:** Users are assigned roles, and these roles are included in JWTs and can be updated.

```typescript
// src/features/auth/auth.service.ts  
import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';  
import { JwtService } from '@nestjs/jwt';  
import { InjectRepository } from '@nestjs/typeorm';  
import { Repository } from 'typeorm';  
import { ActorEntity } from 'src/features/activitypub/entities/actor.entity';  
import { LoggerService } => 'src/shared/services/logger.service';  
import { RegisterDto } from './dto/register.dto';  
import { UserEntity } from './entities/user.entity';  
import { LoginDto } from './dto/login.dto';  
import { ActorService } from 'src/features/activitypub/services/actor.service';  
import { UserRole } from './enums/user-role.enum';  
import { PermissionConfigService } from 'src/shared/config/permission-config.service';  
import { Inject } from '@nestjs/common';  
import Redis from 'ioredis';

@Injectable()  
export class AuthService {  
  constructor(  
    @InjectRepository(UserEntity) private usersRepository: Repository<UserEntity>,  
    @InjectRepository(ActorEntity) private actorRepository: Repository<ActorEntity>,  
    private jwtService: JwtService, private logger: LoggerService, private actorService: ActorService,  
    private readonly permissionConfigService: PermissionConfigService,  
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,  
  ) { this.logger.setContext('AuthService'); }

  async register(registerDto: RegisterDto): Promise<UserEntity | null> {  
    this.logger.log(`Received registration request for username: ${registerDto.username}`);  
    const existingUserByUsername = await this.usersRepository.findOne({ where: { username: registerDto.username } });  
    if (existingUserByUsername) {  
      this.logger.warn(`Registration failed: Username '${registerDto.username}' already exists.`);  
      throw new ConflictException('Username already exists');  
    }  
    const existingUserByEmail = await this.usersRepository.findOne({ where: { email: registerDto.email } });  
    if (existingUserByEmail) {  
      this.logger.warn(`Registration failed: Email '${registerDto.email}' already exists.`);  
      throw new ConflictException('Email already exists');  
    }  
    this.logger.log(`Attempting to register new user: ${registerDto.username}`);  
    const newUser = this.usersRepository.create({  
      username: registerDto.username, email: registerDto.email,  
      passwordHash: registerDto.password,  
      roles: [UserRole.USER],  
    });  
    const savedUser = await this.usersRepository.save(newUser);  
    this.logger.info(`User '${savedUser.username}' saved to database.`);  
    try {  
      const actor = await this.actorService.createActorForUser(  
        savedUser.id, savedUser.username, registerDto.name, registerDto.summary,  
      );  
      this.logger.info(`ActivityPub Actor '${actor.activityPubId}' created for user '${savedUser.username}'.`);  
      return savedUser;  
    } catch (error) {  
      this.logger.error(`Failed to create actor for new user: ${error.message}`, error.stack);  
      await this.usersRepository.delete(savedUser.id);  
      throw new InternalServerErrorException('Failed to create user account due to actor creation error.');  
    }  
  }

  async validateUser(username: string, pass: string): Promise<UserEntity | null> {  
    this.logger.debug(`Validating credentials for user: ${username}`);  
    const user = await this.usersRepository.findOne({ where: { username } });  
    if (user && user.passwordHash === pass) { return user; }  
    return null;  
  }

  async login(user: UserEntity) {  
    this.logger.info(`Generating JWT for user: ${user.username}`);  
    const payload = { username: user.username, sub: user.id, roles: user.roles, };  
    return { access_token: this.jwtService.sign(payload), };  
  }

  async assignRolesToUser(userId: string, roleNames: string[]): Promise<UserEntity> {  
    this.logger.log(`Attempting to assign roles '${roleNames.join(', ')}' to user ID: ${userId}`);  
    const user = await this.usersRepository.findOne({ where: { id: userId } });  
    if (!user) { throw new NotFoundException(`User with ID '${userId}' not found.`); }  
    const invalidRoles = roleNames.filter(roleName => !this.permissionConfigService.getAllRoleNames().includes(roleName));  
    if (invalidRoles.length > 0) { throw new BadRequestException(`Invalid role(s) provided: ${invalidRoles.join(', ')}. These roles do not exist in the YAML configuration.`); }  
    user.roles = roleNames;  
    await this.usersRepository.save(user);  
    this.logger.log(`Roles '${roleNames.join(', ')}' assigned to user '${user.username}'.`);  
    await this.redisClient.del(`rbac:ability:${userId}`);  
    this.logger.debug(`Invalidated cached AppAbility for user ID: ${userId}`);  
    return user;  
  }  
}
```

### **Task 2.2: Update JwtStrategy for Role Retrieval**

This task ensures that the JWT strategy correctly retrieves and attaches user roles to the request context.

* **Action:** Modify src/features/auth/strategies/jwt.strategy.ts.  
* **Details:** In the validate method, ensure that when fetching the UserEntity, the actor relation is loaded (relations: ['actor']). The payload.roles (string array) from the JWT will automatically map to user.roles by class-transformer (due to global ValidationPipe and ClassSerializerInterceptor). No explicit database lookup for roles/permissions is needed here, as they are loaded from YAML.  
* **Expected Outcome:** Authenticated UserEntity objects attached to requests will contain their assigned roles.

```typescript
// src/features/auth/strategies/jwt.strategy.ts  
import { Injectable, UnauthorizedException } from '@nestjs/common';  
import { PassportStrategy } from '@nestjs/passport';  
import { Strategy, ExtractJwt } from 'passport-jwt';  
import { ConfigService } from '@nestjs/config';  
import { InjectRepository } from '@nestjs/typeorm';  
import { Repository } from 'typeorm';  
import { UserEntity } from '../entities/user.entity';  
import { ActorEntity } from 'src/features/activitypub/entities/actor.entity';  
import { LoggerService } from 'src/shared/services/logger.service';

@Injectable()  
export class JwtStrategy extends PassportStrategy(Strategy) {  
  constructor(  
    private configService: ConfigService, @InjectRepository(UserEntity) private usersRepository: Repository<UserEntity>,  
    @InjectRepository(ActorEntity) private actorRepository: Repository<ActorEntity>, private logger: LoggerService,  
  ) {  
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: configService.get<string>('JWT_SECRET'), });  
    this.logger.setContext('JwtStrategy');  
  }

  async validate(payload: any) {  
    this.logger.debug(`Attempting to validate JWT payload for user: ${payload.username} (ID: ${payload.sub})`);  
    const user = await this.usersRepository.findOne({ where: { id: payload.sub }, relations: ['actor'], });  
    if (!user) {  
      this.logger.warn(`JWT validation failed: User with ID ${payload.sub} not found.`);  
      throw new UnauthorizedException('Invalid token payload.');  
    }  
    this.logger.info(`JWT validated successfully for user: ${user.username} (ID: ${user.id}). Actor ID: ${user.actor?.activityPubId}. Roles: ${user.roles.join(', ')}`);  
    return user;  
  }  
}
```

### **Task 2.3: Create AbilitiesGuard**

This guard centrally enforces permissions based on the CASL Ability instance.

* **Action:** Create a new guard file.  
* **Details:** Create src/shared/guards/abilities.guard.ts. This injectable class will implement CanActivate. Inject Reflector, AbilityFactory, and LoggerService. Implement canActivate(context: ExecutionContext):  
  * Retrieve requiredAbilities from @CheckAbilities() decorator metadata.  
  * Extract the authenticated UserEntity from request.user. If no user is found, deny access with a ForbiddenException.  
  * Call abilityFactory.createForUser(user) to build the user's AppAbility.  
  * Iterate through requiredAbilities:  
    * For each [action, subject, conditions] tuple:  
      * For resource-scoped permissions (when conditions are present), **explicitly expect** the resource instance to be available on request.resource. This instance should be populated by the @Resource() parameter decorator (see Phase 3, Task 3.1). If request.resource is not present when conditions are specified in @CheckAbilities, it indicates a misconfiguration or a failure in the @Resource() decorator, and the guard should throw a ForbiddenException or InternalServerErrorException to prevent an insecure bypass.  
      * Perform the CASL check using ability.can(action, subjectInstance, conditions).  
  * If all checks pass, return true. Otherwise, throw a ForbiddenException.  
* **Expected Outcome:** Centralized authorization logic based on CASL abilities is enforced.

```typescript
// src/shared/guards/abilities.guard.ts  
import { CanActivate, ExecutionContext, Injectable, ForbiddenException, InternalServerErrorException } from '@nestjs/common';  
import { Reflector } from '@nestjs/core';  
import { AbilityFactory, AppAbility } from '../authorization/ability.factory';  
import { CHECK_ABILITIES_KEY } from '../decorators/check-abilities.decorator';  
import { AbilityTuple } from '@casl/ability';  
import { UserEntity } from 'src/features/auth/entities/user.entity';  
import { LoggerService } from '../services/logger.service';

@Injectable()  
export class AbilitiesGuard implements CanActivate {  
  constructor(  
    private reflector: Reflector, private abilityFactory: AbilityFactory, private readonly logger: LoggerService,  
  ) { this.logger.setContext('AbilitiesGuard'); }

  async canActivate(context: ExecutionContext): Promise<boolean> {  
    const requiredAbilities = this.reflector.get<AbilityTuple[]>(CHECK_ABILITIES_KEY, context.getHandler()) || [];  
    if (requiredAbilities.length === 0) {  
      this.logger.debug('No specific abilities required for this route. Allowing access.');  
      return true;  
    }

    const req = context.switchToHttp().getRequest();  
    const user: UserEntity = req.user;

    if (!user) {  
      this.logger.warn('AbilitiesGuard: No user found on request. Denying access.');  
      throw new ForbiddenException('You must be authenticated to access this resource.');  
    }

    const ability = this.abilityFactory.createForUser(user);  
    this.logger.debug(`AbilitiesGuard: User ${user.username} has abilities: ${JSON.stringify(ability.rules)}`);

    const isAuthorized = await Promise.all(requiredAbilities.map(async (abilityTuple) => {  
      const [action, subjectType, conditions] = abilityTuple;  
      let subjectInstance: any = subjectType; // Default to subject type string

      // If conditions are present, we expect the @Resource decorator to have fetched the instance  
      if (conditions && typeof conditions === 'object') {  
        if (req.resource && req.resource.constructor.name === subjectType) {  
            subjectInstance = req.resource;  
        } else {  
            // This indicates a misconfiguration: conditions are specified, but resource not found/attached.  
            this.logger.error(`AbilitiesGuard: Resource instance for subject type '${subjectType}' not found on request (expected for conditioned check).`);  
            // Deny access to prevent insecure bypass due to misconfiguration  
            throw new InternalServerErrorException(`Authorization configuration error: Resource not found for conditioned check.`);  
        }  
      }  
      const checkResult = ability.can(action, subjectInstance, conditions as any);  
      this.logger.debug(`Checking ability: can('${action}', '${subjectType}', ${JSON.stringify(conditions)}) for user ${user.username}. Result: ${checkResult}`);  
      return checkResult;  
    }));

    const allAuthorized = isAuthorized.every(result => result === true);  
    if (!allAuthorized) {  
      this.logger.warn(`AbilitiesGuard: User ${user.username} lacks required abilities. Denying access.`);  
      throw new ForbiddenException('You do not have sufficient permissions to perform this action.');  
    }  
    return true;  
  }  
}
```

* **Task 2.4: Create @CheckAbilities() Decorator**  
  This decorator provides a declarative way to specify required permissions on controller methods.  
  * **Action:** Create a new decorator file.  
  * **Details:** Create src/shared/decorators/check-abilities.decorator.ts. This decorator will use SetMetadata to store an array of AbilityTuples, defining required permissions for routes.  
  * **Expected Outcome:** Declarative way to specify required permissions on controller methods.

```typescript
// src/shared/decorators/check-abilities.decorator.ts  
import { SetMetadata } from '@nestjs/common';  
import { AbilityTuple } from '@casl/ability';

export const CHECK_ABILITIES_KEY = 'check_abilities';

/**  
 * Custom decorator to define required CASL abilities for a route handler.  
 * Usage: @CheckAbilities(['read', 'User'], ['manage', 'all'])  
 * @param abilities A list of AbilityTuple arrays, where each tuple defines an action and subject.  
 */  
export const CheckAbilities = (...abilities: AbilityTuple[]) =>  
  SetMetadata(CHECK_ABILITIES_KEY, abilities);

* **Task 2.5: Update AuthModule for AbilitiesGuard**  
  This task integrates the AbilitiesGuard into the authentication module, making it available for use throughout the application.  
  * **Action:** Modify src/features/auth/auth.module.ts.  
  * **Details:** Add AbilitiesGuard to the providers array.  
  * **Expected Outcome:** AbilitiesGuard is available for use throughout the application.

// src/features/auth/auth.module.ts  
import { Module, forwardRef } from '@nestjs/common';  
import { TypeOrmModule } from '@nestjs/typeorm';  
import { AbilityFactory } from 'src/shared/authorization/ability.factory';  
import { PermissionConfigService } from 'src/shared/config/permission-config.service';  
import { UserEntity } from './entities/user.entity';  
import { ActorEntity } from '../activitypub/entities/actor.entity';  
import { AuthService } from './auth.service';  
import { JwtStrategy } from './strategies/jwt.strategy';  
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';  
import { AuthController } from './auth.controller';  
import { PassportModule } from '@nestjs/passport';  
import { JwtModule } from '@nestjs/jwt';  
import { ConfigModule, ConfigService } from '@nestjs/config';  
import { CommonModule } from 'src/shared/common.module';  
import { CoreModule } from 'src/core/core.module';  
import { ModerationModule } from '../moderation/moderation.module';  
import { ActivityPubModule } from '../activitypub/activitypub.module';  
import { AbilitiesGuard } from 'src/shared/guards/abilities.guard'; // Import AbilitiesGuard

@Module({  
  imports: [  
    TypeOrmModule.forFeature([UserEntity, ActorEntity]),  
    PassportModule,  
    JwtModule.registerAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (configService: ConfigService) => ({ secret: configService.get<string>('JWT_SECRET'), signOptions: { expiresIn: '60m' } }), }),  
    ConfigModule, CommonModule, forwardRef(() => CoreModule), forwardRef(() => ModerationModule), forwardRef(() => ActivityPubModule),  
  ],  
  providers: [AuthService, JwtStrategy, JwtAuthGuard, AbilityFactory, PermissionConfigService, AbilitiesGuard], // Add AbilitiesGuard to providers  
  controllers: [AuthController],  
  exports: [AuthService, JwtAuthGuard, JwtModule, AbilityFactory, PermissionConfigService, AbilitiesGuard], // Export AbilitiesGuard if needed by other modules  
})  
export class AuthModule {}
```

### **Phase 3: Resource-Scoped Authorization & Controller Integration**

**Objective:** Implement the @Resource() decorator for IDOR prevention and apply RBAC to relevant controllers.

* **Task 3.1: Create @Resource() Parameter Decorator**  
  This decorator fetches a resource entity by ID and attaches it to the request for subsequent authorization checks.  
  * **Action:** Create a new decorator file.  
  * **Details:** Create src/shared/decorators/resource.decorator.ts. This parameter decorator Resource(entityClass: any, idPath: string = 'params.id') will:  
    * Extract the resource ID from the request using the specified idPath (e.g., 'params.id', 'query.resourceId', 'body.nested.id'). It should be flexible enough to handle various ID locations using a utility like object-property-accessor.ts. For composite keys, the decorator might need to accept an array of idPaths or a custom resolver function.  
    * Dynamically retrieve the TypeORM Repository for the provided entityClass from the NestJS application context.  
    * Fetch the entity instance by its ID, including necessary relations (e.g., creator, user) that are required for CASL conditions evaluation. Document that complex resource-scoped conditions requiring specific relations might necessitate custom relations arguments in @Resource() or a more advanced query strategy within the decorator.  
    * Attach the fetched entity to request.resource.  
    * Throw NotFoundException if the resource is not found (HTTP 404), or BadRequestException if the ID is missing (HTTP 400). It should also catch and re-throw InternalServerErrorException for other retrieval failures.  
  * **Expected Outcome:** Automated fetching of resource instances for authorization checks, preventing IDOR.

```typescript
// src/shared/decorators/resource.decorator.ts  
import { createParamDecorator, ExecutionContext, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';  
import { getRepositoryToken } from '@nestjs/typeorm';  
import { Repository } from 'typeorm';  
import { Request } from 'express';  
import { LoggerService } from '../services/logger.service';  
import { getNestedProperty } from '../utils/object-property-accessor'; // Import the utility

/**  
 * Custom parameter decorator to fetch a resource entity by ID from the database.  
 * The fetched entity is then attached to `req.resource` for use by `AbilitiesGuard`  
 * for resource-scoped permission checks.  
 *  
 * Usage:  
 * @Put(':id')  
 * @UseGuards(JwtAuthGuard, AbilitiesGuard)  
 * @CheckAbilities({ action: 'update', subject: FlashcardEntity.name, conditions: { creator: { id: '{{user.id}}' } } })  
 * async updateFlashcard(  
 * @Param('id') id: string,  
 * @Resource(FlashcardEntity, 'params.id') flashcard: FlashcardEntity, // Fetches Flashcard by ID from param 'id'  
 * @Body() updateDto: UpdateFlashcardDto  
 * ) { ... }  
 *  
 * @param entityClass The TypeORM entity class (e.g., FlashcardEntity) to fetch.  
 * @param idPath A string path to the resource ID within the request (e.g., 'params.id', 'query.resourceId', 'body.id'). Defaults to 'params.id'.  
 */  
export const Resource = (entityClass: any, idPath: string = 'params.id') =>  
  createParamDecorator(async (data: unknown, ctx: ExecutionContext) => {  
    const request = ctx.switchToHttp().getRequest<Request>();  
    const logger = request.app.get(LoggerService);  
    logger.setContext('ResourceDecorator');

    // Extract resourceId using the provided path  
    const resourceId = getNestedProperty(request, idPath);

    if (!resourceId) {  
      logger.error(`ResourceDecorator: Missing ID at path '${idPath}' for resource type ${entityClass.name}.`);  
      throw new BadRequestException(`Resource ID at path '${idPath}' is required.`);  
    }

    try {  
      const repository: Repository\<any\> = request.app.get(getRepositoryToken(entityClass));  
      const resource = await repository.findOne({  
        where: { id: resourceId },  
        relations: ['creator', 'user'], // Common relations for ownership checks  
      });

      if (!resource) {  
        logger.warn(`ResourceDecorator: Resource of type '${entityClass.name}' with ID '${resourceId}' not found.`);  
        throw new NotFoundException(`${entityClass.name} with ID '${resourceId}' not found.`);  
      }

      (request as any).resource = resource;  
      logger.debug(`ResourceDecorator: Fetched and attached resource of type '${entityClass.name}' with ID '${resourceId}'.`);  
      return resource;  
    } catch (error) {  
      logger.error(`ResourceDecorator: Failed to fetch resource of type '${entityClass.name}' with ID '${resourceId}': ${error.message}`, error.stack);  
      if (error instanceof NotFoundException || error instanceof BadRequestException) {  
        throw error;  
      }  
      throw new InternalServerErrorException(`Failed to retrieve resource for authorization.`);  
    }  
  })(); // Self-invoking decorator
```

* **Task 3.2: Apply RBAC to RobotsController**  
  This task applies the newly created RBAC guards and decorators to the RobotsController endpoints.  
  * **Action:** Modify src/features/robots/controllers/robots.controller.ts.  
  * **Details:** Apply @UseGuards(JwtAuthGuard, AbilitiesGuard) to protected endpoints. Add @CheckAbilities decorators with appropriate actions and subjects (e.g., RobotRuleEntity.name, SitemapEntity.name). For update and delete operations, use @Resource(RobotRuleEntity, 'params.id') or @Resource(SitemapEntity, 'params.id') in the method signature to fetch the specific instance for CASL evaluation.  
  * **Expected Outcome:** Robot management endpoints are protected by RBAC.

```typescript
// src/features/robots/controllers/robots.controller.ts  
import { Controller, Get, Header, Res, Post, Body, Param, Put, Delete, HttpCode, HttpStatus, NotFoundException, UseGuards } from '@nestjs/common';  
import { Response } from 'express';  
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';  
import { LoggerService } from 'src/shared/services/logger.service';  
import { RobotsService } from '../services/robots.service';  
import { CreateRobotRuleDto } from '../dto/create-robot-rule.dto';  
import { UpdateRobotRuleDto } from '../dto/update-robot-rule.dto';  
import { CreateSitemapDto } from '../dto/create-sitemap.dto';  
import { UpdateSitemapDto } from '../dto/update-sitemap.dto';  
import { RobotRuleEntity } from '../entities/robot-rule.entity';  
import { SitemapEntity } from '../entities/sitemap.entity';  
import { JwtAuthGuard } from 'src/features/auth/guards/jwt-auth.guard';  
import { AbilitiesGuard } from 'src/shared/guards/abilities.guard';  
import { CheckAbilities } from 'src/shared/decorators/check-abilities.decorator';  
import { Resource } from 'src/shared/decorators/resource.decorator';

@ApiTags('Robots Management')  
@Controller()  
export class RobotsController {  
  constructor(private readonly logger: LoggerService, private readonly robotsService: RobotsService,) { this.logger.setContext('RobotsController'); }

  @Get('robots.txt')  
  @Header('Content-Type', 'text/plain')  
  @ApiOperation({ summary: 'Retrieve the dynamically generated robots.txt file' })  
  @ApiResponse({ status: 200, description: 'Successfully retrieved robots.txt content.' })  
  handleRobotsTxt(@Res() res: Response) {  
    this.logger.log('Serving robots.txt request.');  
    this.robotsService.generateRobotsTxtContent().then(content => { res.send(content); }).catch(error => {  
      this.logger.error('Failed to generate robots.txt content:', error.stack);  
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error generating robots.txt');  
    });  
  }

  // --- Robot Rules Management Endpoints ---  
  @Post('api/robots/rules')  
  @HttpCode(HttpStatus.CREATED)  
  @UseGuards(JwtAuthGuard, AbilitiesGuard)  
  @CheckAbilities({ action: 'create', subject: RobotRuleEntity.name })  
  @ApiBearerAuth('JWT-auth')  
  @ApiOperation({ summary: 'Create a new robots.txt rule' })  
  @ApiBody({ type: CreateRobotRuleDto })  
  @ApiResponse({ status: 201, description: 'Robot rule created successfully.', type: RobotRuleEntity })  
  @ApiResponse({ status: 400, description: 'Bad Request (validation errors).' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  async createRule(@Body() createRobotRuleDto: CreateRobotRuleDto): Promise<RobotRuleEntity> {  
    this.logger.log(`Creating robot rule for User-agent: ${createRobotRuleDto.userAgent}`);  
    return this.robotsService.createRule(createRobotRuleDto.userAgent, createRobotRuleDto.type, createRobotRuleDto.value, createRobotRuleDto.order);  
  }

  @Get('api/robots/rules')  
  @UseGuards(JwtAuthGuard, AbilitiesGuard)  
  @CheckAbilities({ action: 'read', subject: RobotRuleEntity.name })  
  @ApiBearerAuth('JWT-auth')  
  @ApiOperation({ summary: 'Retrieve all robots.txt rules' })  
  @ApiResponse({ status: 200, description: 'Successfully retrieved all robot rules.', type: [RobotRuleEntity] })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  async findAllRules(): Promise<RobotRuleEntity[]> {  
    this.logger.log('Retrieving all robot rules.');  
    return this.robotsService.findAllRules();  
  }

  @Get('api/robots/rules/:id')  
  @UseGuards(JwtAuthGuard, AbilitiesGuard)  
  @CheckAbilities({ action: 'read', subject: RobotRuleEntity.name })  
  @ApiBearerAuth('JWT-auth')  
  @ApiOperation({ summary: 'Retrieve a robots.txt rule by ID' })  
  @ApiParam({ name: 'id', description: 'The UUID of the robot rule.' })  
  @ApiResponse({ status: 200, description: 'Successfully retrieved the robot rule.', type: RobotRuleEntity })  
  @ApiResponse({ status: 404, description: 'Rule not found.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  async findOneRule(@Param('id') id: string): Promise<RobotRuleEntity> {  
    this.logger.log(`Retrieving robot rule with ID: ${id}`);  
    const rule = await this.robotsService.findRuleById(id);  
    if (!rule) { throw new NotFoundException(`Robot rule with ID '${id}' not found.`); }  
    return rule;  
  }

  @Put('api/robots/rules/:id')  
  @HttpCode(HttpStatus.OK)  
  @UseGuards(JwtAuthGuard, AbilitiesGuard)  
  @CheckAbilities({ action: 'update', subject: RobotRuleEntity.name })  
  @ApiBearerAuth('JWT-auth')  
  @ApiOperation({ summary: 'Update an existing robots.txt rule by ID' })  
  @ApiParam({ name: 'id', description: 'The UUID of the robot rule to update.' })  
  @ApiBody({ type: UpdateRobotRuleDto })  
  @ApiResponse({ status: 200, description: 'Robot rule updated successfully.', type: RobotRuleEntity })  
  @ApiResponse({ status: 404, description: 'Rule not found.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  async updateRule(@Param('id') id: string, @Body() updateRobotRuleDto: UpdateRobotRuleDto): Promise<RobotRuleEntity> {  
    this.logger.log(`Updating robot rule with ID: ${id}`);  
    const updatedRule = await this.robotsService.updateRule(id, updateRobotRuleDto);  
    if (!updatedRule) { throw new NotFoundException(`Robot rule with ID '${id}' not found.`); }  
    return updatedRule;  
  }

  @Delete('api/robots/rules/:id')  
  @HttpCode(HttpStatus.NO_CONTENT)  
  @UseGuards(JwtAuthGuard, AbilitiesGuard)  
  @CheckAbilities({ action: 'delete', subject: RobotRuleEntity.name })  
  @ApiBearerAuth('JWT-auth')  
  @ApiOperation({ summary: 'Delete a robots.txt rule by ID' })  
  @ApiParam({ name: 'id', description: 'The UUID of the robot rule to delete.' })  
  @ApiResponse({ status: 204, description: 'Robot rule deleted successfully.' })  
  @ApiResponse({ status: 404, description: 'Rule not found.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  async deleteRule(@Param('id') id: string): Promise<void> {  
    this.logger.log(`Deleting robot rule with ID: ${id}`);  
    await this.robotsService.deleteRule(id);  
  }

  // --- Sitemap Management Endpoints (similar changes) ---  
  @Post('api/robots/sitemaps')  
  @HttpCode(HttpStatus.CREATED)  
  @UseGuards(JwtAuthGuard, AbilitiesGuard)  
  @CheckAbilities({ action: 'create', subject: SitemapEntity.name })  
  @ApiBearerAuth('JWT-auth')  
  @ApiOperation({ summary: 'Create a new sitemap entry for robots.txt' })  
  @ApiBody({ type: CreateSitemapDto })  
  @ApiResponse({ status: 201, description: 'Sitemap entry created successfully.', type: SitemapEntity })  
  @ApiResponse({ status: 400, description: 'Bad Request (validation errors).' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  async createSitemap(@Body() createSitemapDto: CreateSitemapDto): Promise<SitemapEntity> {  
    this.logger.log(`Creating sitemap entry for URL: ${createSitemapDto.url}`);  
    return this.robotsService.createSitemap(createSitemapDto.url, createSitemapDto.isEnabled);  
  }

  @Get('api/robots/sitemaps')  
  @UseGuards(JwtAuthGuard, AbilitiesGuard)  
  @CheckAbilities({ action: 'read', subject: SitemapEntity.name })  
  @ApiBearerAuth('JWT-auth')  
  @ApiOperation({ summary: 'Retrieve all sitemap entries for robots.txt' })  
  @ApiResponse({ status: 200, description: 'Successfully retrieved all sitemap entries.', type: [SitemapEntity] })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  async findAllSitemaps(): Promise<SitemapEntity[]> {  
    this.logger.log('Retrieving all sitemap entries.');  
    return this.robotsService.findAllSitemaps();  
  }

  @Get('api/robots/sitemaps/:id')  
  @UseGuards(JwtAuthGuard, AbilitiesGuard)  
  @CheckAbilities({ action: 'read', subject: SitemapEntity.name })  
  @ApiBearerAuth('JWT-auth')  
  @ApiOperation({ summary: 'Retrieve a sitemap entry by ID' })  
  @ApiParam({ name: 'id', description: 'The UUID of the sitemap entry.' })  
  @ApiResponse({ status: 200, description: 'Successfully retrieved the sitemap entry.', type: SitemapEntity })  
  @ApiResponse({ status: 404, description: 'Sitemap not found.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  async findOneSitemap(@Param('id') id: string): Promise<SitemapEntity> {  
    this.logger.log(`Retrieving sitemap entry with ID: ${id}`);  
    const sitemap = await this.robotsService.findSitemapById(id);  
    if (!sitemap) { throw new NotFoundException(`Sitemap with ID '${id}' not found.`); }  
    return sitemap;  
  }

  @Put('api/robots/sitemaps/:id')  
  @HttpCode(HttpStatus.OK)  
  @UseGuards(JwtAuthGuard, AbilitiesGuard)  
  @CheckAbilities({ action: 'update', subject: SitemapEntity.name })  
  @ApiBearerAuth('JWT-auth')  
  @ApiOperation({ summary: 'Update an existing sitemap entry by ID' })  
  @ApiParam({ name: 'id', description: 'The UUID of the sitemap entry to update.' })  
  @ApiBody({ type: UpdateSitemapDto })  
  @ApiResponse({ status: 200, description: 'Sitemap entry updated successfully.', type: SitemapEntity })  
  @ApiResponse({ status: 404, description: 'Sitemap not found.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  async updateSitemap(@Param('id') id: string, @Body() updateSitemapDto: UpdateSitemapDto): Promise<SitemapEntity> {  
    this.logger.log(`Updating sitemap entry with ID: ${id}`);  
    const updatedSitemap = await this.robotsService.updateSitemap(id, updateSitemapDto);  
    if (!updatedSitemap) { throw new NotFoundException(`Sitemap with ID '${id}' not found.`); }  
    return updatedSitemap;  
  }

  @Delete('api/robots/sitemaps/:id')  
  @HttpCode(HttpStatus.NO_CONTENT)  
  @UseGuards(JwtAuthGuard, AbilitiesGuard)  
  @CheckAbilities({ action: 'delete', subject: SitemapEntity.name })  
  @ApiBearerAuth('JWT-auth')  
  @ApiOperation({ summary: 'Delete a sitemap entry by ID' })  
  @ApiParam({ name: 'id', description: 'The UUID of the sitemap entry to delete.' })  
  @ApiResponse({ status: 204, description: 'Sitemap entry deleted successfully.' })  
  @ApiResponse({ status: 404, description: 'Sitemap not found.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  async deleteSitemap(@Param('id') id: string): Promise<void> {  
    this.logger.log(`Deleting sitemap entry with ID: ${id}`);  
    await this.robotsService.deleteSitemap(id);  
  }  
}
```

* **Task 3.3: Apply RBAC to FlashcardController (with Resource Scoping)**  
  This task applies the newly created RBAC guards and decorators to the FlashcardController endpoints, including resource-scoped checks for ownership.  
  * **Action:** Modify src/features/educationpub/controllers/flashcard.controller.ts.  
  * **Details:** Apply @UseGuards(JwtAuthGuard, AbilitiesGuard) and @CheckAbilities for create, read, update, delete, like, boost operations on FlashcardEntity. For update and delete on Flashcards, use @Resource(FlashcardEntity, 'params.id') to fetch the instance. The conditions: `{ creator: { id: '{{user.id}}' } }` in the YAML will now be evaluated against this fetched flashcard instance by CASL.  
  * **Expected Outcome:** Flashcard operations are protected by RBAC, including ownership checks.

```typescript
// src/features/educationpub/controllers/flashcard.controller.ts  
import { Controller, Post, Get, Param, Body, Put, Delete, HttpCode, HttpStatus, UseGuards, UseInterceptors, ClassSerializerInterceptor, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';  
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';  
import { ActorEntity } from 'src/features/activitypub/entities/actor.entity';  
import { LoggerService } from 'src/shared/services/logger.service';  
import { CreateFlashcardPayload } from '../dto/create-fashcard.dto';  
import { FlashcardEntity } from '../entities/flashcard.entity';  
import { FlashcardService } from '../services/flashcard.service';  
import { User } from 'src/shared/decorators/user.decorator';  
import { JwtAuthGuard } from 'src/features/auth/guards/jwt-auth.guard';  
import { UpdateFlashcardDto } from '../dto/update-flashcard.dto';  
import { Flashcard as FlashcardView } from '../views/flashcard.view';  
import { Repository } from 'typeorm';  
import { InjectRepository } from '@nestjs/typeorm';  
import { AbilitiesGuard } from 'src/shared/guards/abilities.guard';  
import { CheckAbilities } from 'src/shared/decorators/check-abilities.decorator';  
import { Resource } from 'src/shared/decorators/resource.decorator';

@ApiTags('EducationPub - Flashcards')  
@Controller('edu/flashcards')  
@ApiBearerAuth('JWT-auth')  
@UseInterceptors(ClassSerializerInterceptor)  
export class EducationPubController {  
  constructor(  
    private readonly flashcardService: FlashcardService, private readonly logger: LoggerService,  
    @InjectRepository(ActorEntity) private readonly actorRepository: Repository<ActorEntity>,  
  ) { this.logger.setContext('EducationPubController'); }

  @Get()  
  @UseGuards(JwtAuthGuard)  
  @ApiOperation({ summary: 'Retrieve all flashcards (paginated)' })  
  @ApiOkResponse({ type: [FlashcardView], description: 'Successfully retrieved a paginated list of flashcards.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  async getFlashcards(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number): Promise<{ data: FlashcardEntity[]; total: number; page: number; limit: number }> {  
    this.logger.log(`Fetching all flashcards, page: ${page}, limit: ${limit}`);  
    const [flashcards, total] = await this.flashcardService.findAllFlashcardsPaginated(page, limit);  
    return { data: flashcards, total, page, limit, };  
  }

  @Get(':id')  
  @UseGuards(JwtAuthGuard)  
  @ApiOperation({ summary: 'Retrieve a flashcard by ID' })  
  @ApiParam({ name: 'id', description: 'The UUID of the flashcard.' })  
  @ApiResponse({ status: 200, description: 'Successfully retrieved the flashcard.', type: FlashcardView })  
  @ApiResponse({ status: 404, description: 'Flashcard not found.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  async getFlashcardById(@Param('id') id: string): Promise<FlashcardEntity> {  
    this.logger.log(`Fetching flashcard with ID: ${id}`);  
    return this.flashcardService.findFlashcardById(id);  
  }

  @Post(':username')  
  @HttpCode(HttpStatus.CREATED)  
  @UseGuards(JwtAuthGuard, AbilitiesGuard)  
  @CheckAbilities({ action: 'create', subject: FlashcardEntity.name })  
  @ApiOperation({ summary: 'Create a new EducationPub Flashcard for a user' })  
  @ApiParam({ name: 'username', description: 'The preferred username of the actor creating the flashcard. Must match authenticated user.', })  
  @ApiBody({ type: CreateFlashcardPayload, description: 'The payload for the new flashcard.', })  
  @ApiResponse({ status: 201, description: 'Flashcard created and enqueued for Fediverse delivery if public.', type: FlashcardView, })  
  @ApiResponse({ status: 400, description: 'Bad Request (validation errors).' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  @ApiResponse({ status: 403, description: 'Forbidden (username mismatch).' })  
  @ApiResponse({ status: 404, description: 'Actor or Flashcard Model not found.' })  
  @ApiResponse({ status: 500, description: 'Internal server error.' })  
  async createFlashcard(@Param('username') username: string, @User('actor.id') localActorInternalId: string, @Body() createFlashcardPayload: CreateFlashcardPayload, @Query('isPublic', new DefaultValuePipe(false)) isPublicQuery: boolean,): Promise<FlashcardEntity> {  
    this.logger.log(`Received request to create flashcard for user: ${username}, authenticated as actor internal ID: ${localActorInternalId}`);  
    const actor = await this.actorRepository.findOne({ where: { id: localActorInternalId } });  
    if (!actor || actor.preferredUsername !== username) { throw new NotFoundException(`Actor '${username}' not found or you are not authorized to create content for this user.`); }  
    return this.flashcardService.createFlashcard(localActorInternalId, createFlashcardPayload, isPublicQuery);  
  }

  @Put(':id')  
  @HttpCode(HttpStatus.OK)  
  @UseGuards(JwtAuthGuard, AbilitiesGuard)  
  @CheckAbilities({ action: 'update', subject: FlashcardEntity.name, conditions: { creator: { id: '{{user.id}}' } } })  
  @ApiBearerAuth('JWT-auth')  
  @ApiOperation({ summary: 'Update an existing flashcard by ID' })  
  @ApiParam({ name: 'id', description: 'The UUID of the flashcard to update.' })  
  @ApiBody({ type: UpdateFlashcardDto })  
  @ApiResponse({ status: 200, description: 'Flashcard updated successfully.', type: FlashcardView })  
  @ApiResponse({ status: 404, description: 'Flashcard not found or unauthorized.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  @ApiResponse({ status: 403, description: 'Forbidden.' })  
  async updateFlashcard(@Param('id') id: string, @User('id') userId: string, @Resource(FlashcardEntity, 'params.id') flashcard: FlashcardEntity, @Body() updateFlashcardDto: UpdateFlashcardDto,): Promise<FlashcardEntity> {  
    this.logger.log(`Received request to update flashcard ID: ${id} by user ID: ${userId}`);  
    return this.flashcardService.updateFlashcard(flashcard.id, userId, updateFlashcardDto);  
  }

  @Delete(':id')  
  @HttpCode(HttpStatus.NO_CONTENT)  
  @UseGuards(JwtAuthGuard, AbilitiesGuard)  
  @CheckAbilities({ action: 'delete', subject: FlashcardEntity.name, conditions: { creator: { id: '{{user.id}}' } } })  
  @ApiBearerAuth('JWT-auth')  
  @ApiOperation({ summary: 'Delete a flashcard by ID' })  
  @ApiParam({ name: 'id', description: 'The UUID of the flashcard to delete.' })  
  @ApiResponse({ status: 204, description: 'Flashcard deleted successfully.' })  
  @ApiResponse({ status: 404, description: 'Flashcard not found or unauthorized.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  @ApiResponse({ status: 403, description: 'Forbidden.' })  
  async deleteFlashcard(@Param('id') id: string, @User('id') userId: string, @Resource(FlashcardEntity, 'params.id') flashcard: FlashcardEntity,): Promise<void> {  
    this.logger.log(`Received request to delete flashcard ID: ${id} by user ID: ${userId}`);  
    await this.flashcardService.deleteFlashcard(flashcard.id, userId);  
  }

  @Post(':id/like')  
  @HttpCode(HttpStatus.ACCEPTED)  
  @UseGuards(JwtAuthGuard, AbilitiesGuard)  
  @CheckAbilities({ action: 'like', subject: FlashcardEntity.name })  
  @ApiOperation({ summary: 'Like a flashcard and enqueue Like activity' })  
  @ApiParam({ name: 'id', description: 'The ID of the flashcard to like.' })  
  @ApiResponse({ status: 202, description: 'Like activity enqueued for dispatch.' })  
  @ApiResponse({ status: 404, description: 'Flashcard or Actor not found.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  @ApiResponse({ status: 403, description: 'Forbidden.' })  
  @ApiResponse({ status: 409, description: 'Conflict (already liked).' })  
  async likeFlashcard(@Param('id') id: string, @User('actor.activityPubId') localActorId: string,): Promise<{ message: string; liked: boolean }> {  
    this.logger.log(`Actor ID '${localActorId}' attempting to like flashcard ID: ${id}`);  
    return this.flashcardService.handleFlashcardLike(id, localActorId);  
  }

  @Post(':id/boost')  
  @HttpCode(HttpStatus.ACCEPTED)  
  @UseGuards(JwtAuthGuard, AbilitiesGuard)  
  @CheckAbilities({ action: 'boost', subject: FlashcardEntity.name })  
  @ApiOperation({ summary: 'Boost (Announce) a flashcard and enqueue Announce activity' })  
  @ApiParam({ name: 'id', description: 'The ID of the flashcard to boost.' })  
  @ApiResponse({ status: 202, description: 'Announce activity enqueued for dispatch.' })  
  @ApiResponse({ status: 404, description: 'Flashcard or Actor not found.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  @ApiResponse({ status: 403, description: 'Forbidden.' })  
  @ApiResponse({ status: 409, description: 'Conflict (already boosted).' })  
  async boostFlashcard(@Param('id') id: string, @User('actor.activityPubId') localActorId: string,): Promise<{ message: string; boosted: boolean }> {  
    this.logger.log(`Actor ID '${localActorId}' attempting to boost flashcard ID: ${id}`);  
    return this.flashcardService.handleFlashcardBoost(id, localActorId);  
  }  
}
```

* **Task 3.4: Apply RBAC to FlashcardModelController (with Resource Scoping)**  
  This task applies the newly created RBAC guards and decorators to the FlashcardModelController endpoints, including resource-scoped checks for ownership.  
  * **Action:** Modify src/features/educationpub/controllers/flashcard-model.controller.ts.  
  * **Details:** Apply @UseGuards(JwtAuthGuard, AbilitiesGuard) and @CheckAbilities for create, read, update, delete operations on FlashcardModelEntity. Use @Resource(FlashcardModelEntity, 'params.id') for update and delete if ownership or specific conditions apply to models.  
  * **Expected Outcome:** Flashcard Model operations are protected by RBAC.

```typescript
// src/features/educationpub/controllers/flashcard-model.controller.ts  
import { Controller, Post, Get, Param, Body, Put, Delete, HttpCode, HttpStatus, UseGuards, UseInterceptors, ClassSerializerInterceptor, NotFoundException } from '@nestjs/common';  
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';  
import { FlashcardModelService } from '../services/flashcard-model.service';  
import { FlashcardModelEntity } from '../entities/flashcard-model.entity';  
import { JwtAuthGuard } from 'src/features/auth/guards/jwt-auth.guard';  
import { LoggerService } from 'src/shared/services/logger.service';  
import { CreateFlashcardModelDto } from '../dto/create-flashcard-model.dto';  
import { UpdateFlashcardModelDto } from '../dto/update-flashcard-model.dto';  
import { AbilitiesGuard } from 'src/shared/guards/abilities.guard';  
import { CheckAbilities } from 'src/shared/decorators/check-abilities.decorator';  
import { Resource } from 'src/shared/decorators/resource.decorator';

@ApiTags('EducationPub - Flashcard Models')  
@Controller('edu/flashcard-models')  
@ApiBearerAuth('JWT-auth')  
@UseGuards(JwtAuthGuard, AbilitiesGuard)  
@UseInterceptors(ClassSerializerInterceptor)  
export class FlashcardModelController {  
  constructor(private readonly flashcardModelService: FlashcardModelService, private readonly logger: LoggerService,) { this.logger.setContext('FlashcardModelController'); }

  @Post()  
  @HttpCode(HttpStatus.CREATED)  
  @CheckAbilities({ action: 'create', subject: FlashcardModelEntity.name })  
  @ApiOperation({ summary: 'Create a new flashcard model' })  
  @ApiBody({ type: CreateFlashcardModelDto })  
  @ApiResponse({ status: 201, description: 'Flashcard model created successfully.', type: FlashcardModelEntity })  
  @ApiResponse({ status: 409, description: 'Conflict, a model with this name already exists.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  @ApiResponse({ status: 403, description: 'Forbidden.' })  
  async create(@Body() createFlashcardModelDto: CreateFlashcardModelDto): Promise<FlashcardModelEntity> {  
    this.logger.log(`Received request to create flashcard model: ${createFlashcardModelDto.name}`);  
    return this.flashcardModelService.createFlashcardModel(createFlashcardModelDto);  
  }

  @Get()  
  @HttpCode(HttpStatus.OK)  
  @CheckAbilities({ action: 'read', subject: FlashcardModelEntity.name })  
  @ApiOperation({ summary: 'Retrieve all flashcard models' })  
  @ApiResponse({ status: 200, description: 'Successfully retrieved all flashcard models.', type: [FlashcardModelEntity] })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  @ApiResponse({ status: 403, description: 'Forbidden.' })  
  async findAll(): Promise<FlashcardModelEntity[]> {  
    this.logger.log('Received request to retrieve all flashcard models.');  
    return this.flashcardModelService.findAllModels();  
  }

  @Get(':id')  
  @HttpCode(HttpStatus.OK)  
  @CheckAbilities({ action: 'read', subject: FlashcardModelEntity.name })  
  @ApiOperation({ summary: 'Retrieve a flashcard model by ID' })  
  @ApiParam({ name: 'id', description: 'The UUID of the flashcard model.' })  
  @ApiResponse({ status: 200, description: 'Successfully retrieved the flashcard model.', type: FlashcardModelEntity })  
  @ApiResponse({ status: 404, description: 'Flashcard model not found.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  @ApiResponse({ status: 403, description: 'Forbidden.' })  
  async findOne(@Param('id') id: string): Promise<FlashcardModelEntity> {  
    this.logger.log(`Received request to retrieve flashcard model with ID: ${id}`);  
    return this.flashcardModelService.findModelById(id);  
  }

  @Put(':id')  
  @HttpCode(HttpStatus.OK)  
  @CheckAbilities({ action: 'update', subject: FlashcardModelEntity.name })  
  @ApiOperation({ summary: 'Update an existing flashcard model by ID' })  
  @ApiParam({ name: 'id', description: 'The UUID of the flashcard model to update.' })  
  @ApiBody({ type: UpdateFlashcardModelDto })  
  @ApiResponse({ status: 200, description: 'Flashcard model updated successfully.', type: FlashcardModelEntity })  
  @ApiResponse({ status: 404, description: 'Flashcard model not found.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  @ApiResponse({ status: 403, description: 'Forbidden.' })  
  async update(@Param('id') id: string, @Resource(FlashcardModelEntity, 'params.id') flashcardModel: FlashcardModelEntity, @Body() updateFlashcardModelDto: UpdateFlashcardModelDto): Promise<FlashcardModelEntity> {  
    this.logger.log(`Received request to update flashcard model with ID: ${id}`);  
    return this.flashcardModelService.updateFlashcardModel(flashcardModel.id, updateFlashcardModelDto);  
  }

  @Delete(':id')  
  @HttpCode(HttpStatus.NO_CONTENT)  
  @CheckAbilities({ action: 'delete', subject: FlashcardModelEntity.name })  
  @ApiOperation({ summary: 'Delete a flashcard model by ID' })  
  @ApiParam({ name: 'id', description: 'The UUID of the flashcard model to delete.' })  
  @ApiResponse({ status: 204, description: 'Flashcard model deleted successfully.' })  
  @ApiResponse({ status: 404, description: 'Flashcard model not found.' })  
  @ApiResponse({ status: 401, description: 'Unauthorized.' })  
  @ApiResponse({ status: 403, description: 'Forbidden.' })  
  async remove(@Param('id') id: string, @Resource(FlashcardModelEntity, 'params.id') flashcardModel: FlashcardModelEntity,): Promise<void> {  
    this.logger.log(`Received request to delete flashcard model with ID: ${id}`);  
    await this.flashcardModelService.deleteFlashcardModel(flashcardModel.id);  
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