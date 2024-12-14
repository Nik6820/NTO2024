// ретранслятор
'use strict';

function encode(bytes) {
    // encode
}

function bitsToBytes(bits) {
    let byteArray = new Array(Math.ceil(bits.length / 8));
    for (let i = 0; i < bits.length; i++) {
        byteArray[Math.floor(i / 8)] |= bits[i] << (7 - (i % 8));
    }
    return byteArray;
}

var transmitter;
var receiver;
var buffer = new Array()

function setup() 
{
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
}

function loop() 
{
    let received = new Uint8Array(receiver.receive(80));
    buffer = buffer.concat(bitsToBytes(received));
    let packet = new Uint8Array(buffer.splice(0,10))
    transmitter.transmit(encode(packet));
}


/////////////////// станция /////////////////////
'use strict';

function bitsToBytes(bits) {
    let byteArray = new Array(Math.ceil(bits.length / 8));
    for (let i = 0; i < bits.length; i++) {
        byteArray[Math.floor(i / 8)] |= bits[i] << (7 - (i % 8));
    }
    return byteArray;
}

function decode(bits) {
    // decode
}

var transmitter;
var receiver;
var buffer = new Array()

function setup() 
{
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
}
function loop() 
{
  let received = new Uint8Array(receiver.receive(80));
  let decoded = decode(received);
  buffer = buffer.concat(bitsToBytes(decoded));
  transmitter.transmit(new Uint8Array(buffer.splice(0,10)));
}


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
  buffer = buffer.concat(bitsToBytes(received));
  transmitter.transmit(new Uint8Array(buffer.splice(0,10)));
}
