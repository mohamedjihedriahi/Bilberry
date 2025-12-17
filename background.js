// background.js

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// When the user clicks on the extension action (toolbar icon)
chrome.action.onClicked.addListener(async (tab) => {
    await chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageContent') {
        (async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.url) {
                sendResponse({ error: "Cannot access active tab." });
                return;
            }

            const url = tab.url;
            let isPdf = url.toLowerCase().endsWith('.pdf');

            try {
                // If URL doesn't end with .pdf, check Content-Type via a HEAD request
                if (!isPdf) {
                    const headResponse = await fetch(url, { method: 'HEAD' });
                    const contentType = headResponse.headers.get('content-type');
                    if (contentType && contentType.toLowerCase().includes('application/pdf')) {
                        isPdf = true;
                    }
                }

                if (isPdf) {
                    // PDF Path: Fetch the file, convert to base64, and send back
                    const pdfResponse = await fetch(url);
                    const pdfBuffer = await pdfResponse.arrayBuffer();
                    const pdfBase64 = arrayBufferToBase64(pdfBuffer);

                    sendResponse({
                        content: {
                            fileData: pdfBase64,
                            mimeType: 'application/pdf'
                        },
                        title: tab.title || url.split('/').pop(),
                        url: url
                    });

                } else {
                    // HTML Path: Delegate to the content script
                    try {
                        const response = await chrome.tabs.sendMessage(tab.id, { action: "getPageContent" });
                        sendResponse(response);
                    } catch (error) {
                        if (error.message.includes('Receiving end does not exist')) {
                            console.warn("Content script disconnected. Injecting now...", url);
                            // Inject content script and retry
                            try {
                                await chrome.scripting.executeScript({
                                    target: { tabId: tab.id },
                                    files: ['content.js']
                                });
                                // Retry sending message
                                const response = await chrome.tabs.sendMessage(tab.id, { action: "getPageContent" });
                                sendResponse(response);
                            } catch (retryError) {
                                console.error("Failed to inject or retry:", retryError);
                                sendResponse({ content: '', title: tab.title || url, url: url });
                            }
                        } else {
                            throw error;
                        }
                    }
                }

            } catch (error) {
                console.error("Error in background script:", error);
                // For local files, this fetch will fail. Provide a specific error.
                if (url.startsWith('file://')) {
                    sendResponse({ error: "Could not fetch local PDF. Please enable 'Allow access to file URLs' in the extension's settings." });
                } else {
                    sendResponse({ error: `Failed to fetch page content: ${error.message}` });
                }
            }
        })();
        return true; // Keep channel open for async response
    }
});
