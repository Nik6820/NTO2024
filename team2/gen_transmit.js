// ретранслятор
'use strict';

function encode(bytes) {
    // encode - РС или Хемминг
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
var time = 0

function setup() 
{
    transmitter = spacecraft.devices[0].functions[0];
    receiver = spacecraft.devices[1].functions[0];
}

function loop() 
{
    let received = new Uint8Array(receiver.receive(80));
    buf = buf.concat(bitsToBytes(received));
    if (buf.length >= 3200) { // мб проверка времени - зависит от орбиты
        let packet = encode(buf.splice(0,400)) 
        transmitter.transmit(bitsToBytes(packet));
    }
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
    // decode - если РС, аргумент поменять на байты!
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
    let received = new Uint8Array(receiver.receive(80)); //количество! зависит от кода (хемминг/РС)
    let decoded = decode(received);
    buf = buf.concat(bitsToBytes(decoded)); //конкатенация массивов в фотку, если там РС - убрать битс ту байтс
    transmitter.transmit(new Uint8Array(buf.splice(0,10))); // мы в очке?? В зависимости от ответа орбиты выводим разное. Мб 400 байт за раз.
}


// ScienceSat
'use strict';

var transmitter;
var buf = new Array()

function setup() 
{
    transmitter = spacecraft.devices[0].functions[0];
}

function loop() 
{
    let received = new Uint8Array(receiver.receive(80)); // в научном тут штука с камеры))))
    buf = buf.concat(bitsToBytes(received));
    transmitter.transmit(new Uint8Array(buf.splice(0,10)));
}
