import "dotenv/config";
import express from "express";
import cors from "cors";
import { entriesRouter } from "./routes/entries";
import { insightsRouter } from "./routes/insights";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/entries", entriesRouter);
app.use("/api/insights", insightsRouter);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Mindboard server listening on http://localhost:${port}`);
});
