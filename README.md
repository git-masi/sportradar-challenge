# Sportradar Coding Challenge

## About

This is an implementation of the [Sportradar advanced challenge](https://github.com/sportradarus/sportradar-advanced-challenge).

## Software design philosophy

This project follows a "functional-light" style of JavaScript. That is to say, not pure functional programming but rather bits for "functional thinking" or "functional style".

The project also borrows ideas from onion architecture/ports and adaptors and the Go programming language.

### Key points

- Be mindful of side effects and push them to the edge of the application (e.g. DB queries and API calls)
- Avoid `this` keyword if possible
- Use higher order functions instead of classes

This is not a judgement on "OOP" just a preference for functional style and imperative programming.

### Resources

More on this can be found in the books:

- "Grokking Simplicity"
- "Functional-Light JavaScript"

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
