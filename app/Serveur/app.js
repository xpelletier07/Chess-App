import express from "express";
import cors from "cors";
import chess from "chess.js";


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Importation des routes
let game = new chess.Chess(); // À changer pour la bd

// Route de base
app.get("/", (req, res) => {
  res.json({ message: "Chess-App API en ligne" });
});

// Route de santé simple (utilisée par le CI / healthchecks)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post('/api/move', (req, res) => {
    try {
        const { move } = req.body;

        if (!move || typeof move !== 'string') {
            return res.status(400).json({ error: 'Coup invalide (format)' });
        }

        // Validation côté serveur
        const result = game.move(move);
        if (!result) {
            return res.status(400).json({ error: 'Coup illégal' });
        }

        return res.json({
            fen: game.fen(),
            lastMove: result,
            status: game.isGameOver() ? 'Game Over' : 'In Progress'
        });
    } catch (err) {
        return res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});