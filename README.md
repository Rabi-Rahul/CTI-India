# CTI-India

A government-grade cybersecurity web platform UI for an India-focused Cyber Threat Intelligence system.

## How to Run Locally

The application uses a FastAPI backend that also statically serves the frontend application.

1. **Open your terminal** and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. **Activate the virtual environment**:
   - On Windows (PowerShell):
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - On Windows (Command Prompt):
     ```cmd
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

3. **Install Dependencies** (if you haven't already):
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the FastAPI Server**:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

5. **Open the Application**:
   Open your web browser and go to: [http://127.0.0.1:8000](http://127.0.0.1:8000)

> **Note:** The backend server also serves the frontend UI. Any changes you make to the `backend/main.py` or routers will reload the server automatically. Any changes made to the `frontend` files will be served automatically on refresh.


http://127.0.0.1:8000