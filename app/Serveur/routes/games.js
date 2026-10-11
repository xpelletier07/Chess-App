import express from 'express';
import * as repository from '../repository/repository.js';
import { checkAuth } from '../middlewares/checkAuth.js';

const router = express.Router();

// POST pour créer une nouvelle partie
router.post("/newGame", checkAuth, async (req, res) => {
    try {
        const creatorId = req.user.id;
        const code = String(Math.floor(100000 + Math.random() * 900000));
        await repository.createGame(code, creatorId);
        const game = await repository.findGameByCode(code);

        return res.status(201).json({ game });
    }
    catch (error) {
        console.error("Erreur dans POST /games/newGame", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
})

// POST pour join une partie
router.post("/join/:code", checkAuth, async (req, res) => {
    try {
        // bcp d'erreurs 409 CONFLICT => pas necessairement une mauvaise requête
        // mais entre en conflit avec les règles mértier

        const code = req.params.code
        const playerId = req.user.id;
        // premier check pour voir si la game existe 
        const game = await repository.findGameByCode(code);

        if (!game) {
            return res.status(404).json({ error: "Partie introuvable" });
        }
        // erreur si on essaye de join la game qui n'est plus dans le lobby, aka game en cours ou game finie
        if (game.state !== "lobby") {
            return res.status(409).json({ error: "Impossible de rejoindre une partie en cours ou terminée" });
        }
        // erreur si qqun veut join la game qu'il vient de créer lui meme
        if (game.creator_id === playerId) {
            return res.status(409).json({ error: "Impossible de rejoindre la partie que vous avez créée" });
        }
        if (game.joiner_id !== null) {
            return res.status(409).json({ error: "Impossible de rejoindre la partie, deux joueurs sont déjà connectés" });
        }

        const { rows } = await repository.pool.query(
            `UPDATE game
             SET joiner_id = $1, state = 'en cours'
             WHERE code = $2 AND state = 'lobby' AND joiner_id IS NULL
             RETURNING *`,
            [playerId, code]
        );

        if (rows.length === 0) {
            return res.status(409).json({ error: "La partie vient d'être rejointe par un autre joueur" });
        }

        return res.status(200).json({ game: rows[0] });
    }
      catch (error) {
        console.error("Erreur dans POST /games/join", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
})

router.get('/history', async (req, res) => {
  try {
    const games = await repository.findHistoryGames();
    return res.json({ games });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des parties' });
  }
});

router.get('/history/:id', async (req, res) => {
  const gameId = req.params.id;

  try {
    const game = await repository.pool.query('SELECT * FROM history_games WHERE id = $1', [gameId]);

    if (game.rows.length === 0) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }
    return res.json({ game: game.rows[0] });
  }
  catch (error) {
    console.error("Erreur dans GET /games/history/:id", error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/result', checkAuth, async (req, res) => {
  const { result, endedBy, winnerId = null, player1Id = req.user.id, player2Id = null } = req.body;
  const allowedResults = ['Victoire', 'Défaite', 'Nulle', 'Abandon'];
  const allowedEndReasons = ['checkmate', 'forfeit', 'draw', 'stalemate'];

  if (!allowedResults.includes(result) || !allowedEndReasons.includes(endedBy)) {
    return res.status(400).json({ error: 'Résultat de partie invalide' });
  }

  try {
    const game = await repository.createGameResult(result, endedBy, winnerId, player1Id, player2Id);

    return res.status(201).json({
      game: {
        ...game,
        message: endedBy === 'forfeit'
          ? 'Vous avez abandonné la partie.'
          : `La partie est terminée: ${result}.`,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de l’enregistrement de la partie' });
  }
});

export default router;
