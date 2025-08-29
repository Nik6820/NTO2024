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
#include "IS_Bluetooth.h"
#include "GyroscopeV2.h"
#include "MagnetometerV2.h"
#include "MotorFlyWheel.h"
#include "IRCamera.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include <CC1101.h>
/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */


#include <Logger.h>

void LOGGER(const char* text, uint8_t len)
{
	HAL_UART_Transmit(&huart1, (uint8_t*)text, len, 1000);
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


/** Инициализация объектов для радио
IntroSatLib::intefaces::SPI spi(&hspi2);
IntroSatLib::intefaces::GPIO sck(CC1101_SCK_GPIO_Port, CC1101_SCK_Pin);
IntroSatLib::intefaces::GPIO mosi(CC1101_MOSI_GPIO_Port, CC1101_MOSI_Pin);
IntroSatLib::intefaces::GPIO miso(CC1101_MISO_GPIO_Port, CC1101_MISO_Pin);
IntroSatLib::intefaces::GPIO reset(CC1101_CS_GPIO_Port, CC1101_CS_Pin);
IntroSatLib::intefaces::GPIO gd0(CC1101_GD0_GPIO_Port, CC1101_GD0_Pin);
IntroSatLib::CC1101WithGD0 trans(spi, sck, mosi, miso, reset, gd0);
*/
uint8_t str;
char buffer[20];
float pxls[64] = {
		13.50, 13.75, 23.50, 23.00, 23.50, 23.50, 23.00, 23.25,
		13.75, 23.50, 23.00, 23.00, 22.75, 23.00, 33.25, 23.25,
		23.50, 23.25, 23.00, 23.25, 23.00, 22.75, 22.75, 23.00,
		63.25, 23.50, 23.25, 22.00, 22.00, 22.75, 23.00, 22.75,
		23.75, 23.25, 63.00, 22.00, 22.00, 22.75, 23.25, 23.00,
		23.50, 63.25, 23.25, 23.25, 22.75, 22.75, 23.25, 22.75,
		23.75, 23.25, 23.25, 23.00, 23.00, 23.00, 23.00, 22.75,
		23.75, 23.50, 22.75, 23.75, 23.25, 23.25, 23.00, 23.25
};
int edge = 35;
int width = 3;


int LR(float pxls[64], int edge);

int LR(float pxls[64], int edge)
{
	float sum = 0.0f;
	int amount = 0;

	for (int i = 0; i < 64; i++) {
		if (pxls[i] > edge) {
			sum += i % 8;
			amount++;
		}
	}

	if (amount == 0) {
		return 127;
	}

	float centre = sum / amount;

	if (centre > (4 + width / 2)) {
		return 1;
	}
	if (centre < (4 - width / 2)) {
		return -1;
	}

	return 0;
}

void static_angular_velocity(float omega_goal) {
	using namespace IntroSatLib;
	MotorFlyWheel motor(&hi2c1, 0x38);
	GyroscopeV2 mgu1(&hi2c1, 0x6B);

	while (motor.Init()) {}
	HAL_Delay(250);

	while (mgu1.Init()) {}
	HAL_Delay(250);

	int T = 100;
	float omega;
	int max_speed = 3000;
	float err = 0.0;
	float last_err = 0.0;
	float P = 0;
	float I = 0;
	float D = 0;
	float Kp = 400;
	float Ki = 0.3;
	float Kd = 0;
	float Integrator = 0.0;
	float PID_rez = 0.0;
	float Integrator_max = 4.0;
	float Raw_Motor_Speed = 0.0;
	float Motor_Speed = 0.0;

	omega = mgu1.Z();
	err = omega - omega_goal;
	P = Kp * err;
	D = Kd * (err - last_err) / T;
	last_err = err;
	Integrator = Integrator + err * T;
	if (Integrator > Integrator_max) {
		Integrator = Integrator_max;
	}
	if (Integrator < -Integrator_max) {
		Integrator = -Integrator_max;
	}
	I = Integrator * Ki;
	PID_rez = P + I + D;
	Raw_Motor_Speed = motor.CurrentSpeed();
	Motor_Speed = (Raw_Motor_Speed + PID_rez);
	if (Motor_Speed > max_speed) {
		Motor_Speed = max_speed;
	}
	if (Motor_Speed < -max_speed) {
		Motor_Speed = -max_speed;
	}
	motor.NeedSpeed(Motor_Speed);
	HAL_Delay(T);
}
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
	MotorFlyWheel motor(&hi2c1, 0x38);
	GyroscopeV2 mgu1(&hi2c1, 0x6B);
	IRCamera amg(&hi2c1);
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
	char str;
	amg.useForceReset(GPIOA, GPIO_PIN_11);
	amg.useMirrored();
	amg.Init();
	int result = LR(pxls, edge);

	while (motor.Init()) {}
	HAL_Delay(250);

	while (mgu1.Init()) {}
	HAL_Delay(250);

	float omega;
	//	for (int i = 0;  i < 10; ++ i) {
	//		  static_angular_velocity(0);
	//	}
	int flag = 0;
	int last_flag = 1;
	int dev_vel = 1;
	int time_static = 0;
	/* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */

	while (1)
	{
		HAL_UART_Receive(&huart1, (uint8_t*)&str, 1, 1000);

		if (str == 'b') {
			str = '\n';

			HAL_UART_Transmit(&huart1, (uint8_t*)"Bootloader Mode\n\r", strlen("Bootloader Mode\n\r"), 1000);
			motor.NeedSpeed(0);
			enter_bootloader();

		}
		//HAL_UART_Transmit(&huart1, (uint8_t*)"Bootloader Mode\n\r", strlen("Bootloader Mode\n\r"), 1000);
	/* USER CODE END WHILE */

	/* USER CODE BEGIN 3 */
		if (amg.Read()) { continue; }
		for (uint8_t y = 0; y < 8; y++)
		{
			for (uint8_t x = 0; x < 8; x++)
			{
				char data[10];
				//uint32_t len = sprintf(data, "%0.2f ", amg.getPixel(x, y));
				pxls[y * 8 + x] = amg.getPixel(x, y);
				//HAL_UART_Transmit(&huart1, (uint8_t*)(data), len, 100);
			}
			char next = '\n';
			//HAL_UART_Transmit(&huart1, (uint8_t*)(&next), 1, 100);

		}
		flag = LR(pxls, edge);
		sprintf(buffer, "%d f %d lf %d \r\n", result, flag, last_flag);
		//HAL_UART_Transmit(&huart1, (uint8_t*)buffer, strlen(buffer), 100);
		omega = mgu1.Z();
		if (flag == 0) {//если земля в фокусе, то стабилизируемся и отсчитываем время в нем
			static_angular_velocity(0);
			last_flag = -motor.CurrentSpeed() / motor.CurrentSpeed();
			time_static++;
			HAL_UART_Transmit(&huart1, 0, 1, 100);
		}
		else {//если земля вышла из фокуса, то обнуляем счетчик включения камеры
			time_static = 0;
		}
		if (flag == 1) {//если отклонение вправо, то небольшая скорость против часовой
			static_angular_velocity(0.25);
			last_flag = -motor.CurrentSpeed() / motor.CurrentSpeed();
		}
		if (flag == -1) {//если отклонение влево, то небольшая скорость по часовой
			static_angular_velocity(-0.25);
			last_flag = -motor.CurrentSpeed() / motor.CurrentSpeed();
		}
		if (flag == 127) {//если землю не видно, то движемся с постоянной угловой скоростью по часовой стрелке
			static_angular_velocity(0.5);
			last_flag = -motor.CurrentSpeed() / motor.CurrentSpeed();
		}
		if (time_static > 5) {//если земля в фокусе больше 3 секунд (каждый отсчет PID 0.1 с), то отправляем сигнал на получение фото
			HAL_GPIO_WritePin(TAKE_PHOTO_GPIO_Port, TAKE_PHOTO_Pin, GPIO_PIN_SET);
			static_angular_velocity(0);
		}
		else {
			HAL_GPIO_WritePin(TAKE_PHOTO_GPIO_Port, TAKE_PHOTO_Pin, GPIO_PIN_RESET);
		}
		//		if (abs(flag) == 1) {
		//			static_angular_velocity(-flag * dev_vel);
		//			last_flag = flag;
		//		}
		//		if (flag == 127) {
		//			static_angular_velocity(last_flag * dev_vel);
		//		}


	}
	/* USER CODE END 3 */
}

/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
	RCC_OscInitTypeDef RCC_OscInitStruct = { 0 };
	RCC_ClkInitTypeDef RCC_ClkInitStruct = { 0 };

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
	RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK | RCC_CLOCKTYPE_SYSCLK
		| RCC_CLOCKTYPE_PCLK1 | RCC_CLOCKTYPE_PCLK2;
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
void assert_failed(uint8_t* file, uint32_t line)
{
	/* USER CODE BEGIN 6 */
	/* User can add his own implementation to report the file name and line number,
	   ex: printf("Wrong parameters value: file %s on line %d\r\n", file, line) */
	   /* USER CODE END 6 */
}
#endif /* USE_FULL_ASSERT */
