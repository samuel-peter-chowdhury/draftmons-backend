# Draftmons Project Guide

## Project Overview

Draftmons is a Pokemon league management application with an Express.js backend REST API serving a Next.js frontend. The backend is built with TypeScript, uses PostgreSQL as the database, TypeORM as the ORM, and provides comprehensive API documentation through Swagger/OpenAPI.

## Technology Stack

### Core Technologies
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: TypeORM v0.3.19
- **Dependency Injection**: TypeDI
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger (swagger-jsdoc & swagger-ui-express)
- **Authentication**: Passport.js (Google OAuth 2.0)
- **Session Management**: express-session with Redis (production) / MemoryStore (development)

### Key Packages
- `reflect-metadata`: Required for decorators
- `typedi`: Dependency injection container
- `class-transformer`: Object transformation and serialization
- `class-validator`: DTO validation
- `typeorm-naming-strategies`: Database naming conventions
- `helmet`: Security headers
- `cors`: CORS handling
- `morgan`: HTTP request logging

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── passport.config.ts
│   ├── repository.config.ts
│   └── swagger.config.ts
├── controllers/      # API controllers
├── services/         # Business logic services
├── entities/         # TypeORM entities
├── dtos/            # Data Transfer Objects
├── middleware/       # Express middleware
├── utils/           # Utility functions
├── errors/          # Custom error classes
├── app.ts           # Application class
└── server.ts        # Server entry point
```

## Architecture Patterns

### 1. Layered Architecture
The application follows a strict layered architecture:
- **Controllers**: Handle HTTP requests/responses, route definitions, validation
- **Services**: Contain business logic, interact with repositories
- **Entities**: Define database schema and relationships
- **DTOs**: Define data contracts for API input/output

### 2. Dependency Injection
- Uses TypeDI container for dependency management
- Services are decorated with `@Service()` and injected via constructor
- Repositories are registered in `repository.config.ts` and injected with `@Inject('RepositoryName')`

### 3. Base Classes Pattern
All entities, controllers, services, and DTOs extend from abstract base classes to ensure consistency and reduce boilerplate.

## Coding Conventions

### General TypeScript
- **Indentation**: 2 spaces (strictly enforced)
- **Semicolons**: Always use semicolons
- **Quotes**: Single quotes for strings
- **Async/Await**: Prefer async/await over promises
- **Arrow Functions**: Use arrow functions for class methods in controllers

### Naming Conventions
- **Files**: kebab-case (e.g., `league-user.entity.ts`)
- **Classes**: PascalCase (e.g., `LeagueUserService`)
- **Interfaces**: PascalCase with "I" prefix (e.g., `IUserRepository`)
- **Variables/Functions**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `APP_CONFIG`)
- **Database Tables**: snake_case (handled by naming strategy)

### File Naming Patterns
- Entities: `*.entity.ts`
- Services: `*.service.ts`
- Controllers: `*.controller.ts`
- DTOs: `*.dto.ts`
- Middleware: `*.middleware.ts`
- Utils: `*.utils.ts`
- Config: `*.config.ts`

## Entity Development

### Base Entity Structure
All entities must extend `BaseApplicationEntity`:

```typescript
import { Entity, Column } from 'typeorm';
import { BaseApplicationEntity } from './base-application.entity';

@Entity('table_name')
export class EntityName extends BaseApplicationEntity {
  @Column()
  propertyName: string;
}
```

### Entity Conventions
- All entities extend `BaseApplicationEntity` (provides id, isActive, createdAt, updatedAt)
- Use `@Entity('table_name')` with explicit snake_case table name
- Use TypeORM decorators: `@Column()`, `@OneToMany()`, `@ManyToOne()`, etc.
- Sensitive fields (passwords) use `{ select: false }` option
- Nullable fields use `{ nullable: true }`
- Define relationships bidirectionally when appropriate

### Common Entity Patterns
```typescript
// One-to-Many
@OneToMany(() => ChildEntity, child => child.parent)
children: ChildEntity[];

// Many-to-One
@ManyToOne(() => ParentEntity, parent => parent.children)
parent: ParentEntity;

// Many-to-Many
@ManyToMany(() => RelatedEntity, related => related.inverse)
@JoinTable()
related: RelatedEntity[];

