
import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db.js';


const { pool } = db;

export const router = express.Router();




router.get('/api/history', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'La base de données est indisponible' });

  try {
    const { rows } = await pool.query('SELECT * FROM history_games ORDER BY created_at DESC');
    return res.json({ games: rows });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des parties' });
  } 
});



router.post('/api/games/result', async (req, res) => {
  const { result, endedBy, winnerId = null } = req.body;
  const allowedResults = ['Victoire', 'Défaite', 'Nulle', 'Abandon'];
  const allowedEndReasons = ['checkmate', 'forfeit', 'draw', 'stalemate'];

  if (!pool) return res.status(503).json({ error: 'La base de données est indisponible' });
  if (!allowedResults.includes(result) || !allowedEndReasons.includes(endedBy)) {
    return res.status(400).json({ error: 'Résultat de partie invalide' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO history_games (winner_id, result, ended_by)
       VALUES ($1, $2, $3)
       RETURNING id, result, ended_by, created_at`,
      [winnerId, result, endedBy],
    );

    return res.status(201).json({
      game: {
        ...rows[0],
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