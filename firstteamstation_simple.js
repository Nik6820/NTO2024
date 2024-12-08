'use strict';
var transmitter;
var receiver;

function setup() 
{
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
}
function loop() 
{
  let packet = receiver.receive(20);
  let sym = 0;
  for (let i = 0; i < 20; i++) 
  {
    sym = sym + packet[i];
  }
  packet =[...packet, sym, sym, sym]
  
  transmitter.transmit(new Uint8Array(packet));
}