// Sensitive data
@Column({ select: false })
password: string;
```

## DTO Development

### Input DTOs
All input DTOs extend `BaseInputDto` and use class-validator decorators:

```typescript
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { BaseInputDto } from './base-input.dto';

export class EntityInputDto extends BaseInputDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

### Output DTOs
All output DTOs extend `BaseOutputDto` and use class-transformer decorators:

```typescript
import { Expose, Exclude, Type } from 'class-transformer';
import { BaseOutputDto } from './base-output.dto';

export class EntityOutputDto extends BaseOutputDto {
  @Expose()
  name: string;

  @Exclude()
  sensitiveField: string;

  @Expose({ groups: ['entity.full'] })
  @Type(() => RelatedOutputDto)
  related: RelatedOutputDto[];
}
```

### DTO Conventions
- Input DTOs: Use class-validator decorators (`@IsString()`, `@IsNumber()`, etc.)
- Output DTOs: Use class-transformer decorators (`@Expose()`, `@Exclude()`, `@Type()`)
- Full details: Use `groups: ['entity.full']` for nested relationships
- Always define both Input and Output DTOs for each entity
- Export both DTOs from the same file

### Transform Groups Pattern
- Basic view: No group (only scalar fields)
- Full view: `['entityName.full']` (includes relationships)
- Example: `['league.full', 'leagueUser.full']` for nested details

## Service Development

### Service Structure
All services extend `BaseService<Entity, InputDto>`:

```typescript
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService } from './base.service';
import { Entity } from '../entities/entity.entity';
import { EntityInputDto } from '../dtos/entity.dto';

@Service()
export class EntityService extends BaseService<Entity, EntityInputDto> {
  constructor(
    @Inject('EntityRepository')
    private entityRepository: Repository<Entity>
  ) {
    super(entityRepository, 'Entity');
  }

  // Add custom business logic methods here
}
```

### Service Conventions
- Decorated with `@Service()` for TypeDI
- Extend `BaseService` for standard CRUD operations
- Use `Container.get(ServiceName)` for service injection in controllers
- Repository injection pattern: `@Inject('EntityNameRepository')`
- Custom business logic methods added as needed
- Entity name passed to super for error messages

## Controller Development

### Controller Structure
All controllers extend `BaseController<Entity, InputDto, OutputDto>`:

```typescript
import { Request, Router } from 'express';
import { BaseController } from './base.controller';
import { Entity } from '../entities/entity.entity';
import { EntityInputDto, EntityOutputDto } from '../dtos/entity.dto';
import { EntityService } from '../services/entity.service';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { isAuthenticated } from '../middleware/auth.middleware';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Container } from 'typedi';

export class EntityController extends BaseController<Entity, EntityInputDto, EntityOutputDto> {
  public router = Router();

  constructor(private entityService: EntityService) {
    super(entityService, EntityOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public routes
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);

    // Authenticated routes
    this.router.post('/', isAuthenticated, validateDto(EntityInputDto), this.create);
    this.router.put('/:id', isAuthenticated, validatePartialDto(EntityInputDto), this.update);
    this.router.delete('/:id', isAuthenticated, this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['entity.full'];
  }

  protected async getWhere(req: Request): Promise<FindOptionsWhere<Entity> | undefined> {
    return plainToInstance(EntityInputDto, req.query);
  }

  protected getBaseRelations(): FindOptionsRelations<Entity> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<Entity> | undefined {
    return {
      relatedEntity: true
    };
  }
}
```

### Controller Conventions
- Public router property of type `Router`
- Service injected via constructor with Container.get()
- Call `super(service, OutputDtoClass)` in constructor
- `initializeRoutes()` defines all route handlers
- GET routes are public by default
- POST, PUT, DELETE routes require authentication
- Use `validateDto()` for POST, `validatePartialDto()` for PUT
- Implement required abstract methods: `getWhere()`, `getBaseRelations()`, `getFullRelations()`, `getFullTransformGroup()`

### Route Patterns
- `GET /`: Get all entities (with pagination, sorting, filtering)
- `GET /:id`: Get entity by ID
- `POST /`: Create new entity
- `PUT /:id`: Update existing entity
- `DELETE /:id`: Delete entity

