/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : Main program body
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2025 STMicroelectronics.
  * All rights reserved.
  *
  * This software is licensed under terms that can be found in the LICENSE file
  * in the root directory of this software component.
  * If no LICENSE file comes with this software, it is provided AS-IS.
  *
  ******************************************************************************
  */
/* USER CODE END Header */
/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "dma.h"
#include "fatfs.h"
#include "i2c.h"
#include "spi.h"
#include "usart.h"
#include "gpio.h"
#include "string.h"
#include "IS_Bluetooth.h"
#include "stdio.h"
#include "IRCamera.h"
/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include <CC1101.h>
/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */


#include <Logger.h>

void LOGGER(const char *text, uint8_t len)
{
    HAL_UART_Transmit(&huart1, (uint8_t *)text, len, 1000);
}


/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */

/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/

/* USER CODE BEGIN PV */

/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
/* USER CODE BEGIN PFP */

/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */
uint8_t str;

typedef struct {
    uint16_t height, width;
    uint16_t vStart, hStart;
    uint16_t colorspace;
    uint16_t exposure;
    uint32_t length;
    uint16_t numberOfChunks;
} ImageProperties;

typedef struct {
    uint16_t chunkID;
    uint16_t payloadLength;
    uint8_t isLastChunk;
    uint8_t payload[240];
    uint8_t checksum;
} Chunk;

// Инициализация объектов для радио
IntroSatLib::intefaces::SPI spi(&hspi2);
IntroSatLib::intefaces::GPIO sck(CC1101_SCK_GPIO_Port, CC1101_SCK_Pin);
IntroSatLib::intefaces::GPIO mosi(CC1101_MOSI_GPIO_Port, CC1101_MOSI_Pin);
IntroSatLib::intefaces::GPIO miso(CC1101_MISO_GPIO_Port, CC1101_MISO_Pin);
IntroSatLib::intefaces::GPIO reset(CC1101_CS_GPIO_Port, CC1101_CS_Pin);
IntroSatLib::intefaces::GPIO gd0(CC1101_GD0_GPIO_Port, CC1101_GD0_Pin);
IntroSatLib::CC1101WithGD0 trans(spi, sck, mosi, miso, reset, gd0);



