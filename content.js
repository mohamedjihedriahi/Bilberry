// content.js
console.log("Gemini Web Assistant: Content script loaded.");

function getVisibleText() {
  return document.body.innerText;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    const text = getVisibleText();
    const truncatedText = text.substring(0, 50000); 
    sendResponse({ content: truncatedText, title: document.title, url: window.location.href });
  }
  return true; // Keep channel open for async response
});
