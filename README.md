# Secure Auth Project

## Prerequisites
- **Node.js** (https://nodejs.org/)
- **Python 3** (https://www.python.org/downloads/)

## Setup Instructions

1. **Unzip the project folder.**

2. **Install Node.js dependencies:**
   ```sh
   npm install
   ```

3. **Install Python dependencies:**
   ```sh
   pip install -r final_rf_production/requirements.txt
   ```

4. **Set up environment variables:**
   - If a `.env` file is included, copy or edit it as needed.
   - If not, create one in the project root and add any required variables (see project documentation or ask the sender).

5. **Database setup:**
   - Ensure you have the correct database running and accessible.
   - Update the connection string in your `.env` file if needed.
   - Run any required migrations (if using Prisma):
     ```sh
     npx prisma migrate deploy
     ```

## Running the Batch Worker

- **To process a batch once:**
  ```sh
  node scripts/batch_model_worker.js
  ```

- **To run the batch worker automatically every 10 seconds:**
  ```sh
  node scripts/batch_model_cron.js
  ```

  - Stop the process with `Ctrl+C` in the terminal.

## Notes
- All code and dependency lists are included. Actual installed dependencies are not—run the above install commands.
- If you encounter issues with missing dependencies, ensure you are using the correct versions of Node.js and Python.
- For any questions, refer to the project documentation or contact the sender.
