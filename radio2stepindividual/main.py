import numpy as np

def proceed(data: str) -> bytes:
    out=[]
    data_num = [ord(c) for c in data]
    csum = []
    out= [0] + [255] + [255] + out + data_num + csum + [0] + [255] + [255] + [255]
    return bytes(out)

import numpy as np
def decod(inp, buf, end):
    buf = np.append(buf, inp)
    out = ''

    summ = 0
    st_ind = 0
    for i in range(len(buf)):
        if buf[i]:
            summ += 1
        else:
            summ = 0
        if summ == 16:
            st_ind = i + 1 - summ
            break
    buf = buf[st_ind:]
    summ = 0

    fin_ind = 0
    for i in range(24, len(buf)):
        if buf[i]:
            summ += 1
        else:
            summ = 0
        if summ == 24:
            fin_ind = i + 1 - summ - 8
            break    

    if fin_ind != 0:
        out = ''.join(buf[16:fin_ind].astype(int).astype(str).tolist())

        binary_int = int(out, 2)
        byte_number = binary_int.bit_length() + 7 // 8
        binary_array = binary_int.to_bytes(byte_number, "big")
        ascii_text = binary_array.decode('ascii')

        buf = buf[(fin_ind + 24):]
        return ascii_text
    else:
        return ''

# Теоретически что с данным делает орбита
buf = np.array([], bool)
binary_strings = ['{:08b}'.format(byte) for byte in proceed(input())]
arr = []
for i in ''.join(binary_strings):
    arr += [int(i)]
pl = np.array(([1, 0, 1, 1] + arr + [1, 0, 1]), bool) 
print(decod(pl, buf, 1))

