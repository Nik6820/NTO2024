var transmitter;
var receiver;
let count=0;
let trans = new Uint8Array(24);
let num=0;

function setup() 
{
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
}
function loop() 
{
  let packet = receiver.receive(20);
  if (count%3 === 0)
  {
    let trans=packet;
    num += 1
    trans[20] = count%3;
    trans[21] = count%3;
    trans[22] = num;
    trans[23] = num;
  }
  transmitter.transmit(trans);
  count = count + 1;
}
