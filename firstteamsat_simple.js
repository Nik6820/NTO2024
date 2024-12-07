var transmitter;
var receiver;
var trans = new Uint8Array(22);

var mess = [new Array(22), new Array(22), new Array(22)];
var buf = new Array();

function setup() 
{
  transmitter = spacecraft.devices[0].functions[0];
  receiver = spacecraft.devices[1].functions[0];
}
function loop() 
{

///// RECIEVE ///////////////////////////
  
  let packet = receiver.receive(26);

  // проверка помех в данных о пакете
  
  if (packet[20] !== packet[21] && packet[20] !== packet[22]) 
  {
    packet[20] = packet[21];
  } 

  if (packet[23] === packet[24] || packet[23] === packet[25]) 
  {
    packet[21] = packet[23];
  } 
  else
  { 
    packet[21] = packet[24];
  }
  // конец проверки
  
  for (i in packet.slice(0, 22)) // сохраняю данные без повторов
  {
    trans[i] = packet[i];
  }
  mess[(trans[20])] = trans;
  if (trans[20] === 3 && mess[0][21] === mess[1][21] && mess[1][21] === mess[2][21]) 
  {
    let message = new Array(20);
    for (let i = 0; i < 20; i++)
    {
      if (mess[0][i] === mess[1][i] || mess[0][i] === mess[2][i]) 
      {
        message[i] = mess[0][i];
      } else
      { 
        message[i] = mess[1][i];
      }
      buf.push(message)
    }
  //////////////////////////////
  // TRANSMIT

  transmitter.transmit(buf[sent]);
  sent++
}
