import Anthropic from "@anthropic-ai/sdk";
import type { Analysis } from "../types";

const client = new Anthropic();

const RECORD_ANALYSIS_TOOL: Anthropic.Tool = {
  name: "record_analysis",
  description: "Record the mood analysis of a journal entry transcript.",
  input_schema: {
    type: "object",
    properties: {
      moodScore: {
        type: "number",
        description:
          "Overall emotional tone of the entry, from -5 (very distressed) to 5 (very positive), 0 is neutral.",
      },
      themes: {
        type: "array",
        items: { type: "string" },
        description:
          "2-5 short recurring topic tags mentioned in the entry, e.g. 'work stress', 'sleep', 'family'. Lowercase, no punctuation.",
      },
      supportiveNote: {
        type: "string",
        description:
          "A brief, warm, non-clinical reflection acknowledging what the person shared. 1-2 sentences, second person, no therapy jargon.",
      },
      suggestion: {
        type: "string",
        description:
          "One small, concrete, everyday action they could try, framed gently. 1 sentence. Never medical or clinical advice.",
      },
    },
    required: ["moodScore", "themes", "supportiveNote", "suggestion"],
  },
};

const SYSTEM_PROMPT = `You are a supportive journaling companion reading a short voice-journal transcript from someone checking in about their day and mental state.

You are not a therapist, doctor, or crisis counselor. Do not diagnose, label a condition, or claim certainty about someone's mental state. Do not give clinical or medical advice.

Read the transcript and call record_analysis with:
- A mood score from -5 to 5 reflecting the overall emotional tone.
- 2-5 short recurring themes mentioned.
- A brief, warm, specific reflection that shows you actually read what they said (not generic).
- One small, concrete, everyday suggestion — a walk, a text to a friend, writing something down, a breathing pause. Nothing clinical.

If the transcript mentions self-harm, suicide, or being in crisis, keep the supportive note gentle and make the suggestion about reaching out to a trusted person or a crisis line (e.g. 988 in the US) right now, instead of a generic tip.`;

export async function analyzeTranscript(transcript: string): Promise<Analysis> {
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [RECORD_ANALYSIS_TOOL],
    tool_choice: { type: "tool", name: "record_analysis" },
    messages: [{ role: "user", content: transcript }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    throw new Error("Analysis failed: model did not call record_analysis");
  }

  const input = toolUse.input as Record<string, unknown>;
  const moodScore = Number(input.moodScore);
  const themes = Array.isArray(input.themes) ? input.themes.map(String) : [];
  const supportiveNote = String(input.supportiveNote ?? "");
  const suggestion = String(input.suggestion ?? "");

  if (Number.isNaN(moodScore)) {
    throw new Error("Analysis failed: invalid moodScore");
  }

  return {
    moodScore: Math.max(-5, Math.min(5, moodScore)),
    themes,
    supportiveNote,
    suggestion,
  };
}
