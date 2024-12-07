var transmitter;
var receiver;
var count=0;
var trans = new Uint8Array(26);
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
    for (i in packet) 
    {
      trans[i] = packet[i];
    }
    num += 1
  }
  trans[20] = trans[21] = trans[22] = count%3;
  trans[23] = trans[24] = trans[25] = num;  
  count = count + 1;
  transmitter.transmit(trans);
}
