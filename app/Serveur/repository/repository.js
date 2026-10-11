// barrel export file
// juste dropper toutes vos fonctions dans ce fichier et call repository.fonction() dans les routes
// si besoin voir /routes/games.js pour exemple

export { pool } from "./db.js"

export {
    createGame,
    findGameByCode, 
    joinGame, 
    changeGameState,
    findHistoryGames,
    createGameResult
} from "./gameRepository.js"
export {
    createUser,
    findUserByEmail,
    findUserByEmailOrUsername,
    userEmailExists
} from "./userRepository.js"
