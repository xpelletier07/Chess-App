// Le coefficient K règle l'importance de chaque résultat sur la cote (la cote initiale de 1000 est définie dans db.sql).
const K_FACTOR = 20
// L'application limite les cotes pour empêcher qu'elles sortent de la plage prévue.
const MIN_ELO = 100
const MAX_ELO = 3000

// Estime la probabilité que le joueur obtienne le score maximal contre son adversaire; un adversaire mieux coté réduit cette probabilité.
export function expectedScore(playerElo, opponentElo) {
    return 1 / (1 + 10 ** ((opponentElo - playerElo) / 400))
}

// Calcule la nouvelle cote à partir du score obtenu et du score attendu; un résultat supérieur aux attentes augmente l'Elo.
export function calculateNewElo(elo, score, expected) {
    const rounded = Math.round(elo + K_FACTOR * (score - expected))
    return Math.max(MIN_ELO, Math.min(MAX_ELO, rounded))
}

// Calcule les nouvelles cotes des deux joueurs d'une partie; winnerId null signifie une nulle.
export function calculateGameRatings(player1, player2, winnerId) {
    // Une victoire vaut 1, une nulle 0,5 et une défaite 0 pour le joueur 1.
    const score1 = winnerId == null ? 0.5 : Number(winnerId) === Number(player1.id) ? 1 : 0
    // Les scores sont complémentaires: leur somme vaut toujours 1.
    const score2 = 1 - score1
    // Les deux attentes utilisent les cotes d'avant la partie.
    return {
        elo1: calculateNewElo(player1.elo, score1, expectedScore(player1.elo, player2.elo)),
        elo2: calculateNewElo(player2.elo, score2, expectedScore(player2.elo, player1.elo))
    }
}

// Ajoute le rang à des joueurs lus de la base (cote stockée dans users.elo).
export function rankPlayers(players) {
    return players
        // Trie par cote décroissante; le nom rend l'ordre déterministe en cas d'égalité.
        .sort((a, b) => b.elo - a.elo || a.username.localeCompare(b.username))
        // Ajoute la position après le tri pour que le rang corresponde à l'ordre affiché.
        .map((player, index) => ({ rank: index + 1, ...player }))
}
