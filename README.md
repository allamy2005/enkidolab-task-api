# EnkidoLab Task Manager

An Arabic task management app built with Node.js, Express, and PostgreSQL.

## Features
- Add tasks with descriptions
- Mark tasks as completed
- Delete tasks
- Store tasks in PostgreSQL

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js and Express
- Database: PostgreSQL
- Web server: Nginx

## API Endpoints
- `GET /api/health` — Check API status
- `GET /api/tasks` — List tasks
- `POST /api/tasks` — Create a task
- `PUT /api/tasks/:id` — Update a task
- `DELETE /api/tasks/:id` — Delete a task

## Run locally
1. Install dependencies: `npm ci`
2. Configure database settings in `.env`
3. Start the API: `node server.js`

Never commit `.env` or database passwords.
