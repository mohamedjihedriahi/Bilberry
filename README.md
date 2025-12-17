# Bilberry

Bilberry is a Chrome Side Panel extension that integrates Large Language Models directly into your browsing workflow. It allows you to chat with, analyze, and generate documents from any active web page or PDF using your own API keys.

## Core Architecture

*   **Model Agnostic**: seamlessly switch between Google Gemini (Pro/Flash), OpenAI (GPT-4o), and Mistral AI.
*   **Context Aware**: The extension automatically injects the text content of your active tab into the LLM context window, enabling grounded Q&A.
*   **Client-Side Only**: Calls are made directly from your browser to the AI provider APIs. No intermediate servers are used, ensuring your data remains private.

## Key Features

### 🔍 Grounded Analysis
*   **Web Search (Gemini)**: Retrieve up-to-date information by enabling Google Search grounding for Gemini models.
*   **PDF Support**: Open any local PDF in Chrome to instantly chat with its contents without uploading it to a third-party service.

### 📄 Document Generation
Convert your AI conversations into professional documents with a single click:
*   **PDF Export**: Generates clean, formatted PDFs with support for bold styling and paragraphs.
*   **Word Export**: Creates `.docx` files with proper encoding for special characters and emojis.
*   **Automatic Formatting**: Markdown headers, lists, and bold text are preserved in the exported files.

### ⚡ Power User Tools
*   **Summarize**: One-click summary of the current page.
*   **History Management**: Searchable, persistent conversation history stored in local browser storage.
*   **Private Mode**: Toggle to disable history recording for sensitive sessions.

## Project Structure

*   `popup.js`: Core logic for UI state, event handling, and PDF/DOCX generation.
*   `utils.js`: Unified interface for calling valid AI providers (Gemini, OpenAI, Mistral) and Markdown parsing.
*   `styles.css`: Custom CSS variables for light/dark themes and a responsive side-panel layout.

## Setup

1.  **Clone**: `git clone [repository-url]`
2.  **Load**: Open `chrome://extensions`, enable **Developer Mode**, and click **Load Unpacked**. Select this folder.
3.  **Configure**: Open the extension side panel, click Settings, and enter your API Key(s).

## License

MIT
