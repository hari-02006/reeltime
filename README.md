# Reel Time — Movie Watchlist

A responsive movie dashboard built with plain HTML, CSS, and JavaScript, an Express API, and MongoDB through Mongoose. Express serves the frontend and API from the same origin, so no frontend framework or separate CORS setup is needed.

## Features

- Dashboard totals for all movies, watched, want-to-watch, and currently watching.
- Create, edit, and delete movies with server-side and form validation.
- Search by title, filter by genre/status, and sort by year or rating.
- Responsive dark cinematic interface with graceful fallback when a poster image is unavailable.
- MongoDB connection checks, API health endpoint, consistent JSON errors, and graceful shutdown.
- Optional seed script for eight sample movies.

## Requirements

- Node.js 18.11 or later and npm.
- A MongoDB Atlas cluster (or a MongoDB server reachable from your machine).

## Run locally

1. Clone or download this project and open its root directory in a terminal.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`. Set `MONGODB_URI` to your Atlas connection string. Replace the username and password placeholders, URL-encode special characters in credentials, and allow your development IP address in Atlas Network Access. Keep `.env` private; it is ignored by Git.

   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://your-user:your-password@your-cluster.example.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=movieWatchlist
   ```

   The database name is set to `movieWatchlist`. Mongoose creates the `movies` collection when the first movie is saved.

4. Start the server:

   ```bash
   npm start
   ```

   With Node.js 18.11 or later, use `npm run dev` for automatic restarts while developing.

5. Open [http://localhost:3000](http://localhost:3000). Check [http://localhost:3000/api/health](http://localhost:3000/api/health) for database connection status.

To insert the example movies into an empty collection, run `npm run seed` in a separate terminal. This adds the eight sample movies each time it is run; do not run it repeatedly unless duplicate examples are wanted.

## API

All responses are JSON. Movie IDs are MongoDB ObjectIds. Optional fields can be omitted or set to `null` where appropriate.

| Method | Endpoint | Purpose | Success |
| --- | --- | --- | --- |
| `GET` | `/api/movies` | List movies, newest additions first | `200` |
| `POST` | `/api/movies` | Create a movie | `201` |
| `GET` | `/api/movies/:id` | Retrieve one movie | `200` |
| `PUT` | `/api/movies/:id` | Update a movie | `200` |
| `DELETE` | `/api/movies/:id` | Delete a movie | `200` |
| `GET` | `/api/health` | Check server/database availability | `200` or `503` |

Example request body for create/update:

```json
{
  "title": "Arrival",
  "genre": "Sci-Fi",
  "releaseYear": 2016,
  "rating": 7.9,
  "posterUrl": "https://example.com/arrival.jpg",
  "status": "Want to Watch",
  "description": "A linguist works to communicate with visitors from beyond Earth."
}
```

`title` is required. `releaseYear` must be 1888 or later and no more than ten years in the future; `rating` must be between 1 and 10; status must be `Want to Watch`, `Watching`, or `Watched`; poster URLs must use HTTP or HTTPS. Invalid IDs and input return `400`; missing movies return `404`; unexpected server failures return `500`.

## Postman testing

Start the app and set a Postman environment variable `baseUrl` to `http://localhost:3000`. To test on Render instead, change it to your deployed service URL.

1. **Create:** `POST {{baseUrl}}/api/movies` with the JSON body above and header `Content-Type: application/json`. Expect `201`; copy `data._id` from the response.
2. **List:** `GET {{baseUrl}}/api/movies`. Expect `200` and a `data` array.
3. **Get one:** `GET {{baseUrl}}/api/movies/<id>`. Expect `200`.
4. **Update:** `PUT {{baseUrl}}/api/movies/<id>` with a valid JSON body, for example change `status` to `Watched`. Expect `200`.
5. **Delete:** `DELETE {{baseUrl}}/api/movies/<id>`. Expect `200`. Repeat the get request to confirm a `404`.
6. **Validation check:** submit a create request with `"title": ""` or `"rating": 11`; expect `400` with a descriptive message.

## Deploy to Render

1. Push the project to a Git repository and create a **Web Service** in Render connected to that repository.
2. Use the repository root as the **Root Directory**, `npm install` as the **Build Command**, and `npm start` as the **Start Command**. Render supplies `PORT`; the server listens on `process.env.PORT`.
3. Add `MONGODB_URI` and (optionally) `MONGODB_DB_NAME=movieWatchlist` under the service's **Environment** settings. Never commit your Atlas connection string.
4. In MongoDB Atlas Network Access, allow the Render service to connect. For a college demo, Atlas's `0.0.0.0/0` rule is convenient but broad; restrict access when your deployment setup allows it.
5. Deploy. Visit your Render service URL; the static frontend and `/api/movies` API share the same origin. Check `/api/health` to confirm Atlas connectivity.

## Project structure

```text
frontend/
  index.html
  style.css
  script.js
backend/
  config/db.js
  models/Movie.js
  routes/movieRoutes.js
  seed.js
  server.js
package.json
.env.example
```
