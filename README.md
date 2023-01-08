## Prisma stuff

```sh
npx prisma db pull
mkdir -p prisma/migrations/0_init
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
npx prisma generate
```

## Ubiquitous language

fetch

Abbreviations in code are written in lower camel case.

Examples:

url
baseUrl
http
requestHttp

## Use prettier for formatting

There are recommended extensions in the .vscode directory

## Software Design

## ADR

## Testing

small, medium, large
