## Prisma stuff

```sh
npx prisma db pull
mkdir -p prisma/migrations/0_init
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
npx prisma generate
```

## Ubiquitous language

fetch
save

Abbreviations in code are written in lower camel case.

Examples:

url
baseUrl
http
requestHttp

## Use prettier for formatting

There are recommended extensions in the .vscode directory

## Software Design

functional light, grokking simplicity, Go programming language

hoisting functions

avoid `this` if at all possible

multiple independent "services"

ports and adaptors/hexagonal/onion

manage side effects

files tope to bottom

types
low granularity functions
high granularity functions

## Why multiple DB schema?

## ADR

## Testing

small, medium, large

## Types

Defined where they are primarily used

Not all-encompassing

APIs return more data than we need. Types included the minimum data needed

Could use this to generate more comprehensive types
https://app.quicktype.io/?l=ts