### Query Parameters
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 25)
- `sortBy`: Field to sort by
- `sortOrder`: ASC or DESC
- `full`: Include full details with relationships (boolean)

## Swagger Documentation

### Documentation Requirements
Every controller must include comprehensive Swagger documentation:

1. **Component Schemas**: Define all entity schemas
2. **Endpoint Documentation**: Document all routes with examples
3. **Request/Response Examples**: Provide realistic Pokemon-themed examples
4. **Error Responses**: Document all possible error scenarios

### Swagger Patterns

#### Component Schemas
```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     EntityName:
 *       type: object
 *       required:
 *         - id
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier
 *           example: 1
 *         name:
 *           type: string
 *           description: Name of the entity
 *           example: "Pikachu"
 */
```

#### GET All Endpoint
```typescript
/**
 * @swagger
 * /api/entity:
 *   get:
 *     tags:
 *       - EntityName
 *     summary: Get all entities
 *     description: Retrieve a list of all entities with optional pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 25
 *       - in: query
 *         name: full
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: List retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EntityName'
 */
```

#### POST Endpoint
```typescript
/**
 * @swagger
 * /api/entity:
 *   post:
 *     tags:
 *       - EntityName
 *     summary: Create a new entity
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EntityInput'
 *     responses:
 *       201:
 *         description: Entity created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: User not authenticated
 */
```

### Swagger Conventions
- Use Pokemon-themed examples (Pikachu, Charizard, Gyarados, etc.)
- Include multiple examples for different scenarios
- Document all query parameters with defaults
- Include error response schemas
- Use `security: - sessionAuth: []` for authenticated routes
- Group related schemas (Entity, EntityFull, EntityInput, EntityUpdateInput)

## Middleware

### Authentication Middleware
- `isAuthenticated`: Verify user is logged in
- `isAdmin`: Verify user has admin role
- `isLeagueModerator(leagueIdParam)`: Verify user is league moderator
- `isLeagueMember(leagueIdParam)`: Verify user is league member
- `isResourceOwner(resourceIdParam, userIdField)`: Verify user owns resource

### Validation Middleware
- `validateDto(DtoClass)`: Validate and transform request body (strict)
- `validatePartialDto(DtoClass)`: Transform request body without strict validation
- `validateQuery(DtoClass)`: Validate query parameters
- `validateParams(DtoClass)`: Validate path parameters

### Error Handling
- All async route handlers wrapped with `asyncHandler()` utility
- Custom error classes: `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`
- Global error middleware in `errorMiddleware`

## Database Patterns

### Repository Registration
Repositories must be registered in `repository.config.ts`:

```typescript
Container.set('EntityRepository', AppDataSource.getRepository(Entity));
```

### Relations Loading
- Base relations: Minimal data for list views
- Full relations: Complete data with nested relationships
- Use `FindOptionsRelations<Entity>` type for type safety

### Querying Patterns
```typescript
// With relations
const entity = await repository.findOne({
  where: { id },
  relations: { relatedEntity: true }
});

// With pagination
const [entities, total] = await repository.findAndCount({
  skip: (page - 1) * pageSize,
  take: pageSize
});
```

## Error Handling

### Custom Error Classes
```typescript
import { ValidationError } from '../errors';

throw new ValidationError('Invalid input');
throw new NotFoundError('Entity', id);
throw new UnauthorizedError('Please log in');
throw new ForbiddenError('Access denied');
```

### Async Handler Pattern
All controller methods use `asyncHandler()`:
```typescript
getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Implementation
});
```

## Testing Considerations

### Areas to Test
- DTO validation (valid/invalid inputs)
- Service business logic
- Controller route handlers
- Middleware authentication/authorization
- Error handling

### Test Structure
```typescript
describe('EntityService', () => {
  it('should create entity', async () => {
    // Test implementation
  });
});
```

## Common Pitfalls to Avoid

