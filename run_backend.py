import subprocess
import time
import requests
import os
import signal

# First, check if port 8000 is in use and kill any process using it
def check_and_kill_port_8000():
    try:
        # Use netstat to find the PID using port 8000
        result = subprocess.run(
            ['netstat', '-ano'],
            capture_output=True,
            text=True,
            shell=True
        )
        for line in result.stdout.split('\n'):
            if ':8000' in line and 'LISTENING' in line:
                parts = line.split()
                pid = int(parts[-1])
                print(f"Found process {pid} using port 8000, terminating...")
                try:
                    os.kill(pid, signal.SIGTERM)
                    time.sleep(1)
                except Exception as e:
                    print(f"Error killing process: {e}")
                    os.system(f'taskkill /PID {pid} /F')
                break
    except Exception as e:
        print(f"Error checking port: {e}")

# Kill any existing process on port 8000
check_and_kill_port_8000()

# Wait a moment
time.sleep(1)

# Start the backend server in background
batch_file = r'C:\Users\rabir\OneDrive\Desktop\project\start_backend.bat'
process = subprocess.Popen(
    batch_file,
    shell=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    creationflags=subprocess.CREATE_NEW_CONSOLE
)

print(f"Backend server started with PID: {process.pid}")

# Wait for server to start
time.sleep(3)

# Test the server with HTTP request
try:
    response = requests.get('http://127.0.0.1:8000', timeout=5)
    print(f"HTTP Status Code: {response.status_code}")
    print(f"Server PID: {process.pid}")
except requests.exceptions.RequestException as e:
    print(f"Error connecting to server: {e}")
    print(f"Server PID: {process.pid}")
