import socket
import cv2
import struct
import numpy as np

# Создаем сокет и подключаемся к серверу по указанному IP-адресу и порту
sock = socket.socket()
sock.connect(("127.0.0.1", 52001))

# Создаем буфер для хранения изображения размером 640x480 пикселей, тип данных - беззнаковый байт (0-255)
img_buffer = np.zeros((480, 640), dtype=np.ubyte)

# Счетчик для сохранения изображений
img_counter = 0
payload_size = 20
try:
    while True:
        # Принимаем данные от сервера.
        data_raw = sock.recv(1024) # Читаем все отправленные сервером байты, но не более 1024
        # print(data_raw)
    
        # Распаковываем данные из бинарного формата. Предполагается, что пакет содержит хотя бы:
        # pkt_id - индекс пакета внутри снимка (например, номер части изображения)
        # payload - байты снимка (часть изображения)
        # payload_size - количество байтов снимка в пакете (может не содержаться в пакете, а быть константой или рассчитываться по факту)
        try:
            chunk_id, time, pkt_id, payload = struct.unpack('>HHH20s', data_raw)  # порядок полей пакета может быть выбран на ваше усмотрение
        except:
            print("unpack error")
        print(chunk_id, pkt_id, time, bytearray(payload))
        tabul = chunk_id*20*12
        
        try:
            # Записываем полученные байты в соответствующий участок буфера изображения
            img_buffer.reshape(-1)[(tabul+pkt_id * payload_size):(tabul+(pkt_id + 1) * payload_size)] = bytearray(payload)
        except:
            print("Oops")  # В случае ошибки (например, выхода за границы массива) выводим сообщение

        # Отображаем изображение в окне с именем "recieved data"
        cv2.imshow("recieved data", img_buffer)
        cv2.waitKey(1)  # Ожидаем 1 мс для обновления окна

        # if _____ :  # условие сохранения снимка
        #     img_counter += 1
        #     # Сохраняем изображение в файл с уникальным именем
        #     cv2.imwrite(f"image-{img_counter}.jpg", img_buffer)

except KeyboardInterrupt:
    print("Завершение работы")  # Если пользователь прерывает выполнение (Ctrl+C), выводим сообщение
finally:
    # Закрываем все окна OpenCV
    cv2.destroyAllWindows()
    # Закрываем сокет
    sock.close()
    print("Соединение закрыто.")
