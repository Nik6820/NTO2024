let transmitter;
let receiver;

function setup() {
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
  let count=0;
}
function loop() {
    let packet = receiver.receive(20);
        // Место для обработки сообщения
  if (count%3 === 0){
    transmitter.transmit(packet);
  }
}
