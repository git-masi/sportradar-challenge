# Sportradar Coding Challenge

## About

This is an implementation of the [Sportradar advanced challenge](https://github.com/sportradarus/sportradar-advanced-challenge).

## Software design philosophy

This project follows a "functional-light" style of JavaScript. That is to say, not pure functional programming but rather "functional thinking" or "functional style".

The project also borrows ideas from the "functional core imperative shell" model, and the Go programming language.

You will note that this project makes use of function "hoisting". This can be somewhat controversial but note that in general files follow this structure:

- types
- most important function or functions (example: entry points into a service)
- implementation details

### Key points

- Be mindful of side effects and push them to the edge of the application (e.g. DB queries and API calls)
- Avoid `this` keyword if possible
- Use higher order functions instead of classes
- Try to maintain immutability

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

### Environment variables

You need to create a `.env` file for the project to work. Here is an example with all the required fields to get started.
You should add your own password wherever you see `<YOUR_PASSWORD_HERE>`.

```sh
echo "POSTGRES_USER=postgres
POSTGRES_PASSWORD=<YOUR_PASSWORD_HERE>
POSTGRES_DB=postgres
POSTGRES_HOST=localhost

API_SCHEMA=api
APP_SCHEMA=app

DB_ANON_ROLE=anon

APP_ROLE=app
APP_PASSWORD=<YOUR_PASSWORD_HERE>

POSTGREST_ROLE=authenticator
POSTGREST_PASSWORD=<YOUR_PASSWORD_HERE>

PGADMIN_DEFAULT_EMAIL=root@root.com
PGADMIN_DEFAULT_PASSWORD=<YOUR_PASSWORD_HERE>
PGADMIN_LISTEN_PORT=5050

APP_DATABASE_URL=postgresql://\${APP_ROLE}:\${APP_PASSWORD}@\${POSTGRES_HOST}:5432/\${POSTGRES_DB}?schema=\${API_SCHEMA}" > .env
```

### IMPORTANT NOTE!

You should never commit passwords to version control!

This project is already set up to ignore `.env` files. Do not change that without a good reason.

### Ensure you have the correct version of Node

This project uses an .nvmrc file to note the version of Node required.

### Ensure you have docker installed

This project was created with `Docker version 20.10.2` in mind.

### Install packages

`npm i`

### Tasks

There are a number of VS Code tasks which make local development easier. You can find them all in .vscode > tasks.json. Note that there are corresponding CLI commands for most tasks.

You can run a task with the command pallet:

- Use keyboard shortcut: `shift + command + p`
- Type the following in the command pallet: "Tasks: Run Task"
- Select task you want to run

### Run local tasks

First run the `start docker containers` task.

This should start the database, pgAdmin, PostgREST API server, and swagger API server.

Once the containers have started run the `dev` task.

This should start local development and you will see logs for services that have started.

Note: you may see an error and nodemon may restart the server. But functionality should not be effected.

Once the local server as started you can visit [the teams endpoint](http://localhost:3000/teams) in the browser and see the results.
More information on querying the API server can be found in the PostgREST section of the README.

To get a list of all endpoints you can visit [the swagger api](http://localhost:8080/) that autogenerates.

### Stopping containers

You can use the "stop docker containers and remove local images and volumes" to stop the Docker containers.
But as the name suggest this will remove images and volumes similar to `docker compose down --remove-orphans -v`.

If that is not the behavior you want then consider using the standard command: `docker compose down`.

## Fake it

In the absence of a good test harness (for now) there may or may not be any live games to draw data from.
There is a way to fake it, though note this is a band-aid solution. Better testing is the real solution.

You can add a previously completed game to the schedule using this format:

```sql
insert into api.schedule(league, game_pk, game_date, link, status)
values('NHL', 2022020638, '2023-01-08 20:00:00+00', '/api/v1/game/2022020638/feed/live', 'In Progress');
```

Note the "In Progress" status.

Then in src/stats/nhl.ts add `'Final'` to the `gameStates` array around line 154.

Start the local dev server as described above.

### IMPORTANT NOTE!

This will cause your local server to query the game feed on an infinite loop so once you have some data you should
shut down the server or revert the changes.
