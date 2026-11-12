import "dotenv/config";
import express from "express";
import cors from "cors";
import chess from "chess.js";
import pg from "pg";
import { createServer } from "node:http";
import apiRouter from "./routes/Router.js";
import attachRealtime from "./realtime.js";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/chess_app";


const app = express();
const server = createServer(app)
attachRealtime(server)
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
