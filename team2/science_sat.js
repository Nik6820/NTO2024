'use strict';


var storage;
var sun_sensor;
var camera;
var transmitter;
let count == 0;

function zip(picture) {
    let buffer = new ArrayBuffer();
    for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
            let a1 = picture[j*2+i*80];
            let a2 = picture[j*2+i*80+1];
            let a3 = picture[j*2+i*80+40];
            let a4 = picture[j*2+i*80+41];
            buffer.push(Math.round((a1+a2+a3+a4)/4));
        }
    }
    return new Uint8Array(buffer);
}

function tofloat32(floatValue) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);

    // Записываем значение float в little-endian формат
    view.setFloat32(0, floatValue, true); // true для little-endian

    // Возвращаем массив из 4 байт
    return new Uint8Array(view.buffer);
}

function toint32(sensorData) {
    // Проверяем, что входной параметр n соответствует ожидаемому размеру
    // Создаем новый DataView из Uint8Array
    const view = new DataView(sensorData.buffer);

    // Читаем первые 8 байт (координату X) в little-endian формате
    const x = view.getInt32(0, true);

    // Читаем последние 8 байт (координату Y) в little-endian формате
    const y = view.getInt32(8, true);

    // Возвращаем результат как массив из двух чисел
    return [x, y];
}

function calculateSunDirection(xPixel, yPixel) {
    const WidthMM = 22.3;
    const HeightMM = 14.9;
    const SizeMM = 0.025;
    const Z = 5; 

    const xCentreMM = xPixel * SizeMM - HeightMM/2;
    const yCentreMM = yPixel * SizeMM - WidthMM/2;

    const distance = Math.sqrt(xCentreMM * xCentreMM + yCentreMM * yCentreMM + Z * Z);
    
    const x = xCentreMM / distance;
    const y = yCentreMM / distance;
    const z = -Z / distance;
  
    //return [x.toFixed(3) * 1, y.toFixed(3) * 1, z.toFixed(3) * 1];
    return Math.acos(z)*180/Math.PI;
  }


function setup() {
    transmitter = spacecraft.devices[0].functions[0];
    camera = spacecraft.devices[2].functions[0];
    sun_sensor = spacecraft.devices[3].functions[0];
    storage = spacecraft.devices[4].functions[0];    
}

let photos = new Array();
const time1 = 1800;
const time2 = 4500;
const per = 2*3600 +4*60 +20;
var times = [[21395, 22825], [43225б 44450], [65305, 65920]]; 
let count = 0;

function loop() {
    let time = spacecraft.flight_time;
    if (time%per>time1 && time%per<time2){
        let data_sensor = new Uint8Array(sun_sensor.read(16));
        let vec_sens = toint32(data_sensor);
        if (vec_sens[0] != -1 && vec_sens[1] != -1){
            let angle = calculateSunDirection(vec_sens[0],vec_sens[1]);
            if (180-angle <= 15){
                pic = camera.read(1600);
                zippic = zip(pic); // сжатая картинка камеры
                angle32 = tofloat32(angle);
                let data = new Uint8Array([...zippic, ...angle32]);
                storage.write(data);
                photos.push(zippic); // -- по формату Uint8Array
            }
        }
    }

    let trans = false;
    for (let i = 0; i < 3; i++) {
        if (time > times[i][0] && time < times[i][1]) {
            trans = times[i][1] - times[i][0]
            break
        }
    }  
    if (trans) {
        count += 1;
        if (count*401/100 < trans) {
            transmitter.transmit([127, 127, 127, 127, 127, 127, 127, 127, 127, 127, ...photos.pop()]);
        }
    }
    else {
        count = 0;
    }
}

