import { Server } from "socket.io"
import * as repository from './repository/repository.js'

export function attachRealtime(server) {
    const io = new Server(server, {
        cors: { origin: process.env.CLIENT_URL || true },
    });
    return io;
}

function 

export default attachRealtime