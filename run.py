import subprocess
import os
import signal
import sys

def run():
    # Start the Admin Bot
    admin_bot = subprocess.Popen([sys.executable, "admin_bot.py"])

    # Start the Backend/Frontend API
    backend = subprocess.Popen([sys.executable, "backend.py"])

    print(f"✅ System started!\nAdmin Bot: {admin_bot.pid}\nBackend: {backend.pid}")

    try:
        admin_bot.wait()
        backend.wait()
    except KeyboardInterrupt:
        admin_bot.terminate()
        backend.terminate()
        print("\n🛑 System stopped.")

if __name__ == "__main__":
    if not os.path.exists("sessions"):
        os.makedirs("sessions")
    run()
