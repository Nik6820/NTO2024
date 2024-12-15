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
var buf = new Array()

function setup() 
{
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
}

function loop() 
{
    let received = new Uint8Array(receiver.receive(80));
    buf = buf.concat(bitsToBytes(received));
    let packet = new Uint8Array(buf.splice(0,10))//параша с количеством бит
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
var buf = new Array()

function setup() 
{
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
}
function loop() 
{
  let received = new Uint8Array(receiver.receive(80));//параша с количеством
  let decoded = decode(received);
  buf = buf.concat(bitsToBytes(decoded));//конкатенация массивов в фотку
  transmitter.transmit(new Uint8Array(buf.splice(0,10)));
}


// бабааааах
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
var buf = new Array()

function setup() 
{
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
  // storage = spacecraft.devices[4].functions[0];
}

function loop() 
{
  let received = new Uint8Array(receiver.receive(80)); // в научном тут штука с камеры))))
  buf = buf.concat(bitsToBytes(received));
  transmitter.transmit(new Uint8Array(buf.splice(0,10)));
}
