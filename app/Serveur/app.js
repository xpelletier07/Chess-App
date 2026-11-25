import "dotenv/config";
import express from "express";
import cors from "cors";
import chess from "chess.js";
import pg from "pg";
import apiRouter from "./routes/Router.js";
import { forfeitAbandonedGames } from "./repository/repository.js";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/chess_app";


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

// Fin de partie par déconnexion: toutes les 5 s, on termine les parties dont un joueur
// n'est pas revenu dans les 60 secondes. Le premier passage attend 15 s après le démarrage
// pour laisser aux joueurs le temps de se resynchroniser si le serveur vient de redémarrer.
setTimeout(() => {
  setInterval(async () => {
    try {
      const ended = await forfeitAbandonedGames();
      if (ended.length) console.log("Parties terminées par déconnexion:", ended.join(", "));
    } catch (error) {
      console.error("Erreur lors de la vérification des déconnexions", error);
    }
  }, 5000);
}, 15000);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
