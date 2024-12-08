'use strict';
var transmitter;
var receiver;
var trans = new Uint8Array(23);

function setup() 
{
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
}
function loop() 
{
  let packet = receiver.receive(20);
  let sym = 0;
  for (let i = 0, i < 20, i++) 
  {
    trans[i] = packet[i];
    sym = sym + packet[i];
  }
  trans[20] = trans[21] = trans[22] = sym;
  
  transmitter.transmit(trans);
}
