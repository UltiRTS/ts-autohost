import dgram from 'dgram';
import EventEmitter from 'events';

export class EngineListener extends EventEmitter {
    leaveReason: {[key: number]: string} = {
      0: 'lost connection',
      1: 'left',
      2: 'kicked',
    }
    chatMapping: {[key: string]: string} = {
      127: 'toAllies',
      126: 'toSpectators',
      125: 'toEveryone',
    };
    readyMapping: {[key: string]: string} = {
      0: 'not ready',
      1: 'ready',
      2: 'state not changed',
    };
    server: dgram.Socket | null = null;
    port: number = 0

  constructor(port: number) {
    super();
    this.port = port;
    this.server = dgram.createSocket('udp4');
    this.server.on('error', (err) => {
      console.log(`server error:\n${err.stack}`);
    });

    this.server.on('message', (msg, rinfo) => {
      // parse msg into action and parameter,
      // emit back to hoster using eventEmitter
      // console.log('===============');
      // console.log(msg.length);
      let playerNumber;
      switch (msg[0]) {
        case 0:
          // console.log('server has started');
          this.emit('engineMsg', {
            action: 'serverStarted',
            parameters: {},
          });
          break;
        case 1:
          // console.log('server is about to exit');
          this.emit('engineMsg', {
            action: 'serverEnding',
            parameters: {},
          });
          break;
        case 2:
          console.log('game started ++++');
          this.emit('engineMsg', {
            action: 'gameStarted',
            parameters: {},
          });
          break;
        case 3:
          // console.log('game ended');
          break;
        case 4:
          // console.log('information msg');
          const info = msg.slice(1, msg.length).toString('ascii');
          this.emit('engineMsg', {
            action: 'info',
            parameters: {
              info,
            },
          });
          break;
        case 5:
          // console.log('warning msg');
          const warning = msg.slice(1, msg.length).toString('ascii');
          this.emit('engineMsg', {
            action: 'warning',
            parameters: {
              warning,
            },
          });
          break;
        case 10:
          // console.log('join game');
          playerNumber = msg[1];
          const playerName = msg.slice(2, msg.length).toString('ascii');
          this.emit('engineMsg', {
            action: 'joinGame',
            parameters: {
              playerNumber,
              playerName,
            },
          });
          break;
        case 11:
          // console.log('leave game');
          playerNumber = msg[1];
          const leaveReason = msg[2];
          this.emit('engineMsg', {
            action: 'leaveGame',
            parameters: {
              playerNumber,
              leaveReason: this.leaveReason[leaveReason],
            },
          });
          break;
        case 12:
          // console.log('ready for game');
          playerNumber = msg[1];
          const state = this.readyMapping[msg[2]];
          this.emit('engineMsg', {
            action: 'ready',
            parameters: {
              playerNumber,
              state,
            },
          });
          break;
        case 13:
          // console.log('chat msg');
          playerNumber = msg[1];
          const destination = this.chatMapping[msg[2]];
          const text = msg.slice(3, msg.length).toString('ascii');
          this.emit('engineMsg', {
            action: 'chat',
            parameters: {
              playerNumber,
              destination,
              text,
            },
          });
          break;
        case 14:
          // console.log('defeat msg');
          playerNumber = msg[1];
          this.emit('engineMsg', {
            action: 'defeat',
            parameters: {
              playerNumber,
            },
          });
          break;
        case 20:
          // console.log('lua script msg');
          break;
      }
    });

    this.server.on('listening', () => {
        if(this.server === null) return;

        const address = this.server.address();
        console.log(`Engine autohost server listening at: 
            ${address.address}:${address.port}`);
        this.emit('autohostMsg', {
            action: 'autohostStarted',
            parameters: {},
        });
    });
    this.server.on('close', () => {
        console.log('Engine autohost server closed');
    });

    this.server.bind(port);
    console.log(`server bound to port ${port}`);
  }

  send2springEngine(things2send: string) {
    if(this.server === null) return;

    this.server.send(things2send);
  }

  midJoin(parameters: {[key: string]: any}) {
    if(this.server === null) return;

    const playerName = parameters.playerName;
    const isSpec = parameters.isSpec;
    const token = parameters.token;
    const team = parameters.team;

    const addr = this.server.address();

    this.server.send('/adduser ' +
      playerName + ' ' + token + ' ' + isSpec + ' ' + team, addr.port, addr.family);
  }

  close() {
    if(this.server === null) return;

    this.server.close();
  }
}