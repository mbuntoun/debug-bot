# Debug Bot

An AI-powered debugging assistant for INFO 653 students. Ask questions about your Node.js/Express/MySQL assignments and get guided hints — not just answers.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MySQL](https://dev.mysql.com/downloads/) (running locally)
- [Ollama](https://ollama.com/) (running locally)

## Setup

### 1. Install Ollama and pull a model

```bash
# Pull a lightweight model optimized for code
ollama pull deepcoder:1.5b
```

Make sure Ollama is running before starting the bot.

### 2. Set up the database

```bash
mysql -u root -p < db/schema.sql
```

This creates the `debug_bot` database and the `conversations` table.

### 3. Configure environment variables

Create a `.env` file in the project root:

```
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD='your_mysql_password'
DB_NAME=debug_bot
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=deepcoder:1.5b
```

### 4. Install dependencies

```bash
npm install
```

### 5. Start MySQL and Ollama

Before starting the server, make sure both services are running:

**MySQL** — start the MySQL server if it isn't already running:

```bash
# macOS (Homebrew)
brew services start mysql

# Windows
net start MySQL
```

**Ollama** — start the Ollama server:

```bash
ollama serve
```

> You can verify Ollama is up by visiting [http://127.0.0.1:11434](http://127.0.0.1:11434) in your browser.

### 6. Start the server

```bash
npm start
```

The server starts at [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Usage

Open your browser and go to `http://127.0.0.1:3000`. Type your debugging question in the chat and the AI will respond with hints and guidance.

Each browser tab gets its own session, so you can have multiple independent conversations.

## Project Structure

```
debug-bot/
├── app.js              # Entry point
├── routes/
│   └── chat.js         # POST /api/chat — SSE streaming endpoint
├── services/
│   ├── aiService.js    # Ollama integration
│   └── dbService.js    # MySQL connection pool, saves conversations
├── public/
│   └── index.html      # Student chat UI
└── db/
    └── schema.sql      # Database schema
```
