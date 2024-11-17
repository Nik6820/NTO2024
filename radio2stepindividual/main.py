import numpy as np

string = 'babah'
def proceed(stri):
    arr = "".join(f"{ord(i):08b}" for i in stri)
    arr = np.array(list(arr))
    print(arr)
    return np.array(arr, dtype = 'bool')

print(type(proceed(string)))
print(np.array(proceed(string), dtype=int))

# babah