/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{
  /* USER CODE BEGIN 1 */

  /* USER CODE END 1 */

  /* MCU Configuration--------------------------------------------------------*/

  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */

	HAL_Init();

  /* USER CODE BEGIN Init */
	using namespace IntroSatLib;

  /* USER CODE END Init */

  /* Configure the system clock */
  SystemClock_Config();

  /* USER CODE BEGIN SysInit */

  /* USER CODE END SysInit */

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_DMA_Init();
  MX_I2C1_Init();
  MX_I2C2_Init();
  MX_SPI1_Init();
  MX_SPI2_Init();
  MX_USART1_UART_Init();
  MX_USART2_UART_Init();
  MX_FATFS_Init();
  /* USER CODE BEGIN 2 */

  trans.Init();                // must be set to initialize the cc1101!
  trans.setCCMode(1);          // set config for internal transmission mode.
  trans.setModulation(0);      // set modulation mode. 0 = 2-FSK, 1 = GFSK, 2 = ASK/OOK, 3 = 4-FSK, 4 = MSK.
  trans.setMHZ(444.5);        // Here you can set your basic frequency. The lib calculates the frequency automatically (default = 433.92).The cc1101 can: 300-348 MHZ, 387-464MHZ and 779-928MHZ. Read More info from datasheet.
  trans.setDeviation(47.60);   // Set the Frequency deviation in kHz. Value from 1.58 to 380.85. Default is 47.60 kHz.
  trans.setChannel(0);         // Set the Channelnumber from 0 to 255. Default is cahnnel 0.
  trans.setChsp(199.95);       // The channel spacing is multiplied by the channel number CHAN and added to the base frequency in kHz. Value from 25.39 to 405.45. Default is 199.95 kHz.
  trans.setRxBW(812.50);       // Set the Receive Bandwidth in kHz. Value from 58.03 to 812.50. Default is 812.50 kHz.
  trans.setDRate(1.2);         // Set the Data Rate in kBaud. Value from 0.02 to 1621.83. Default is 99.97 kBaud!
  trans.setPA(10);             // Set TxPower. The following settings are possible depending on the frequency band.  (-30  -20  -15  -10  -6    0    5    7    10   11   12) Default is max!
  trans.setSyncMode(2);        // Combined sync-word qualifier mode. 0 = No preamble/sync. 1 = 16 sync word bits detected. 2 = 16/16 sync word bits detected. 3 = 30/32 sync word bits detected. 4 = No preamble/sync, carrier-sense above threshold. 5 = 15/16 + carrier-sense above threshold. 6 = 16/16 + carrier-sense above threshold. 7 = 30/32 + carrier-sense above threshold.
  trans.setSyncWord(211, 145); // Set sync word. Must be the same for the transmitter and receiver. (Syncword high, Syncword low)
  trans.setAdrChk(0);          // Controls address check configuration of received packages. 0 = No address check. 1 = Address check, no broadcast. 2 = Address check and 0 (0x00) broadcast. 3 = Address check and 0 (0x00) and 255 (0xFF) broadcast.
  trans.setAddr(0);            // Address used for packet filtration. Optional broadcast addresses are 0 (0x00) and 255 (0xFF).
  trans.setWhiteData(0);       // Turn data whitening on / off. 0 = Whitening off. 1 = Whitening on.
  trans.setPktFormat(0);       // Format of RX and TX data. 0 = Normal mode, use FIFOs for RX and TX. 1 = Synchronous serial mode, Data in on GDO0 and data out on either of the GDOx pins. 2 = Random TX mode; sends random data using PN9 generator. Used for test. Works as normal mode, setting 0 (00), in RX. 3 = Asynchronous serial mode, Data in on GDO0 and data out on either of the GDOx pins.
  trans.setLengthConfig(1);    // 0 = Fixed packet length mode. 1 = Variable packet length mode. 2 = Infinite packet length mode. 3 = Reserved
  trans.setPacketLength(0);    // Indicates the packet length when fixed packet length mode is enabled. If variable packet length mode is used, this value indicates the maximum packet length allowed.
  trans.setCrc(0);             // 1 = CRC calculation in TX and CRC check in RX enabled. 0 = CRC disabled for TX and RX.
  trans.setCRC_AF(0);          // Enable automatic flush of RX FIFO when CRC is not OK. This requires that only one packet is in the RXIFIFO and that packet length is limited to the RX FIFO size.
  trans.setDcFilterOff(0);     // Disable digital DC blocking filter before demodulator. Only for data rates ≤ 250 kBaud The recommended IF frequency changes when the DC blocking is disabled. 1 = Disable (current optimized). 0 = Enable (better sensitivity).
  trans.setManchester(0);      // Enables Manchester encoding/decoding. 0 = Disable. 1 = Enable.
  trans.setFEC(0);             // Enable Forward Error Correction (FEC) with interleaving for packet payload (Only supported for fixed packet length mode. 0 = Disable. 1 = Enable.
  trans.setPRE(0);             // Sets the minimum number of preamble bytes to be transmitted. Values: 0 : 2, 1 : 3, 2 : 4, 3 : 6, 4 : 8, 5 : 12, 6 : 16, 7 : 24
  trans.setPQT(0);             // Preamble quality estimator threshold. The preamble quality estimator increases an internal counter by one each time a bit is received that is different from the previous bit, and decreases the counter by 8 each time a bit is received that is the same as the last bit. A threshold of 4∙PQT for this counter is used to gate sync word detection. When PQT=0 a sync word is always accepted.
  trans.setAppendStatus(0);    // When enabled, two status bytes will be appended to the payload of the packet. The status bytes contain RSSI and LQI values, as well as CRC OK.
  bool flag=1;
  HAL_Delay(5000);
  /* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */

  while (1)
  {
//	HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13);
//	  uint8_t message[] = "EEllllromashka";
//	  message[2]=0x00;
//	  message[3]=0x08;
//	  message[4]=0x00;
//	  message[5]=0x08;
//	  trans.SendData(message, 14);
	//HAL_Delay(1);
    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */
	  uint8_t musor[6];//создание массива для t

	  HAL_UART_Transmit(&huart2, (uint8_t*)"t", 1, 100);

	  HAL_UART_Receive(&huart2, musor, 6, 2000);

	  uint8_t bufP[sizeof(ImageProperties)+6];// создание массива для p, проверить что выводит

	  HAL_UART_Transmit(&huart2, (uint8_t*)"p", 1, 100);

	  HAL_UART_Receive(&huart2, bufP, sizeof(ImageProperties)+6, 2000);
	  //HAL_UART_Transmit(&huart1, bufP, sizeof(ImageProperties)+6, 2000);

	  uint8_t bufPNew[sizeof(ImageProperties)];//создпние массива для p без преамбулы и постаамбулы

	  for (int i = 3;  i < sizeof(ImageProperties)+3; i++) {
		bufPNew[i-3]=bufP[i];
	}

	  ImageProperties* props = (ImageProperties*)(bufPNew);//+3 Алмаз??????
	  uint16_t xe = props->numberOfChunks;

	  for (uint16_t i = 0; i < xe; i++) {

		  uint8_t bufN[sizeof(Chunk)+6];//создпние массива для n

		  HAL_UART_Transmit(&huart2, (uint8_t*)"n", 1, 100);

		  HAL_UART_Receive(&huart2, bufN, sizeof(Chunk) + 6, 2000);

		  uint8_t bufNNew[sizeof(Chunk)]; //создпние массива для n без преамбулы и постаамбулы

		  for (int i = 3;  i < sizeof(Chunk)+3; i++) {
			bufNNew[i-3]=bufN[i];
		}
		  Chunk* chunk = (Chunk*)bufNNew;
		  uint16_t time = HAL_GetTick()/1000;
		  if (flag){
		  //HAL_UART_Transmit(&huart1, chunk->payload, chunk->payloadLength, 1000);
		  flag=0;
		  }

	  uint8_t*  data=chunk->payload;
	  uint16_t  id=chunk->chunkID;
	  //////////////* создание и отправка пакетов*//////////////////
	  for (uint8_t i = 0; i < 12; ++i) {
		uint8_t message[32];
		message[0]=0x45;
		message[1]=0x45;
		message[2]=0x00;
		message[3]=0x1A;
		message[4]=0x00;
		message[5]=0x1A;
		message[6]=id/256;
		message[7]=id%256;
		uint8_t tdata[24]; // формирование полезного пакета
		tdata[0]=time/256;
		tdata[1]=time%256;
		tdata[2]=0x00;
		tdata[3]=i;
		for (int j = 0; j < 20; ++j) {
			tdata[4+j]=data[i*20+j];
		}
		for (int k = 0; k < 24; ++k) {
			message[8+k]=tdata[k];
		}
		HAL_UART_Transmit(&huart1, message, 32, 1000);
		trans.SendData(message, 32);
	  }
	}
  }
  /* USER CODE END 3 */
}

