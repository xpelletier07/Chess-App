// barrel export file
// juste dropper toutes vos fonctions dans ce fichier et call repository.fonction() dans les routes
// si besoin voir /routes/joinGame.js pour exemple

export { pool } from "./db.js"

export { createGame, findGameByCode } from "./gameRepository.js"
export { saveMove, setGameState } from "./playRepository.js"
export {
    createUser,
    findUserByEmail,
    findUserByEmailOrUsername,
    userEmailExists
} from "./userRepository.js"
