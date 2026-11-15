require("dotenv").config();

const mongoose = require("mongoose");
const connectDatabase = require("./config/db");
const Movie = require("./models/Movie");

const sampleMovies = [
  {
    title: "Interstellar",
    genre: "Sci-Fi",
    releaseYear: 2014,
    rating: 8.7,
    posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    status: "Watched",
    description: "A team of explorers travels beyond this galaxy to discover whether mankind has a future among the stars.",
  },
  {
    title: "Inception",
    genre: "Sci-Fi",
    releaseYear: 2010,
    rating: 8.8,
    posterUrl: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    status: "Want to Watch",
    description: "A skilled thief who steals corporate secrets through dream-sharing technology gets one last impossible job.",
  },
  {
    title: "The Dark Knight",
    genre: "Action",
    releaseYear: 2008,
    rating: 9,
    posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    status: "Watched",
    description: "Batman faces the Joker, a criminal mastermind who wants to plunge Gotham into anarchy.",
  },
  {
    title: "Avengers: Endgame",
    genre: "Action",
    releaseYear: 2019,
    rating: 8.4,
    posterUrl: "https://image.tmdb.org/t/p/w500/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg",
    status: "Watching",
    description: "The remaining Avengers assemble for one final stand to reverse the damage caused by Thanos.",
  },
  {
    title: "Spider-Man: No Way Home",
    genre: "Adventure",
    releaseYear: 2021,
    rating: 8.2,
    posterUrl: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
    status: "Want to Watch",
    description: "Peter Parker's world is turned upside down when a spell opens the door to visitors from other universes.",
  },
  {
    title: "The Shawshank Redemption",
    genre: "Drama",
    releaseYear: 1994,
    rating: 9.3,
    posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    status: "Watched",
    description: "Two prisoners form a lasting friendship as they hold on to hope inside Shawshank prison.",
  },
  {
    title: "Parasite",
    genre: "Thriller",
    releaseYear: 2019,
    rating: 8.5,
    posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    status: "Want to Watch",
    description: "A struggling family becomes entangled with a wealthy household in an unexpected way.",
  },
  {
    title: "Dune",
    genre: "Sci-Fi",
    releaseYear: 2021,
    rating: 8,
    posterUrl: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    status: "Watching",
    description: "Paul Atreides travels to the dangerous desert world of Arrakis, where his destiny begins to unfold.",
  },
];

async function seed() {
  await connectDatabase();
  const result = await Movie.insertMany(sampleMovies);
  console.log(`Added ${result.length} sample movies.`);
}

seed()
  .catch((error) => {
    console.error("Unable to seed sample movies:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
