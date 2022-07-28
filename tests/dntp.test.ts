import {DntpCommunicator} from '../lib/dntp';
import {downloadMap} from '../lib/network';

const main = async () => {

    const dntp = new DntpCommunicator('http://144.126.145.172:3000', 'engine/maps');
    const info = await dntp.getMapUrlById('3')
    console.log(info)

    const res = await downloadMap(info, 'engine/maps')
    console.log(res)
}

main();