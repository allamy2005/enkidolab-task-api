# EnkidoLab Task Manager

A web application for creating and tracking tasks through an Arabic interface. The project is built with Node.js, Express, and PostgreSQL, and is deployed on a VPS behind Nginx with HTTPS.

## Project Overview

EnkidoLab Task Manager provides a simple way to create tasks, review their status, and keep task data in a PostgreSQL database. The current version is designed as a shared task list. User accounts and private task lists are planned improvements and are not yet implemented.

## Current Features

- Create tasks with a title and optional description
- View tasks
- Mark tasks as completed by updating them
- Delete tasks
- Store task data in PostgreSQL
- Arabic, right-to-left web interface
- HTTPS deployment through Nginx
- Scheduled database backups on the VPS

## Technology Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js and Express
- Database: PostgreSQL
- Web server and reverse proxy: Nginx
- Process management: systemd

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Check API status |
| `GET` | `/api/tasks` | List tasks |
| `POST` | `/api/tasks` | Create a task |
| `PUT` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |

## Planned Improvements

- Individual user registration and login
- Private tasks for each user
- Secure password hashing and session management
- Task due dates, search, and filtering

## Run Locally

1. Install dependencies with `npm ci`.
2. Create a `.env` file with the required database settings.
3. Start the API with `node server.js`.
4. Open `http://localhost:3000`.

Never commit `.env` files, passwords, tokens, or database backups.
