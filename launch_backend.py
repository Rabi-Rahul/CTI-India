#!/usr/bin/env python
import subprocess
import time
import requests
import os
import sys
import signal

def main():
    # First, check if port 8000 is in use and kill any process using it
    print("Checking for existing processes on port 8000...")
    try:
        result = subprocess.run(
            'netstat -ano | findstr :8000',
            shell=True,
            capture_output=True,
            text=True
        )
        if result.stdout.strip():
            lines = result.stdout.strip().split('\n')
            for line in lines:
                if 'LISTENING' in line:
                    parts = line.split()
                    pid = int(parts[-1])
                    print(f"Found process {pid} using port 8000, terminating...")
                    try:
                        subprocess.run(f'taskkill /PID {pid} /F', shell=True, check=False)
                        time.sleep(1)
                    except Exception as e:
                        print(f"Error killing process: {e}")
    except Exception as e:
        print(f"Error checking port: {e}")

    # Wait a moment
    time.sleep(1)

    # Build and execute the command
    backend_dir = r'C:\Users\rabir\OneDrive\Desktop\project\backend'
    cmd = f'cd /d "{backend_dir}" && call venv\\Scripts\\activate.bat && uvicorn main:app --reload --host 127.0.0.1 --port 8000'
    
    print("Starting backend server...")
    # Start the backend server in background using cmd
    process = subprocess.Popen(
        cmd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )
    
    print(f"Backend process launched with PID: {process.pid}")
    
    # Wait for server to start
    time.sleep(4)
    
    # Test the server with HTTP request
    print("Testing server connectivity...")
    try:
        response = requests.get('http://127.0.0.1:8000', timeout=5)
        print(f"✓ HTTP Status Code: {response.status_code}")
        print(f"✓ Server PID: {process.pid}")
    except requests.exceptions.ConnectionError as e:
        print(f"✗ Connection error: {e}")
        print(f"  Server PID: {process.pid}")
    except requests.exceptions.Timeout:
        print(f"✗ Server timeout")
        print(f"  Server PID: {process.pid}")
    except Exception as e:
        print(f"✗ Error: {e}")
        print(f"  Server PID: {process.pid}")

if __name__ == '__main__':
    main()
