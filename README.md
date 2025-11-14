## Architecture Overview
This project is built using NestJS with TypeScript, following a clean modular architecture. It uses Prisma ORM for database access and BullMQ + Redis for background processing. The codebase is structured to ensure scalability, separation of concerns, and maintainability.

## Key points & libraries
  - Backend Framework: NestJS (Controller → Service → Prisma)

  - Database: PostgreSQL

  - Authentication: JWT-based for clients

  - File Uploads: Multer for CSV/Excel transaction imports

  - Background Processing: BullMQ + Redis for heavy tasks (CSV/XLSX parsing, batch inserts)

  - Testing: Jest for unit and e2e tests

## Code Structure
```plaintext
src/
├── auth/               # Authentication module (controllers, services)
├── common/             # Shared utilities, guards, decorators, filters
├── dto/                # Data Transfer Objects for input validation
├── prisma/             # PrismaService & database setup
├── transaction/        # Transaction import and history module
├── types/              # TypeScript type definitions and interfaces
├── main.ts             # App entry point
└── app.module.ts       # Root module, imports other modules
```
## System Flow
1. Client Registration & Login
  - Registration flow:

    + Validate duplicate email or ID number.

    + Hash password using bcrypt.

    + Generate API key and store client in the database.

    + Return the generated API key.

  - Login flow:

    + Validate client credentials.

    + Return a signed JWT access token.

2. Transaction Import (CSV/Excel)
  - Clients upload CSV or Excel files via POST /transaction/import.

  - The controller temporarily stores the files and creates an import history record with status PENDING.

  - Files are added to a BullMQ queue for background processing.

  - A worker processes each job:

    + Reads data from CSV/Excel.

    + Inserts transactions into the database in batches.

    + Updates import history with totals: successRecords, failedRecords, and final status (SUCCESS or FAILED).

    + Deletes temporary files after processing completes.

3. Viewing Import History
  - Clients request GET /transaction/history with optional page and pageSize query parameters.

  - TransactionService.getImportHistory retrieves paginated import history from the transactionImportHistory table.

  - Response includes the list of imports and pagination metadata.

4. Testing

  - Unit tests are written with Jest for controllers and services.

  - Prisma methods are mocked for unit tests.

  - File operations (CSV/Excel) are mocked to avoid dependency on disk files.

## Diagram solution
👉 bank_reconciliation.drawio

## Project setup
1. Install dependencies
```bash
$ npm install
```
2. Modify DATABASE_URL in .env file into your database name
```bash
$ DATABASE_URL="postgresql://username:password@localhost:5432/bank_reconciliation?schema=public"
```
3. Setup PostgreSQL database
  create empty database name bank_reconciliation
4. Run Prisma migrations
``` bash
$ npx prisma generate
```
``` bash
$ npx prisma migrate dev --name init
```
``` bash
$ npx prisma studio
```

## BullMQ & Redis setup
1. Install Docker
2. Run Redis in Docker
Start a Redis container:
```bash
$ docker run -d
$  --name redis \
$  -p 6379:6379 \
$  redis:7-alpine
```
3. Add Redis config to the NestJS AppModule
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

## How to start
```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests
```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## API cURL Examples
1. Register
````bash
  curl -X POST http://localhost:3000/auth/register 
    -H "Content-Type: application/json" 
    -d '{
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+84901234567",
      "password": "securePass123",
      "idNumber": "123456789012",
      "organizationName": "ACME Corporation"
    }'
````
2. Login
````bash
  curl -X POST http://localhost:3000/auth/login 
    -H "Content-Type: application/json" 
    -d '{
      "email": "john@example.com",
      "password": "securePass123"
    }'
````

3. Get Import History
  ### JWT Authorization
````bash
  curl -X GET "http://localhost:3000/transaction/history?page=1&pageSize=20" 
    -H "Authorization: Bearer <ACCESS_TOKEN>"
````

  ### API Key Authorization
````bash
  curl -X GET "http://localhost:3000/transaction/history?page=1&pageSize=20" 
    -H "x-api-key: <API_KEY>"
````

4. Transaction Import
  ### Notes
    Upload field: files

    Max 5 files

    Max 50MB/file

    Accepted file types:

    text/csv

    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (xlsx)

    application/vnd.ms-excel (xls)

    Requires JWT Authorization

  ### JWT Authorization
````bash
  curl -X POST http://localhost:3000/transaction/import
    -H "Authorization: Bearer <ACCESS_TOKEN>"
    -F "files=@/path/to/file.csv"
````

  ### ### API Key Authorization
````bash
  curl -X POST http://localhost:3000/transaction/import 
    -H "x-api-key: <API_KEY>" 
    -F "files=@/path/to/file.csv"
````

