import sys
def convert(high, low):
    a = (f'{high:08b}')[-4:]
    b = (f'{low:08b}')[-8:]
    
    m = 0
    if high < 15:
        for i in range(3):
            if a[i] == '0':
                m = i+1
            else:
                break
        a = a[m:]
    else:
        pass
    
    n = 0
    if low < 255:
        for i in range(7):
            if b[i] == '0':
                n = i+1
            else:
                break
        b = b[n:]
    else: pass    
    
    res = '0'*(m+n) + a + b
    temp = 0
    if res[0] == '0':
        temp = int(res[1:10], 2) + int(res[10:], 2)/4
    else: 
        temp = int(res[1:10], 2) - 512 + (int(res[10:], 2))/4

    if temp >= -20 and temp <= 80:
        return "{:.2f}".format(temp)
    else:
        return "NaN"
        
valuesStr = sys.stdin.readline().split() # Читаем пришедшее значение (две строки в массиве)

values = list(map(int, valuesStr)) # Преобразуем пришедшие строки в числа

converted = convert(values[0], values[1]) # Преобразование данных

sys.stdout.write(str(converted)) # Выдаем результат как строку
