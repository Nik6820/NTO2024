'use strict';


var storage;
var sun_sensor;
var camera;
var transmitter;
var receiver;



function calculateSunDirection(xPixel, yPixel) {
    if (xPixel === -1 && yPixel === -1) {
      return [0, 0, 0]; 
    }
    const WidthMM = 22.3;
    const HeightMM = 14.9;
    const SizeMM = 0.025;
    const Z = 5; 
  

    const xCentreMM = (xPixel - 0.5) * SizeMM - HeightMM/2;
    const yCentreMM = (yPixel - 0.5) * SizeMM - WidthMM/2;
  
  

    const distance = Math.sqrt(xCentreMM * xCentreMM + yCentreMM * yCentreMM + Z * Z);
    
    if (distance === 0) {
      return [0, 0, 0];
    }
  

    const x = xCentreMM / distance;
    const y = yCentreMM / distance;
    const z = -Z / distance;
  
    //return [x.toFixed(3) * 1, y.toFixed(3) * 1, z.toFixed(3) * 1];
  return Math.acos(z)*180/Math.PI;
  }


  //Debug
  //const xPixel = 117;
  //const yPixel = 351;
  //const sunDirection = calculateSunDirection(xPixel, yPixel);
  //console.log("Вектор направления на Солнце:", sunDirection);
  //console.log("Угол с Oz:", anglesensor(sunDirection))

function setup() {
    transmitter = spacecraft.devices[0].functions[0];
    receiver = spacecraft.devices[1].functions[0];
    camera = spacecraft.devices[2].functions[0];
    sun_sensor = spacecraft.devices[3].functions[0];
    storage = spacecraft.devices[4].functions[0];    
}
 
function loop() {    
    let data_sensor=sun_sensor.read(16);
  // перевод из сырых данных в норм
  // let vec_sens=Arr8toint64
  if (vec_sens[0]!==-1 && vec_sens[1]!==-1){
    let angle = calculateSunDirection(vec_sens[0],vec_sens[1]);
    if (180-angle<=15){
      pic=camera.read(1600);
      //сжатие фото
      zippic = zip(pic);
      //перевод угла в FLOAT32
      angle32=todataangle(angle);
      let data = new Uint8Array([...zippic, ...angle32]);
      storage.write(data);
    }
  }
  if (){//на сближение
    pack=storage.pop();//в storage одним массивом все хранится, или разделено на полученные сообщения?
  transmitter.transmit (pack);
  
  }
}

