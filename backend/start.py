import os
import subprocess
import time
import sys

def main():
    print("🚀 Запускаем бэкенд FastAPI...")
    # Запускаем сервер
    server_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--reload"]
    )

    # Даем серверу 3 секунды, чтобы он успел включиться перед запуском туннеля
    time.sleep(3)

    print("\n🌐 Поднимаем мост ngrok...")
    # ВАЖНО: Вставь сюда свой статический домен, который ты получил ранее!
    ngrok_domain = os.getenv("VITE_FRONTEND_URL").replace("https://", "").replace("http://", "") 
    
    ngrok_process = subprocess.Popen(
        ["ngrok", "http", f"--domain={ngrok_domain}", "8000"]
    )

    try:
        # Скрипт будет висеть здесь и держать оба процесса открытыми
        server_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Выключаем матрицу...")
        # Если ты нажмешь Ctrl+C, скрипт аккуратно убьет и сервер, и ngrok
        server_process.terminate()
        ngrok_process.terminate()
        print("✅ Всё успешно остановлено.")

if __name__ == "__main__":
    main()