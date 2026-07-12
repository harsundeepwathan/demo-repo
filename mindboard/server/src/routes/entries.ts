import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { deleteAllEntries, getEntry, insertEntry, listEntries } from "../db";
import { transcribeAudio } from "../services/transcribe";
import { analyzeTranscript } from "../services/analyze";
import type { EntryRecord } from "../types";

const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } });

export const entriesRouter = Router();

entriesRouter.post("/", upload.single("audio"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Missing 'audio' file field" });
      return;
    }

    const transcript = await transcribeAudio(
      file.buffer,
      file.originalname || "entry.m4a",
      file.mimetype || "audio/m4a"
    );

    if (!transcript) {
      res.status(422).json({ error: "Could not transcribe audio — try again" });
      return;
    }

    const analysis = await analyzeTranscript(transcript);

    const entry: EntryRecord = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      transcript,
      moodScore: analysis.moodScore,
      themes: analysis.themes,
      supportiveNote: analysis.supportiveNote,
      suggestion: analysis.suggestion,
    };

    insertEntry(entry);
    res.status(201).json(entry);
  } catch (err) {
    console.error("POST /api/entries failed:", err);
    res.status(500).json({ error: "Failed to process entry" });
  }
});

entriesRouter.get("/", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  res.json(listEntries(limit));
});

entriesRouter.get("/:id", (req, res) => {
  const entry = getEntry(req.params.id);
  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json(entry);
});

entriesRouter.delete("/", (_req, res) => {
  deleteAllEntries();
  res.status(204).send();
});
