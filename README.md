# Bilberry

Bilberry is a Chrome Side Panel extension that integrates Large Language Models directly into your browsing workflow. It allows you to chat with, analyze, and generate documents from any active web page or PDF using your own API keys.

![](image.png)
## Features

*   **True Private Experience**: Operates via a client-side only approach. Calls are made directly from your browser to the AI APIs with no intermediate servers. Includes a "Private Mode" to prevent local logging.
    *   [Watch Demo](https://www.loom.com/share/ed143bf14c8446bd8904a7cfddd1797c)
*   **Web Search & Reasoning**: Native integration with Google Gemini for grounded web search and reasoning capabilities.
*   **Context Aware**: Automatically extracts text from the active tab or local PDFs to answer questions based on the current content without uploading files to third-party services.
*   **File Generation**: Generate formatted reports, summaries, or articles and download them directly as **.docx** or **.pdf** with a single click.
    *   [Watch File Generation Demo](https://www.loom.com/share/4d9324dd05a6450fa95401bbd1d39719)
*   **Model Support**:
    *   **Google Gemini** (2.5 Flash/Pro).
    *   **OpenAI** (GPT-4o/Mini).
    *   **Mistral AI**.
*   **Productivity Tools**: One-click page summarization and a searchable local history.

## Installation

This extension is installed via Chrome Developer Mode.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mohamedjihedriahi/Bilberry.git
    ```
2.  **Open Chrome Extensions:**
    Navigate to `chrome://extensions/`.
3.  **Enable Developer Mode:**
    Toggle the switch in the top-right corner.
4.  **Load Extension:**
    Click **"Load unpacked"** and select the `Bilberry` folder from this repo.
5.  **Configuration:**
    Open the side panel, go to **Settings**, and enter your API Key(s) for the models you wish to use.

## Tech Stack

*   **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS Variables.
*   **Storage**: `chrome.storage.local` for history and settings.
*   **PDF/Docx**: Client-side generation using `jspdf` and `html-docx-js`.

## Contributing

Feedback and pull requests are welcome.
*   **Bugs**: Please open an issue describing the error.
*   **Features**: Fork the repo and submit a PR.

## License

MIT
