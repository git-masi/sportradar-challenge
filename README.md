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

## Architectural considerations

This project consists of a few parts:

- Postgres DB instance
- pgAdmin
- PostgREST API
- swagger API
- TypeScript service to handle cron jobs

PostgREST is the API server and you can make queries to `http://localhost:3000`.
For more information on how to query using PostgREST see [the docs](https://postgrest.org/en/stable/api.html#tables-and-views).

Initially an alternative architecture was considered consisting of various AWS services.
The basic idea was to use EventBridge Scheduler to invoke Lambda functions at specified times.

The architectural complexity of this solution was judged to be too high when considering a few factors:

- Need DB connection pooling with RDS Proxy
- Need to share code with Lambda Layers
- Difficult local testing

The current solution using Docker containers allows for quicker local development.

As always there are tradeoffs to everything and that above describes the thought processes on making those tradeoffs.

## Getting started

### Ensure you have the correct version of Node

This project uses an .nvmrc file to note the version of Node required.

### Install packages

`npm i`

### Tasks

There are a number of VS Code tasks which make local development easier. You can find them all in .vscode > tasks.json. Note that there are corresponding CLI commands for all tasks.

You can run a task with the command pallet:

- Use keyboard shortcut: `shift + command + p`
- Type the following in the command pallet: "Tasks: Run Task"
- Select task you want to run

### Run local tasks

First run the "start docker containers" task.

This should start the database, pgAdmin, PostgREST API server, and swagger API server.

Once the containers have started run the "dev" task.

This should start local development and you will see logs for services that have started.

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
