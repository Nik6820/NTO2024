// ретранслятор
'use strict';

function encode(bytes) {
    // encode - РС или Хемминг
}
var lencod = 0 // количество символов на кодировку

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
var desynch = true
var times = [[39679, 39929], [45305, 45669], [51009, 51382], [56724, 57090], [62454, 62736], [479, 783], [6195, 6486], [29499, 29740], [35171, 35502], [8797, 9167], [37837, 38188], [43639, 43771]] 


function setup() 
{
    transmitter = spacecraft.devices[0].functions[0];
    receiver = spacecraft.devices[1].functions[0];
}

function loop() 
{
    let received = new Uint8Array(receiver.receive(80));
    buf = buf.concat(bitsToBytes(received));
    
    let trans = false
    for (let i = 0; i < 12; i++) {
        if (time > times[i][0] && time < times[i][1]) {
            trans = times[i][1] - times[i][0]
            break
        }
    }  
    if (trans) {
        count += 1
        if (buf.length >= 3207 && count*symbs/100 < trans) {
            let packet = encode(buf.splice(0,400), nsym) // мб сначала надо будет найти старт сообщения
            transmitter.transmit(bitsToBytes(packet));
        }
    }
    else {
        count = 0
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
var lencod = 0 // количество символов на кодировку

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
    let decoded = decode(received);
    buf = buf.concat(bitsToBytes(decoded)); //конкатенация массивов в фотку, если там РС - убрать битс ту байтс
    transmitter.transmit(new Uint8Array(buf.splice(0,10))); // мы в очке?? В зависимости от ответа орбиты выводим разное. Мб 400 байт за раз.
}


// ScienceSat - записан
// 'use strict';

// var transmitter;
// var buf = new Array()

// function setup() 
// {
//     transmitter = spacecraft.devices[0].functions[0];
// }

// function loop() 
// {
//     let received = new Uint8Array(receiver.receive(80)); // в научном тут штука с камеры))))
//     buf = buf.concat(bitsToBytes(received));
//     transmitter.transmit(new Uint8Array(buf.splice(0,10)));
// }
