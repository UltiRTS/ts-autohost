import { EngineListener } from "./lib/listener";
import { EngineBridger, Player } from "./lib/engine";
import {parentPort} from 'worker_threads'

declare interface StartGameParams {
    id: number,
    title: string,
    mgr: string,
    team: { [key: string]: Player },
    mapId: number,
    aiHosters: number[],
    map: string,
    mod: string
    bettlePortOffset: number,
}

declare interface MidJoinParams {
    id: number
    title: string
    isSpec: boolean
    team: string
    playerName: string
}

let listener: EngineListener | null = null;
let engine: EngineBridger | null = null;

function getAllyTeamCount(parameters: {[key: string]: any}) {
    const teams= new Set();
    // eslint-disable-next-line guard-for-in
    for (const player in parameters.team) {
    teams.add(parameters.team[player].team);
    }
    return teams.size;
}



function startGame(parameters: StartGameParams) {
    const battlePort = 7000 + parameters.battlePortOffset;
    const listenerPort = 3000 + parameters.battlePortOffset;

    listener = new EngineListener(listenerPort);
    engine = new EngineBridger(process.cwd(), [])
    const title = parameters.title;

    engine.on('engineShutdown', () => {
        parentPort?.postMessage({
            action: 'serverEnding',
            parameters: {
                title
            },
        })
        listener?.close();
    })

    listener.on('autohostMsg', (msg: {
        action: string,
        parameters: { [key: string]: any }
    }) => {
        if(msg.action === 'autohostStarted') {
            parameters.aiHosters = [0];
            console.log(parameters.map);
	    console.log("Script GEN: " , msg, battlePort);
            engine?.scriptGen(listenerPort, battlePort, parameters.team, getAllyTeamCount(parameters), parameters.map, parameters.aiHosters, parameters.mod);
            engine?.launchGame()
        }
    })

    listener.on('engineMsg', (msg: {
        action: string,
        parameters: { [key: string]: any }
    }) => {
        console.log(msg);
        // preprocessing
        msg.parameters.title = title;
        switch(msg.action) {
            case 'serverStarted': {
                msg.parameters.port = battlePort;
                console.log(parameters.id);
                msg.parameters.id = parameters.id;
                parentPort?.postMessage(msg);
                break;
            }
            case 'serverEnding': {
                parentPort?.postMessage(msg);
                listener?.close();
                break;
            }
            case 'defeat': {
                parentPort?.postMessage(msg);
                break;
            }
        }

    })
}

function modJoin(parameters: MidJoinParams) {
    console.log(parameters);
    if(listener) {
        listener.midJoin(parameters);
    }
}

parentPort?.on('message', (msg : {
    action: string
    parameters: StartGameParams | MidJoinParams
}) => {

    switch(msg.action) {
        case 'startGame': {
            const parameters = msg.parameters as StartGameParams;
            startGame(parameters);
            break;
        }
        case 'midJoin': {
            const parameters = msg.parameters as MidJoinParams
            modJoin(parameters);
            parentPort?.postMessage({
                action: 'midJoined',
                parameters: {
                    title: parameters.title,
                    player: parameters.playerName,
                }
            })
            break;
        }
        case 'killEngine': {
            const parameters = msg.parameters
            listener?.killBySignal();
            parentPort?.postMessage({
                action: 'killEngineSignalSent',
                parameters: {
                    title: parameters.title,
                }
            })
        }
    }
})