/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

  /** Initializes the RCC Oscillators according to the specified parameters
  * in the RCC_OscInitTypeDef structure.
  */
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSE;
  RCC_OscInitStruct.HSEState = RCC_HSE_ON;
  RCC_OscInitStruct.HSEPredivValue = RCC_HSE_PREDIV_DIV1;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
  RCC_OscInitStruct.PLL.PLLMUL = RCC_PLL_MUL9;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the CPU, AHB and APB buses clocks
  */
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_2) != HAL_OK)
  {
    Error_Handler();
  }
}

/* USER CODE BEGIN 4 */

/* USER CODE END 4 */

/**
  * @brief  This function is executed in case of error occurrence.
  * @retval None
  */
void Error_Handler(void)
{
  /* USER CODE BEGIN Error_Handler_Debug */
  /* User can add his own implementation to report the HAL error return state */
  __disable_irq();
  while (1)
  {
  }
  /* USER CODE END Error_Handler_Debug */
}

#ifdef  USE_FULL_ASSERT
/**
  * @brief  Reports the name of the source file and the source line number
  *         where the assert_param error has occurred.
  * @param  file: pointer to the source file name
  * @param  line: assert_param error line source number
  * @retval None
  */
void assert_failed(uint8_t *file, uint32_t line)
{
  /* USER CODE BEGIN 6 */
  /* User can add his own implementation to report the file name and line number,
     ex: printf("Wrong parameters value: file %s on line %d\r\n", file, line) */
  /* USER CODE END 6 */
}
#endif /* USE_FULL_ASSERT */
