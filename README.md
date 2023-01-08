## Prisma stuff

```sh
npx prisma db pull
mkdir -p prisma/migrations/0_init
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
npx prisma generate
```

## Ubiquitous language

fetch
post

## Software Design

## ADR

## Testing

small, medium, large
