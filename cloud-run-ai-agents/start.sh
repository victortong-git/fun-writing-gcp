#!/bin/bash
# Start the Python ADK AI Agents application

echo "🚀 Starting Fun Writing AI Agents (Google ADK)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Please edit .env with your API keys before running again"
    echo ""
    echo "Required variables:"
    echo "  - GOOGLE_API_KEY or GEMINI_API_KEY (for Gemini)"
    echo "  - GCP_PROJECT_ID (optional)"
    echo "  - GCS_BUCKET_NAME (optional)"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Load environment variables
echo "🔐 Loading environment variables..."
export $(cat .env | grep -v '^#' | xargs)

# Check if API key is set
if [ -z "$GOOGLE_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Error: GOOGLE_API_KEY or GEMINI_API_KEY must be set in .env"
    exit 1
fi

echo "✅ Configuration loaded"
echo ""
echo "🤖 Starting ADK agents..."
echo "📍 Server will be available at: http://localhost:8080"
echo "📊 Health check: http://localhost:8080/health"
echo ""

# Start the application
cd python_agents
python main.py