1. **Missing Repository Registration**: Always register repositories in `repository.config.ts`
2. **Incorrect Indentation**: Must use 2 spaces, not tabs or 4 spaces
3. **Missing Swagger Documentation**: Every controller needs complete documentation
4. **Incorrect Transform Groups**: Use `['entity.full']` pattern consistently
5. **Missing Validation**: Always use `validateDto()` or `validatePartialDto()`
6. **Missing Authentication**: POST/PUT/DELETE routes must use `isAuthenticated`
7. **Incorrect Service Injection**: Use `Container.get(ServiceName)` not `new ServiceName()`
8. **Missing Type Decorators**: Output DTOs need `@Type(() => RelatedDto)` for relationships
9. **Incorrect Where Clause**: Use `plainToInstance(InputDto, req.query)` for type safety

## Controller Creation Workflow

When creating a new controller:

1. **Ensure Entity and DTOs exist**
   - Entity with proper relationships
   - Input DTO with validation decorators
   - Output DTO with expose/exclude decorators

2. **Create Service**
   - Extend BaseService
   - Register repository in repository.config.ts
   - Add custom business logic if needed

3. **Create Controller**
   - Extend BaseController
   - Initialize routes (public vs authenticated)
   - Implement abstract methods
   - Add comprehensive Swagger documentation

4. **Register Controller in app.ts**
   - Import controller
   - Instantiate with service injection
   - Register route: `this.app.use('/api/entity', controller.router)`

5. **Test Endpoints**
   - Verify all routes work
   - Check Swagger UI at `/api-docs`
   - Test authentication/authorization
   - Validate error handling

## Application Domain Context

### Pokemon League System
The application manages competitive Pokemon leagues with:
- **Leagues**: Organizations/groups for competitions
- **Seasons**: Time-bound competition periods within leagues
- **Teams**: User-owned teams within a season
- **Matches**: Competitive battles between teams
- **Pokemon**: Individual Pokemon with stats, types, abilities, moves
- **Users**: Players and moderators

### Entity Relationships
- League → has many Seasons, LeagueUsers
- Season → has many Teams, Weeks, SeasonPokemon
- Team → belongs to Season and User, has many MatchTeams
- Match → has many MatchTeams, belongs to Week
- Pokemon → has Types, Abilities, Moves through join tables
- User → has many Teams, LeagueUsers

## Development Best Practices

1. **Type Safety**: Always use TypeScript types, avoid `any`
2. **Immutability**: Use `const` by default, `let` only when necessary
3. **DRY Principle**: Leverage base classes to avoid code duplication
4. **Single Responsibility**: Each class/method should have one clear purpose
5. **Documentation**: Comment complex business logic, document all public APIs
6. **Error Messages**: Provide clear, actionable error messages
7. **Security**: Never expose sensitive data (passwords, tokens)
8. **Validation**: Validate all inputs at the controller level
9. **Relations**: Load relations explicitly, avoid accidental N+1 queries
10. **Consistency**: Follow established patterns throughout the codebase

## Environment Configuration

### Required Environment Variables
- `NODE_ENV`: development | production
- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `GOOGLE_CLIENT_ID`: OAuth client ID
- `GOOGLE_CLIENT_SECRET`: OAuth client secret
- `GOOGLE_CALLBACK_URL`: OAuth callback URL
- `REDIS_HOST`: Redis host (production)
- `REDIS_PORT`: Redis port (production)
- `REDIS_PASSWORD`: Redis password (production)

## Build and Deployment

### Development
```bash
npm run dev  # Start with nodemon and ts-node
```

### Production Build
```bash
npm run build  # Compile TypeScript
npm start      # Run compiled JavaScript
```

### Database Migrations
```bash
npm run migration:generate -- src/migrations/MigrationName
npm run migration:run
npm run migration:revert
```

## Additional Resources

- TypeORM Documentation: https://typeorm.io
- class-validator: https://github.com/typestack/class-validator
- class-transformer: https://github.com/typestack/class-transformer
- Swagger/OpenAPI: https://swagger.io/specification/
- Express.js: https://expressjs.com/

## Current Project Status

The project has established patterns for:
- ✅ Entity management (League, User, Pokemon, etc.)
- ✅ Service layer with BaseService
- ✅ Controller layer with BaseController
- ✅ DTO validation and transformation
- ✅ Authentication with Passport.js
- ✅ Swagger documentation standards
- ✅ Error handling and middleware

Active development focuses on creating comprehensive API documentation for all entity controllers while maintaining consistent code patterns and Pokemon-themed examples.