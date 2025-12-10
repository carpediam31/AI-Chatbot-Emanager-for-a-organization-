import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";
import { knowledgeBase } from "./seedinfo.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory session store
let sessions = {}; // { userId: [ {role, content}, ... ] }

app.post("/api/chat", async (req, res) => {
  const { message, userId } = req.body;

  // Create session if not exists
  if (!sessions[userId]) {
    sessions[userId] = [
      { role: "system", content: "You are TD Chatbot for Emanagar." }
    ];
  }

  // Push user message
  sessions[userId].push({ role: "user", content: message });

  const lowerMsg = message.toLowerCase();

  // Keyword-based seed info response with redirect link
  const direct = knowledgeBase.find(k => lowerMsg.includes(k.keyword));
  if (direct) {
    const replyWithLink = direct.link
      ? `${direct.answer}\n\nYou can go directly to this section here: ${direct.link}`
      : direct.answer;

    sessions[userId].push({ role: "assistant", content: replyWithLink });

    return res.json({ reply: replyWithLink, link: direct.link || null });
  }

  // OpenAI GPT for other queries (context-aware)
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: sessions[userId]
    });

    const reply = completion.choices[0].message.content;
    sessions[userId].push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.json({ reply: "I don't have info on this yet." });
  }
});

app.listen(5000, () => console.log("TD Chatbot backend running on port 5000"));
