// utils.js

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

const FILE_GENERATION_PROMPT = `
If the user explicitly asks to generate or download a file (PDF or Word), do NOT output normal text. Instead, output a raw JSON object with this specific format:
{
  "type": "file_generation",
  "format": "pdf",  // or "docx"
  "title": "The_File_Name",
  "content": "The full text content formatted in Markdown..."
}
IMPORTANT:
1. Output raw JSON only. Do NOT use Markdown code blocks (no \`\`\`json).
2. You MUST escape all double quotes inside the content string (e.g., use \\" instead of ").
3. Prefer using single quotes (') for emphasis within the text to avoid syntax errors.
4. Ensure the JSON is valid and parseable.
`;

async function callLLM(provider, apiKey, model, prompt, context, useWebSearch = false) {
    if (provider === 'openai') {
        return await callOpenAI(apiKey, model, prompt, context);
    } else if (provider === 'mistral') {
        return await callMistral(apiKey, model, prompt, context);
    } else {
        return await callGemini(apiKey, model, prompt, context, useWebSearch);
    }
}

async function callOpenAI(apiKey, model, prompt, context) {
    const messages = [
        { role: "system", content: "You are a helpful AI assistant analyzing a web page.\n" + FILE_GENERATION_PROMPT },
        { role: "user", content: `Context from page:\n${context}\n\nUser Question: ${prompt}` }
    ];

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model, // e.g. "gpt-4o-mini"
                messages: messages,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "OpenAI API request failed");
        }

        const data = await response.json();
        // Standardize output to match Gemini's return format
        return {
            text: data.choices[0].message.content,
            citations: [] // OpenAI doesn't natively support grounding citations yet
        };

    } catch (error) {
        console.error("OpenAI Error:", error);
        throw error;
    }
}

async function callMistral(apiKey, model, prompt, context) {
    const messages = [
        { role: "system", content: "You are a helpful AI assistant analyzing a web page. Be concise and informative.\n" + FILE_GENERATION_PROMPT },
        { role: "user", content: `Context from page:\n${context}\n\nUser Question: ${prompt}` }
    ];

    try {
        const response = await fetch(MISTRAL_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model, // "mistral-small-latest"
                messages: messages,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Mistral API request failed");
        }

        const data = await response.json();
        return {
            text: data.choices[0].message.content,
            citations: [] // Mistral doesn't support grounding citations
        };

    } catch (error) {
        console.error("Mistral Error:", error);
        throw error;
    }
}

async function callGemini(apiKey, model, prompt, context, useWebSearch = false) {
    // Default to flash if auto or unknown
    let modelName = model;
    if (model === 'auto' || !model) modelName = 'gemini-2.5-flash';

    const url = `${GEMINI_API_URL}${modelName}:generateContent`;

    let requestBody;
    const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
    };

    const tools = useWebSearch ? [{ googleSearch: {} }] : [];

    const systemInstruction = {
        role: "user",
        parts: [{ text: "You are a helpful AI assistant.\n" + FILE_GENERATION_PROMPT }]
    };
    // Note: Gemini API 'systemInstruction' field is supported in v1beta but simpler to just prepend to context for now to avoid version issues if not using specific beta features usually.
    // Actually, let's append it to result context or prepend to valid user parts.

    let finalPrompt = `Context from current web page:\n${context}\n\n${FILE_GENERATION_PROMPT}\n\nUser Question: ${prompt}`;

    if (typeof context === 'object' && context !== null && context.fileData) {
        requestBody = {
            contents: [{
                role: "user",
                parts: [
                    { text: FILE_GENERATION_PROMPT },
                    { text: `User Question: ${prompt}` },
                    { inlineData: { mimeType: context.mimeType, data: context.fileData } }
                ]
            }],
            generationConfig,
            tools
        };
    } else {
        requestBody = {
            contents: [{
                role: "user",
                parts: [{ text: finalPrompt }]
            }],
            generationConfig,
            tools
        };
    }

    try {
        const response = await fetch(`${url}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Failed to fetch from Gemini API");
        }

        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            let responseText = "No response generated.";
            let citations = [];

            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                responseText = candidate.content.parts[0].text;
            }

            if (candidate.groundingMetadata && candidate.groundingMetadata.groundingChunks) {
                citations = candidate.groundingMetadata.groundingChunks
                    .filter(chunk => chunk.web)
                    .map(chunk => ({
                        title: chunk.web.title,
                        uri: chunk.web.uri
                    }));
            }

            return { text: responseText, citations };
        } else {
            return { text: "No response generated.", citations: [] };
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

// Robust Markdown formatter requiring valid block structure
function formatMarkdown(text) {
    if (!text) return "";

    // 1. Escape HTML
    const escapeHtml = (str) => str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // 2. Process Inline Formatting (Bold, Italic, Code)
    const processInline = (str) => {
        let s = escapeHtml(str);
        s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
        s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        return s;
    };

    const lines = text.split('\n');
    let html = '<div class="markdown-body">';
    let state = 'NONE'; // NONE, PARAGRAPH, LIST

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmed = line.trim();

        // Skip completely empty lines, but close paragraphs if hit
        if (trimmed.length === 0) {
            if (state === 'PARAGRAPH') { html += '</p>'; state = 'NONE'; }
            else if (state === 'LIST') { html += '</ul>'; state = 'NONE'; }
            continue;
        }

        // --- Block Detection ---

        // Header (Allow leading whitespace)
        if (trimmed.startsWith('#')) {
            // Close previous states
            if (state === 'PARAGRAPH') { html += '</p>'; state = 'NONE'; }
            else if (state === 'LIST') { html += '</ul>'; state = 'NONE'; }

            const match = trimmed.match(/^(#{1,6})\s+(.*)/);
            if (match) {
                const level = match[1].length;
                const content = processInline(match[2]);
                html += `<h${level}>${content}</h${level}>`;
                continue;
            }
        }

        // List Item (Allow leading whitespace)
        if (trimmed.match(/^[-*]\s/)) {
            // Close paragraph if open
            if (state === 'PARAGRAPH') { html += '</p>'; state = 'NONE'; }

            // Start list if not open
            if (state !== 'LIST') { html += '<ul>'; state = 'LIST'; }

            const content = processInline(trimmed.replace(/^[-*]\s+/, ''));
            html += `<li>${content}</li>`;
            continue;
        }

        // Code Block (Simple detection - Allow leading whitespace)
        if (trimmed.startsWith('```')) {
            if (state === 'PARAGRAPH') { html += '</p>'; state = 'NONE'; }
            else if (state === 'LIST') { html += '</ul>'; state = 'NONE'; }

            // Just skip the fence line for now to avoid rendering backticks
            // Ideal: toggle a 'CODE' state, but for simple chat rendering, 
            // treating content as text or pre-block is hard without multi-pass.
            // We will just Ignore the fence signal and let content render as text/paragraph
            continue;
        }

        // Paragraph
        if (state === 'LIST') { html += '</ul>'; state = 'NONE'; }

        if (state !== 'PARAGRAPH') {
            html += '<p>';
            state = 'PARAGRAPH';
        } else {
            // IMPORTANT: In Chat UI, single newlines usually imply a line break, not just a space.
            // We use <br> to preserve the visual structure the AI generated.
            html += '<br>';
        }
        html += processInline(trimmed); // Use trimmed line to avoid excess indentation in P
    }

    // Close any open tags at end
    if (state === 'PARAGRAPH') html += '</p>';
    if (state === 'LIST') html += '</ul>';

    html += '</div>';

    return html;
}
