const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Movie name is required."],
    trim: true,
    maxlength: [120, "Movie name must be 120 characters or fewer."],
  },
  genre: {
    type: String,
    trim: true,
    maxlength: [60, "Genre must be 60 characters or fewer."],
    default: "Uncategorized",
  },
  releaseYear: {
    type: Number,
    min: [1888, "Release year must be 1888 or later."],
    max: [new Date().getFullYear() + 10, "Release year is too far in the future."],
    default: null,
  },
  rating: {
    type: Number,
    min: [1, "Rating must be at least 1."],
    max: [10, "Rating cannot be greater than 10."],
    default: null,
  },
  posterUrl: {
    type: String,
    trim: true,
    maxlength: [2048, "Poster URL must be 2048 characters or fewer."],
    default: "",
    validate: {
      validator(value) {
        if (!value) return true;
        try {
          return ["http:", "https:"].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      },
      message: "Poster URL must be a valid HTTP or HTTPS URL.",
    },
  },
  status: {
    type: String,
    enum: {
      values: ["Want to Watch", "Watching", "Watched"],
      message: "Status must be Want to Watch, Watching, or Watched.",
    },
    default: "Want to Watch",
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, "Description must be 1000 characters or fewer."],
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Movie", movieSchema);
