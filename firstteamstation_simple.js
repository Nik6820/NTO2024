var transmitter;
var receiver;
var count=0;
var trans = new Uint8Array(24);
var num=0;

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
    for (i in packet) {
      trans[i] = packet[i];
    }
    num += 1
    trans[20] = trans[21] = count%3;
    trans[22] = trans[23] = num;
  }
  
  count = count + 1;
  transmitter.transmit(trans);
}
