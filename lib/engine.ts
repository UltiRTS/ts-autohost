import fs from "fs";
import EventEmitter from "events";
import {ChildProcess, ChildProcessWithoutNullStreams, spawn} from 'child_process';

export interface Player {
    index: number;
    isAI: boolean;
    isChicken: boolean;
    isSpectator: boolean;
    team: number;
}

class OptionFactory {
  header = '';
  option = '';
  constructor(header: string) {
    this.header = '['+ header + ']';
    this.option = '';
  }

  addFromDict(dict: {[key: string]: string | number}) {
    for (const [k, v] of Object.entries(dict)) {
      this.option += String(k) + '=' + String(v) + ';\n';
    }
  }

  addFromInstance(ins: OptionFactory) {
    this.option += '\n' + ins.toString() + '\n';
  }

  toString() {
    return this.header + '\n{\n' + this.option + '}';
  }
}

export class EngineBridger extends EventEmitter {
  startDir: string = ''
  teamPtr: number
  cmds: string[]
  hostPort: number = 0;
  battlePort: number = 0
  players: {[key: string]: Player} = {};
  numTeams: number = 0
  engine: ChildProcess | null = null;
  
  constructor(startDir: string, cmds: Array<string>) {
    super();
    this.teamPtr = 0;
    if (startDir === '' || startDir === undefined) startDir = process.cwd();
    else this.startDir = startDir;
    this.cmds = cmds;
  }

  scriptGen(hostPort: number, battlePort: number, players: {[key:string]: Player}, numTeams: number, mapName: string, aiHosters: number[], mod: string = 'mod.sdd', modoptions: {[key:string]: string | number}) {
    this.hostPort = hostPort;
    this.battlePort = battlePort;
    this.players = players;
    this.numTeams = numTeams;
    // TODO: unit sync

    const game = new OptionFactory('GAME');
    game.addFromDict({
      Mapname: mapName, // TODO unit sync
    });


    const defaultLeader = 0;
    // player gen
    Object.keys(this.players).forEach((id) => {
      if (this.players[id]['isAI'] || this.players[id]['isChicken']) return;

      const pl = new OptionFactory('PLAYER' +
       String(this.players[id]['index']),
      );
      if (this.players[id]['isSpectator']) {
        pl.addFromDict({
          Name: id,
          Spectator: 1,
          Team: this.players[id]['index'],
          CountryCode: '??',
          Rank: 0,
          defaultLeader,
          Skill: '(10)',
        });
      } else {
        pl.addFromDict({
          Name: id,
          Spectator: 0,
          Team: this.players[id]['index'],
          CountryCode: '??',
          Rank: 0,
          Skill: '(10)',
        });
      }

      game.addFromInstance(pl);
    });


    // AI and Chicken


    const aiHosterLen = aiHosters.length;
    let AI = 0;
    Object.keys(this.players).forEach((id)=>{
      if (this.players[id]['isAI']) {
        const ai = new OptionFactory('AI' + this.players[id]['index']);
        ai.addFromDict({
          ShortName: 'GPT4o',
          Name: 'GPT4o',
          Team: this.players[id]['index'],
          Host: aiHosters[AI % aiHosterLen] || 0,
        });
        game.addFromInstance(ai);
        AI++;
      } else if (this.players[id]['isChicken']) {
        const ai = new OptionFactory('AI' + this.players[id]['index']);
        ai.addFromDict({
          ShortName: 'Chicken: Suicidal',
          Name: 'Chicken -- Infected Creatures',
          Team: this.players[id]['index'],
          Host: aiHosters[AI % aiHosterLen] || 0,
        });
        game.addFromInstance(ai);
        AI++;
      }
    });

    // team gen
    Object.keys(this.players).forEach((id)=>{
      if (this.players[id]['isAI'] ||
      this.players[id]['isChicken'] ||
      this.players[id]['isSpectator']) {
        const team = new OptionFactory('TEAM' + this.teamPtr);
        team.addFromDict({
          AllyTeam: this.players[id]['team'],
          Side: 'Arm',
          Handicap: 0,
          TeamLeader: aiHosters[0],
        });
        game.addFromInstance(team);
      } else {
        const team = new OptionFactory('TEAM' + this.teamPtr);
        team.addFromDict({
          AllyTeam: this.players[id]['team'],
          Side: 'Arm',
          Handicap: 0,
          // the player themselves is the team leader
          TeamLeader: this.players[id]['index'],
        });
        game.addFromInstance(team);
      }

      this.teamPtr++;
    });

    this.teamPtr = 0;

    // team gen
    while (this.teamPtr < this.numTeams) {
      const allyTeam = new OptionFactory('ALLYTEAM' + this.teamPtr);
      allyTeam.addFromDict({NumAllies: 0});
      game.addFromInstance(allyTeam);
      this.teamPtr++;
    }

    this.teamPtr = 0;

    // NON-user set SETTINGS ARE OUT OF INTERPETER LOOP
    // GAME SELECTOR MODULE

    console.log('game type is zk');
    // game.addFromDict({GameType: 'mod.sdd'});
    game.addFromDict({GameType: mod});


    // startposi selector MODULE
    console.log('start position is   startpostype=2;');
    game.addFromDict({startpostype: 2});

    // autohost ident MODULE
    game.addFromDict({'hosttype': 'SPADS'});
    console.log('autohost is   hosttype=SPADS;');

    // autohost ip MODULE
    // Force ipv4
    game.addFromDict({'HostIP': '0.0.0.0'});
    console.log('AUTOHOST IP is HostIP=;');

    // host port MODULE
    game.addFromDict({'HostPort': this.battlePort});
    console.log('HOST port is '+this.battlePort);

    // autohost usr MODULE
    game.addFromDict({
      AutoHostName: 'GGFrog',
      AutoHostCountryCode: '??',
      AutoHostRank: 0,
      AutoHostAccountId: 1024,
      IsHost: 1,
    });

    // autohost port
    game.addFromDict({
      AutoHostPort: this.hostPort,
    });
    console.log('AUTOHOST port is ', this.hostPort);

    // restriction gen
    console.log('AUTOHOST NumRestriction=0;');
    game.addFromDict({NumRestriction: 0});

    const restrict = new OptionFactory('RESTRICT');
    game.addFromInstance(restrict);

    // MOD OPTION
    const modeoptions = new OptionFactory('MODEOPTIONS');
    modeoptions.addFromDict(modoptions)
    game.addFromInstance(modeoptions);

    // MAP OPTIOn
    const mapop = new OptionFactory('MAPOPTIONS');
    game.addFromInstance(mapop);
    console.log("game.toString() = ", game.toString())
    fs.writeFileSync('/tmp/battle' + this.battlePort + '.txt', game.toString());
  }

  /**
   * @description launch game
   */
  launchGame() {
    // maybe need to add a emiter
    this.engine =
      spawn('engine/spring-dedicated',
          ['/tmp/battle' + this.battlePort + '.txt'], {
            stdio: 'inherit',
          });

    if(this.engine === null) {
        return false;
    } else {
        if(this.engine.stdout) {
            this.engine.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
            })
        }

        if(this.engine.stderr) {
            this.engine.stderr.on('data', (data) => {
                console.log(`stdout: ${data}`);
            })
        }

        this.engine.on('error', (error) => {
          console.error(`error: ${error.message}`);
        });

        this.engine.on('close', (code) => {
          console.log(`child process exited with code ${code}`);
          this.emit('engineShutdown');
        });

        return true;
    }
  }
}

module.exports = {
  OptionFactory,
  EngineBridger,
};
