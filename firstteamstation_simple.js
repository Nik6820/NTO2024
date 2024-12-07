let transmitter;
let receiver;

function setup() {
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
  let count=0;
  let trans = new Uint8Array(20);
}
function loop() {
  let packet = receiver.receive(20);
  if (count%3 === 0){
    let trans=packet;
  }
  transmitter.transmit(trans);
  count = count + 1;
}
