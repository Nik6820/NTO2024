'use strict';
var transmitter;
var receiver;
function sumUint8Array(arr) {
    return arr.reduce((sum, val) => sum + val, 0);
}

function setup() 
{
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
}
function loop() 
{
  let packet = receiver.receive(20);
  if (packet.length===20)
  {
    let sym=sumUint8Array(packet);
    packet=Array.from(packet);
    packet.push(sym);
    transmitter.transmit(new Uint8Array(packet));
  }
}
