import subprocess
import os
import signal
import sys

def cleanup():
    # Kill any process on port 8000 (standard for uvicorn)
    try:
        subprocess.run(["fuser", "-k", "8000/tcp"], check=False)
        print("🧹 Port 8000 cleaned up.")
    except:
        pass

def run():
    cleanup()
    while True:
        # Start the Admin Bot
        admin_bot = subprocess.Popen([sys.executable, "admin_bot.py"])

        # Start the Backend/Frontend API
        backend = subprocess.Popen([sys.executable, "backend.py"])

        print(f"✅ System started!\nAdmin Bot: {admin_bot.pid}\nBackend: {backend.pid}")

        try:
            # Check if any of the processes finished
            while True:
                ret_admin = admin_bot.poll()
                ret_backend = backend.poll()

                if ret_admin is not None:
                    print(f"❌ Admin Bot exited with code {ret_admin}. Restarting everything...")
                    break
                if ret_backend is not None:
                    print(f"❌ Backend exited with code {ret_backend}. Restarting everything...")
                    break

                # Check every few seconds
                import time
                time.sleep(5)

            # If we're here, one of the processes died. Kill the other and restart.
            admin_bot.kill()
            backend.kill()
            time.sleep(10) # Longer delay to allow Telegram to release the session

        except KeyboardInterrupt:
            admin_bot.kill()
            backend.kill()
            print("\n🛑 System stopped manually.")
            break

if __name__ == "__main__":
    if not os.path.exists("sessions"):
        os.makedirs("sessions")
    run()
