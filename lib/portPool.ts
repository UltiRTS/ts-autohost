/** @format */
type PortMappings = { [key: string]: number };
interface PortPoolOpts {
  numPorts?: number;
  startPort?: number;
}
class PortPool {
  portMapping: PortMappings = {};
  freedPorts: number[] = [];
  startPort: number = 3000;
  numPorts: number = 1000;
  constructor(opts: PortPoolOpts) {
    this.startPort = opts.startPort || this.startPort;
    this.numPorts = opts.numPorts || this.numPorts;
  }
  /**
   * Get a new port for the given id, if the id has already been allocated,
   * return the same port
   * @param id: string
   * @returns number the allocated port
   *
   */
  getPort(id: string): number {
    // check if the id has already been allocated
    const port = this.portMapping[id];
    if (port) {
      return port;
    }
    if (Object.keys(this.portMapping).length >= this.numPorts) {
      throw new Error(
        `Maximum number of ports allocated: ${this.numPorts}. Cannot allocate more ports`
      );
    }

    // if not, allocate a new port
    // first check if there are any freed ports
    // use those ports first
    // if there are no freed ports, allocate a new port
    // based on the number of ports already allocated
    let newPort;
    if (this.freedPorts.length > 0) {
      newPort = this.freedPorts.pop()!;
    } else {
      newPort = this.startPort + Object.keys(this.portMapping).length;
    }
    this.portMapping[id] = newPort;
    return newPort;
  }
  /**
   * Get the offset of the given id from the start port
   * @param id: string
   * @returns number the offset of the id from the start port
   *
   */
  getOffset(id: string) {
    const newPort = this.getPort(id);
    return newPort - this.startPort;
  }

  /**
   * Free the port allocated for the given id
   * @param id: string
   */
  freePort(id: string) {
    const port = this.portMapping[id];
    if (port) {
      delete this.portMapping[id];
      this.freedPorts.push(port);
    }
  }
}

export default PortPool;
