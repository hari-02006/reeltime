const express = require("express");
const mongoose = require("mongoose");
const Movie = require("../models/Movie");

const router = express.Router();
const editableFields = ["title", "genre", "releaseYear", "rating", "posterUrl", "status", "description"];

function validateBody(body, requireTitle = true) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object.";
  }
  const providedFields = Object.keys(body).filter((field) => editableFields.includes(field));
  if (!providedFields.length) {
    return "Provide at least one movie field to save.";
  }
  if (requireTitle && (typeof body.title !== "string" || !body.title.trim())) {
    return "Movie name is required.";
  }
  if (!requireTitle && Object.hasOwn(body, "title") && (typeof body.title !== "string" || !body.title.trim())) {
    return "Movie name cannot be empty.";
  }
  for (const field of ["releaseYear", "rating"]) {
    const value = body[field];
    if (value !== undefined && value !== null && value !== "" && !Number.isFinite(Number(value))) {
      return `${field === "releaseYear" ? "Release year" : "Rating"} must be a number.`;
    }
  }
  return null;
}

function getMovieId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "A valid movie ID is required." });
  }
  return next();
}

function handleError(error, res) {
  if (error.name === "ValidationError" || error.name === "CastError") {
    const messages = error.name === "ValidationError"
      ? Object.values(error.errors).map((item) => item.message)
      : [error.message];
    return res.status(400).json({ success: false, message: messages.join(" ") });
  }
  throw error;
}

router.get("/", async (req, res, next) => {
  try {
    const data = await Movie.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  const invalidMessage = validateBody(req.body);
  if (invalidMessage) return res.status(400).json({ success: false, message: invalidMessage });

  try {
    const movieData = Object.fromEntries(
      editableFields.filter((field) => Object.hasOwn(req.body, field)).map((field) => [field, req.body[field]]),
    );
    const movie = await Movie.create(movieData);
    return res.status(201).json({ success: true, message: "Movie created successfully.", data: movie });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") return handleError(error, res);
    return next(error);
  }
});

router.get("/:id", getMovieId, async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id).lean();
    if (!movie) return res.status(404).json({ success: false, message: "Movie not found." });
    return res.status(200).json({ success: true, data: movie });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", getMovieId, async (req, res, next) => {
  const invalidMessage = validateBody(req.body, false);
  if (invalidMessage) return res.status(400).json({ success: false, message: invalidMessage });

  try {
    const updates = Object.fromEntries(
      editableFields.filter((field) => Object.hasOwn(req.body, field)).map((field) => [field, req.body[field]]),
    );
    const movie = await Movie.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!movie) return res.status(404).json({ success: false, message: "Movie not found." });
    return res.status(200).json({ success: true, message: "Movie updated successfully.", data: movie });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") return handleError(error, res);
    return next(error);
  }
});

router.delete("/:id", getMovieId, async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ success: false, message: "Movie not found." });
    return res.status(200).json({ success: true, message: "Movie deleted successfully.", data: movie });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
