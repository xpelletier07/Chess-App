// barrel export file
// juste dropper toutes vos fonctions dans ce fichier et call repository.fonction() dans les routes
// si besoin voir /routes/games.js pour exemple

export { pool } from "./db.js"

export {
    createGame,
    findGameByCode, 
    getGameStatus,
    startGame,
    forfeitGame,
    joinGame, 
    changeGameState,
    findHistoryGames,
    createGameResult
} from "./gameRepository.js"
// Le classement et les résultats partagent le dépôt des données associées aux parties.
export { finishGame, getLeaderboard } from "./rankingRepository.js"
export {
    createUser,
    findUserByEmail,
    findUserByEmailOrUsername,
    userEmailExists
} from "./userRepository.js"
