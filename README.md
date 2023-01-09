# Sportradar Coding Challenge

## About

This is an implementation of the [Sportradar advanced challenge](https://github.com/sportradarus/sportradar-advanced-challenge).

## Software design philosophy

This project follows a "functional-light" style of JavaScript. That is to say, not pure functional programming but rather bits for "functional thinking" or "functional style".

The project also borrows ideas from onion architecture/ports and adaptors and the Go programming language.

You will note that this project makes use of function "hoisting". This can be somewhat controversial but note that in general files follow this structure:

- types
- most important function or functions (example: entry points into a service)
- implementation details

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

The architectural complexity of that solution was judged to be too high when considering a few factors:

- Need DB connection pooling with RDS Proxy
- Need to share code with Lambda Layers
- Difficult local testing

The current solution using Docker containers allows for quicker local development.

As always there are tradeoffs to everything and that above describes the thought processes on making those tradeoffs.

### Yagni

The project tries to strike a balance between project requirements and more real work considerations.

Some questions to consider:

- Should a single service be responsible for updating teams, players, and game stats?
- In a real-world project wouldn't players and teams exist in the DB before a game starts?
- What happens if the server dies and needs to be rebooted?
- How do we handle individual job failures.

The chosen solution was to implement a few independent "services" that ingest one kind of data.
These services use some common components but ultimately they can evolve independently.
By doing this the hope is that there is a balance between real world considerations and implementing the challenge requirements.

## A note on TypeScript types

As a matter of preferences types are defined where they are primarily used.

Most of the types are note meant to be all-encompassing. Consider that fact that the APIs return more data than needed.
Often the types in this project will contain the minimum data needed to save time/space. This is a design choice.

Also note that many of the times were generated [using this service](https://app.quicktype.io/?l=ts) to help speed up development.

As mentioned perviously everything has tradeoffs and speed trumps comprehensiveness in this case.

## Getting started

### Ensure you have the correct version of Node

This project uses an .nvmrc file to note the version of Node required.

### Install packages

`npm i`

### Tasks

There are a number of VS Code tasks which make local development easier. You can find them all in .vscode > tasks.json. Note that there are corresponding CLI commands for most tasks.

You can run a task with the command pallet:

- Use keyboard shortcut: `shift + command + p`
- Type the following in the command pallet: "Tasks: Run Task"
- Select task you want to run

### Run local tasks

First run the "start docker containers" task.

This should start the database, pgAdmin, PostgREST API server, and swagger API server.

Once the containers have started run the "dev" task.

This should start local development and you will see logs for services that have started.

### Stopping containers

You can use the "stop docker containers and remove local images and volumes" to stop the Docker containers.
But as the name suggest this will remove images and volumes similar to `docker compose down --remove-orphans -v`.

If that is not the behavior you want then consider using the standard command: `docker compose down`.
