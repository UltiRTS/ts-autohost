import {ChildProcess, spawn} from 'child_process'
import fs from 'fs'

export class AIHoster {
    hostPort: number;
    aiHoster: ChildProcess | null = null;
    script: string = '';

  constructor(hostIP: string, hostPort: number, playerName: string, engineToken: string) {
    this.hostPort = hostPort;
    this.aiHoster = null;
    this.script = `[GAME]{

        HostIP=${hostIP};
        HostPort=${hostPort};
        MyPlayerName=${playerName};
        MyPasswd=${engineToken};
        IsHost=0;
    }`;
    console.log('creating');
  }

  /**
   */
  scripGenNStart() {
    console.log('generating script');
    const scriptPath = `/tmp/aiHoster${this.hostPort}.txt`;
    fs.writeFileSync(scriptPath, this.script);

    this.aiHoster = spawn('engine/spring-headless', [scriptPath]);

    if(this.aiHoster.stdout) {
        this.aiHoster.stdout.on('data', (data) => {
        console.log(`aiHoster stdout: ${data}`);
        });
    }
    if(this.aiHoster.stderr) {
        this.aiHoster.stderr.on('data', (data) => {
        console.log(`aiHoster stdout: ${data}`);
        });
    }

    this.aiHoster.on('error', (error) => {
      console.log(`aiHoster error: ${error}`);
    });
    this.aiHoster.on('close', (code) => {
      console.log(`aiHoster close: ${code}`);
    });
  }
}