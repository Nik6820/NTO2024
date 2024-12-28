console.log("по-моему я занимаюсь какой-то хуйней")

function encode(bit_mess) {
    let outPut = new Int8Array(bit_mess.length*12/8);
    for (let i = 0, j = 0; i < bit_mess.length; i = i+8, j = j+12) {
        outPut[j] = (bit_mess[i] + bit_mess[i+1] + bit_mess[i+3] + bit_mess[i+4] + bit_mess[i+6])%2;
        outPut[j+1] = (bit_mess[i] + bit_mess[i+2] + bit_mess[i+3] + bit_mess[i+5] + bit_mess[i+6])%2;
        outPut[j+2] = bit_mess[i];
        console.log(bit_mess[i], outPut[i+2])
        outPut[j+3] = (bit_mess[i+1] + bit_mess[i+2] + bit_mess[i+3] + bit_mess[i+7])%2;
        outPut[j+4] = bit_mess[i+1];
        outPut[j+5] = bit_mess[i+2];
        outPut[j+6] = bit_mess[i+3];
        outPut[j+7] = (bit_mess[i+4] + bit_mess[i+5] + bit_mess[i+6] + bit_mess[i+7])%2;
        outPut[j+8] = bit_mess[i+4];
        outPut[j+9] = bit_mess[i+5];
        outPut[j+10] = bit_mess[i+6];
        outPut[j+11] = bit_mess[i+7];
    }
    return outPut; 
}

function decode(coded_mess) {
  
}

/*
let symb_arrau = new Int8Array(16);
symb_arrau[0] = 0
symb_arrau[1] = 1
symb_arrau[2] = 1
symb_arrau[3] = 0
symb_arrau[4] = 1
symb_arrau[5] = 0
symb_arrau[6] = 0
symb_arrau[7] = 0
symb_arrau[8] = 0
symb_arrau[9] = 1
symb_arrau[10] = 1
symb_arrau[11] = 0
symb_arrau[12] = 1
symb_arrau[13] = 0
symb_arrau[14] = 0
symb_arrau[15] = 1


let symb_array = encode(symb_arrau)
console.log(symb_array) 
