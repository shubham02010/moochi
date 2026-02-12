import express from "express";
import { providers } from "../providers/providers.js";
import { generateToken } from "../utils/token.js";

const router = express.Router();

router.get("/", (req, res) => {
  const { type, id, season, episode } = req.query;

  if (!type || !id) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const list = providers
    .map(p => {
      let embed;

      if (type === "movie") {
        embed = p.movie(id);
      } else if (type === "series") {
        if (!season || !episode) return null;
        embed = p.series(id, season, episode);
      }

      return {
        id: p.id,
        name: p.name,
        embedUrl: embed,
        token: generateToken()
      };
    })
    .filter(Boolean);

  res.json({ providers: list });
});

export default router;
