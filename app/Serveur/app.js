import "dotenv/config";
import express from "express";
import cors from "cors";
import chess from "chess.js";
import apiRouter from "./routes/Router.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// importation des routes
app.use(apiRouter)

let game = new chess.Chess(); // À changer pour la bd

// Route de base
app.get("/", (req, res) => {
  res.json({ message: "Chess-App API en ligne" });
});

// Route de santé simple (utilisée par le CI / healthchecks)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});