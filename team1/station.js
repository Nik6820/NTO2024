// ретранслятор
'use strict';

function bitsToBytes(bits) {

    let byteArray = new Array(Math.ceil(bits.length / 8));
    for (let i = 0; i < bits.length; i++) {
        byteArray[Math.floor(i / 8)] |= bits[i] << (7 - (i % 8));
    }
    return byteArray;
}

var transmitter;
var receiver;
// var storage;

var buffer = new Array()

function setup() 
{
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
  // storage = spacecraft.devices[4].functions[0];
}
function loop() 
{
  let received = new Uint8Array(receiver.receive(80)); // в научном тут штука с камеры))))
  // let decoded = decode(received);
  // let packet = bitsToBytes(decoded);
  buf = buf.concat(bitsToBytes(received));
  transmitter.transmit(new Uint8Array(buffer.splice(0,8)));
}


// станция
'use strict';

function bitsToBytes(bits) {

    let byteArray = new Array(Math.ceil(bits.length / 8));
    for (let i = 0; i < bits.length; i++) {
        byteArray[Math.floor(i / 8)] |= bits[i] << (7 - (i % 8));
    }
    return byteArray;
}

var transmitter;
var receiver;
// var storage;

var buffer = new Array()

function setup() 
{
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
  // storage = spacecraft.devices[4].functions[0];
}
function loop() 
{
  let received = new Uint8Array(receiver.receive(80)); // в научном тут штука с камеры))))
  // let decoded = decode(received);
  // let packet = bitsToBytes(decoded);
  buf = buf.concat(bitsToBytes(received));
  transmitter.transmit(new Uint8Array(buffer.splice(0,8)));
}
