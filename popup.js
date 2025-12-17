// popup.js

document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const setupView = document.getElementById('setup-view');
    const chatView = document.getElementById('chat-view');
    const geminiKeyInput = document.getElementById('gemini-api-key-input');
    const openaiKeyInput = document.getElementById('openai-api-key-input');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const cancelSetupBtn = document.getElementById('cancel-setup-btn');
    const settingsBtn = document.getElementById('settings-btn');

    const chatHistory = document.getElementById('chat-history');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const messageCount = document.getElementById('message-count');

    const summarizeBtn = document.getElementById('summarize-btn');
    const exportBtn = document.getElementById('export-btn');
    const newChatBtn = document.getElementById('new-chat-btn');

    const analysisStatus = document.getElementById('analysis-status');
    const complexityVal = document.getElementById('complexity-val');
    const confidenceVal = document.getElementById('confidence-val');

    // New Elements
    const modelSelector = document.getElementById('model-selector');
    const webSearchToggle = document.getElementById('web-search-toggle');
    const historyBtn = document.getElementById('history-btn');
    const historyPopover = document.getElementById('history-popover');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const historyList = document.getElementById('history-list');

    // History Detail Elements
    const historyDetail = document.getElementById('history-detail');
    const historyBackBtn = document.getElementById('history-back-btn');
    const detailTitle = document.getElementById('detail-title');
    const detailContent = document.getElementById('detail-content');
    const loadHistoryBtn = document.getElementById('load-history-btn');
    const historyHeader = document.querySelector('.history-header');

    const themeBtn = document.getElementById('theme-btn'); // New element

    // Private Mode Elements
    const privateModeToggle = document.getElementById('private-mode-toggle');
    const privateModePlaceholder = document.getElementById('private-mode-placeholder');
    const privateModeIndicator = document.getElementById('private-mode-indicator');

    // Search Elements
    const historySearchInput = document.getElementById('history-search-input');
    const deleteAllHistoryBtn = document.getElementById('delete-all-history-btn');

    // Workspace/Tab Elements
    const workspaceContainer = document.getElementById('workspace-container');
    const chatHistoryInitial = document.getElementById('chat-history-initial');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabChat = document.getElementById('tab-chat');
    const tabSaved = document.getElementById('tab-saved');
    const savedList = document.getElementById('saved-list');
    const savedSearchInput = document.getElementById('saved-search-input');
    const viewToggleBtn = document.getElementById('view-toggle-btn');
    const saveChatBtn = document.getElementById('save-chat-btn');
    const inputArea = document.querySelector('.input-area');

    // Saved Preview Elements
    const savedListView = document.getElementById('saved-list-view');
    const savedPreviewView = document.getElementById('saved-preview-view');
    const savedBackBtn = document.getElementById('saved-back-btn');
    const savedPreviewTitle = document.getElementById('saved-preview-title');
    const savedPreviewContent = document.getElementById('saved-preview-content');
    const loadSavedBtn = document.getElementById('load-saved-btn');

    // State
    let geminiApiKey = '';
    let openaiApiKey = '';
    let mistralApiKey = '';
    let currentModel = 'auto'; // auto, gemini-2.5-flash, gemini-2.5-pro, gpt-4o-mini, mistral-small-latest
    let pageContext = '';
    let msgCount = 0;
    let webSearchEnabled = false;
    let currentChatId = null;
    let originalPageUrl = '';
    let pageTitle = '';
    let selectedChatId = null; // Track selected history item for preview
    let isPrivateMode = false;
    let searchQuery = '';
    let pendingModelSelection = null; // Track model choice to apply after auth
    let currentTheme = 'dark'; // Default
    let savedSearchQuery = ''; // Search query for saved tab
    let workspaceVisible = false; // Track if workspace is showing
    let selectedSavedChatId = null; // Track selected saved chat for preview

    // Initialize
    const storage = await chrome.storage.local.get(['geminiApiKey', 'openaiApiKey', 'mistralApiKey', 'selectedModel', 'theme']);

    // Load Theme
    if (storage.theme) {
        currentTheme = storage.theme;
        applyTheme(currentTheme);
    } else {
        // Default Dark
        applyTheme('dark');
    }

    // Load Keys
    if (storage.geminiApiKey) geminiApiKey = storage.geminiApiKey;
    if (storage.openaiApiKey) openaiApiKey = storage.openaiApiKey;

    // ... (rest)

    // Helper: Apply Theme
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        updateThemeIcon(theme);
    }

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            // Show Sun (Click to switch to light)
            themeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
            themeBtn.title = "Switch to Light Mode";
        } else {
            // Show Moon (Click to switch to dark)
            themeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
            themeBtn.title = "Switch to Dark Mode";
        }
    }

    // Theme Event Listener (Append to listeners below)
    themeBtn.addEventListener('click', async () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(currentTheme);
        await chrome.storage.local.set({ theme: currentTheme });
    });

    // Load Keys
    if (storage.geminiApiKey) geminiApiKey = storage.geminiApiKey;
    if (storage.openaiApiKey) openaiApiKey = storage.openaiApiKey;
    if (storage.mistralApiKey) mistralApiKey = storage.mistralApiKey;

    // Load Model Selection (default: 'auto' = Gemini 2.5 Flash)
    if (storage.selectedModel) {
        currentModel = storage.selectedModel;
    } else {
        currentModel = 'auto'; // Explicit default
    }
    modelSelector.value = currentModel;

    updateWebSearchVisibility(); // Check if web search should be hidden

    if (geminiApiKey || openaiApiKey || mistralApiKey) {
        showChat();
    } else {
        showSetup();
    }

    // Event Listeners
    saveKeyBtn.addEventListener('click', async () => {
        const gKey = geminiKeyInput.value.trim();
        const oKey = openaiKeyInput.value.trim();
        const mKey = document.getElementById('mistral-api-key-input').value.trim();

        // Validate pending model has required key
        if (pendingModelSelection) {
            const needsOpenAI = pendingModelSelection.includes('gpt');
            const needsGemini = pendingModelSelection.includes('gemini');
            const needsMistral = pendingModelSelection.includes('mistral');

            if (needsOpenAI && !oKey) {
                openaiKeyInput.classList.add('input-error');
                openaiKeyInput.placeholder = 'OpenAI Key is required!';
                openaiKeyInput.focus();
                setTimeout(() => {
                    openaiKeyInput.classList.remove('input-error');
                    openaiKeyInput.placeholder = 'Enter OpenAI API Key';
                }, 2000);
                return;
            }

            if (needsGemini && !gKey) {
                geminiKeyInput.classList.add('input-error');
                geminiKeyInput.placeholder = 'Gemini Key is required!';
                geminiKeyInput.focus();
                setTimeout(() => {
                    geminiKeyInput.classList.remove('input-error');
                    geminiKeyInput.placeholder = 'Enter Gemini API Key';
                }, 2000);
                return;
            }

            if (needsMistral && !mKey) {
                const mistralInput = document.getElementById('mistral-api-key-input');
                mistralInput.classList.add('input-error');
                mistralInput.placeholder = 'Mistral Key is required!';
                mistralInput.focus();
                setTimeout(() => {
                    mistralInput.classList.remove('input-error');
                    mistralInput.placeholder = 'Enter Mistral API Key';
                }, 2000);
                return;
            }
        }

        if (gKey || oKey || mKey) {
            await chrome.storage.local.set({
                geminiApiKey: gKey,
                openaiApiKey: oKey,
                mistralApiKey: mKey
            });
            geminiApiKey = gKey;
            openaiApiKey = oKey;
            mistralApiKey = mKey;

            // Apply Pending Model Selection (now validated)
            if (pendingModelSelection) {
                currentModel = pendingModelSelection;
                modelSelector.value = currentModel;
                await chrome.storage.local.set({ selectedModel: currentModel });
                pendingModelSelection = null;
            } else if (!geminiApiKey && openaiApiKey && currentModel.includes('gemini')) {
                // Fallback auto-switch logic
                currentModel = 'gpt-4o-mini';
                modelSelector.value = currentModel;
                await chrome.storage.local.set({ selectedModel: currentModel });
            }

            updateWebSearchVisibility();
            showChat();
        }
    });

    cancelSetupBtn.addEventListener('click', () => {
        // Clear pending selection and revert dropdown
        if (pendingModelSelection) {
            modelSelector.value = currentModel; // Revert to current working model
            pendingModelSelection = null;
        }
        if (geminiApiKey || openaiApiKey || mistralApiKey) {
            showChat();
        }
    });

    settingsBtn.addEventListener('click', () => {
        geminiKeyInput.value = geminiApiKey;
        openaiKeyInput.value = openaiApiKey;
        document.getElementById('mistral-api-key-input').value = mistralApiKey;
        showSetup();
    });

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    summarizeBtn.addEventListener('click', () => {
        userInput.value = "Summarize this page";
        sendMessage();
    });

    newChatBtn.addEventListener('click', async () => {
        // Save current chat before clearing if it has messages
        if (msgCount > 0) {
            await saveChatToHistory();
        }

        chatHistory.innerHTML = '';
        msgCount = 0;
        updateMessageCount();

        // Reset State
        pageContext = '';
        currentChatId = null;
        originalPageUrl = '';
        pageTitle = '';

        // Add initial system message immediately so user sees something
        addSystemMessage("Hello! I'm here to help you understand and analyze the content on this page.\n\nWhat would you like to explore?");

        // Reset to initial view: show page analysis, hide workspace
        const pageAnalysisEl = document.querySelector('.page-analysis');
        if (pageAnalysisEl) pageAnalysisEl.classList.remove('hidden');
        if (chatHistoryInitial) chatHistoryInitial.classList.remove('hidden');
        if (workspaceContainer) workspaceContainer.classList.add('hidden');
        workspaceVisible = false;

        // Then fetch content
        await fetchPageContent();
    });

    exportBtn.addEventListener('click', () => {
        const text = Array.from(chatHistory.children)
            .map(div => {
                const role = div.classList.contains('user') ? 'User' : 'AI';
                const content = div.querySelector('.bubble').innerText;
                return `${role}: ${content}\n`;
            })
            .join('\n');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chat-history.txt';
        a.click();
    });

    chatHistory.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-btn');
        if (copyBtn) {
            const bubble = copyBtn.closest('.message').querySelector('.bubble');
            const textToCopy = bubble.innerText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        }
    });

    // Model Selector
    modelSelector.addEventListener('change', async (e) => {
        const selected = e.target.value;

        // Critical: Check missing keys
        if (selected.includes('gpt') && !openaiApiKey) {
            pendingModelSelection = selected;
            modelSelector.value = currentModel;
            openaiKeyInput.value = openaiApiKey;
            geminiKeyInput.value = geminiApiKey;
            document.getElementById('mistral-api-key-input').value = mistralApiKey;
            showSetup();
            setTimeout(() => openaiKeyInput.focus(), 100);
            return;
        }

        if (selected !== 'auto' && selected.includes('gemini') && !geminiApiKey) {
            pendingModelSelection = selected;
            modelSelector.value = currentModel;
            geminiKeyInput.value = geminiApiKey;
            openaiKeyInput.value = openaiApiKey;
            document.getElementById('mistral-api-key-input').value = mistralApiKey;
            showSetup();
            setTimeout(() => geminiKeyInput.focus(), 100);
            return;
        }

        if (selected.includes('mistral') && !mistralApiKey) {
            pendingModelSelection = selected;
            modelSelector.value = currentModel;
            geminiKeyInput.value = geminiApiKey;
            openaiKeyInput.value = openaiApiKey;
            document.getElementById('mistral-api-key-input').value = mistralApiKey;
            showSetup();
            setTimeout(() => document.getElementById('mistral-api-key-input').focus(), 100);
            return;
        }

        currentModel = selected;
        await chrome.storage.local.set({ selectedModel: currentModel });
        updateWebSearchVisibility();
    });

    // Toggle Web Search (with Auto-Switch to Gemini for non-Gemini models)
    webSearchToggle.addEventListener('click', async () => {
        const isGeminiModel = currentModel === 'auto' || currentModel.includes('gemini');

        if (!isGeminiModel) {
            // On Non-Gemini model
            if (!geminiApiKey) {
                // Case B: No Gemini key - do nothing (button is visually disabled)
                return;
            }
            // Case A: Gemini key exists - auto-switch to Gemini
            currentModel = 'gemini-2.5-flash';
            modelSelector.value = currentModel;
            await chrome.storage.local.set({ selectedModel: currentModel });
            webSearchEnabled = true;
            updateWebSearchUI();
            updateWebSearchVisibility();
            showToast('Switched to Gemini for Web Search');
        } else {
            // On Gemini model - standard toggle
            webSearchEnabled = !webSearchEnabled;
            updateWebSearchUI();
        }
    });

    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2500);
    }

    function updateWebSearchUI() {
        const webSearchStatus = document.getElementById('web-search-status');
        const webSearchStatusText = document.getElementById('web-search-status-text');
        const isGeminiModel = currentModel === 'auto' || currentModel.includes('gemini');

        // Update Button State
        webSearchToggle.classList.toggle('active', webSearchEnabled && isGeminiModel);

        // Update Status Text based on conditions
        if (!isGeminiModel) {
            // Non-Gemini model
            if (!geminiApiKey) {
                // Condition 1: No Gemini key
                webSearchStatusText.textContent = "Insert Gemini Key to enable Web Search";
                webSearchStatus.classList.remove('active');
                webSearchToggle.classList.add('disabled');
                webSearchToggle.title = "Gemini API key required";
            } else {
                // Condition 2: Gemini key exists
                webSearchStatusText.textContent = "Web search disabled";
                webSearchStatus.classList.remove('active');
                webSearchToggle.classList.remove('disabled');
                webSearchToggle.title = "Click to switch to Gemini with Web Search";
            }
        } else {
            // Condition 3: Gemini model
            webSearchToggle.classList.remove('disabled');
            if (webSearchEnabled) {
                webSearchStatusText.textContent = "Web search enabled";
                webSearchStatus.classList.add('active');
                webSearchToggle.title = "Web Search Enabled";
            } else {
                webSearchStatusText.textContent = "Web search disabled";
                webSearchStatus.classList.remove('active');
                webSearchToggle.title = "Web Search Disabled";
            }
        }
    }

    function updateWebSearchVisibility() {
        const webSearchStatus = document.getElementById('web-search-status');
        const isGeminiModel = currentModel === 'auto' || currentModel.includes('gemini');

        // Always show globe, but update its state
        webSearchToggle.classList.remove('hidden');
        webSearchStatus.classList.remove('hidden');

        // Reset web search if switching away from Gemini
        if (!isGeminiModel && webSearchEnabled) {
            webSearchEnabled = false;
        }

        updateWebSearchUI();
    }

    // History Popover
    historyBtn.addEventListener('click', () => {
        historyPopover.classList.toggle('hidden');
        if (!historyPopover.classList.contains('hidden')) {
            loadHistory();
        }
    });

    closeHistoryBtn.addEventListener('click', () => {
        historyPopover.classList.add('hidden');
    });

    // Close popover when clicking outside
    document.addEventListener('click', (e) => {
        if (!historyPopover.contains(e.target) && !historyBtn.contains(e.target)) {
            historyPopover.classList.add('hidden');
        }
    });

    // History Item Click & Delete
    historyList.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-history-btn');
        const historyItem = e.target.closest('.history-item');

        if (deleteBtn) {
            e.stopPropagation();
            const chatId = deleteBtn.dataset.id;
            await deleteHistory(chatId);
            loadHistory(); // Reload list
            return;
        }

        if (historyItem) {
            const chatId = historyItem.dataset.id;
            // Show preview instead of immediate restore
            const storage = await chrome.storage.local.get(['chatHistory']);
            const history = storage.chatHistory || [];
            const chat = history.find(c => c.id === chatId);

            if (chat) {
                selectedChatId = chatId;
                showHistoryDetail(chat);
            }
        }
    });

    // History Preview Listeners
    historyBackBtn.addEventListener('click', () => {
        historyDetail.classList.add('hidden');
        historyList.classList.remove('hidden');
        historyHeader.classList.remove('hidden');
        selectedChatId = null;
    });

    loadHistoryBtn.addEventListener('click', async () => {
        if (selectedChatId) {
            await restoreChat(selectedChatId);
            historyPopover.classList.add('hidden');
            // Reset views
            historyDetail.classList.add('hidden');
            historyList.classList.remove('hidden');
            historyHeader.classList.remove('hidden');
            selectedChatId = null;
        }
    });

    // History Search
    historySearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        loadHistory();
    });

    // Delete All History
    deleteAllHistoryBtn.addEventListener('click', async () => {
        const confirmed = confirm("Are you sure you want to delete all history?\nThis cannot be undone.");
        if (confirmed) {
            await chrome.storage.local.remove('chatHistory');
            currentChatId = null;
            loadHistory(); // Will show empty state
        }
    });

    // Private Mode Toggle
    privateModeToggle.addEventListener('change', (e) => {
        isPrivateMode = e.target.checked;

        // Update UI
        if (isPrivateMode) {
            historyList.classList.add('hidden');
            privateModePlaceholder.classList.remove('hidden');
            privateModeIndicator.classList.remove('hidden');
        } else {
            historyList.classList.remove('hidden');
            privateModePlaceholder.classList.add('hidden');
            privateModeIndicator.classList.add('hidden');
            loadHistory(); // Reload history when switching back
        }
    });

    // === WORKSPACE TAB LOGIC ===

    // Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // Update button states
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update content visibility
            if (targetTab === 'chat') {
                tabChat.classList.add('active');
                tabSaved.classList.remove('active');
            } else if (targetTab === 'saved') {
                tabChat.classList.remove('active');
                tabSaved.classList.add('active');
                loadSavedList(); // Load saved conversations
            }
        });
    });

    // View Toggle Button
    // View Toggle Button
    viewToggleBtn.addEventListener('click', () => {
        const pageAnalysisEl = document.querySelector('.page-analysis');
        pageAnalysisEl.classList.toggle('hidden');
    });

    // Save Chat Button
    saveChatBtn.addEventListener('click', async () => {
        if (msgCount > 0) {
            // Ensure we have a chat ID
            if (!currentChatId) {
                currentChatId = Date.now().toString();
            }
            await saveToSavedConversations(); // Use specific save function
            showToast('Conversation Saved');
        } else {
            showToast('No messages to save');
        }
    });

    // Saved Preview Listeners
    if (savedBackBtn) {
        savedBackBtn.addEventListener('click', () => {
            savedPreviewView.classList.add('hidden');
            savedListView.classList.remove('hidden');
            selectedSavedChatId = null;
        });
    }

    if (loadSavedBtn) {
        loadSavedBtn.addEventListener('click', async () => {
            if (selectedSavedChatId) {
                await restoreChat(selectedSavedChatId, true); // Restore from saved list
                // Switch to Chat tab
                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelector('.tab-btn[data-tab="chat"]').classList.add('active');
                tabChat.classList.add('active');
                tabSaved.classList.remove('active');

                // Hide preview, show list for next time
                savedPreviewView.classList.add('hidden');
                savedListView.classList.remove('hidden');
                selectedSavedChatId = null;
            }
        });
    }

    // Saved List Search
    if (savedSearchInput) {
        savedSearchInput.addEventListener('input', (e) => {
            savedSearchQuery = e.target.value.trim().toLowerCase();
            loadSavedList();
        });
    }

    // Saved List Click & Delete
    if (savedList) {
        savedList.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-saved-btn');
            const savedItem = e.target.closest('.saved-item');

            if (deleteBtn) {
                e.stopPropagation();
                const chatId = deleteBtn.dataset.id;
                await deleteSavedConversation(chatId); // Delete from saved
                loadSavedList(); // Reload list
                return;
            }

            if (savedItem) {
                const chatId = savedItem.dataset.id;
                // Show Preview instead of restoring immediately
                const storage = await chrome.storage.local.get(['savedConversations']);
                const savedHistory = storage.savedConversations || [];
                const chat = savedHistory.find(c => c.id === chatId);

                if (chat) {
                    selectedSavedChatId = chatId;
                    showSavedPreview(chat);
                }
            }
        });
    }

    // --- Saved Conversations Logic ---

    async function saveToSavedConversations() {
        if (isPrivateMode) return;
        if (!currentChatId || msgCount === 0) return;

        // Get all messages from DOM
        const messages = Array.from(chatHistory.children).map(div => {
            const role = div.classList.contains('user') ? 'user' : 'system';
            const bubble = div.querySelector('.bubble');
            const content = role === 'system' ? bubble.innerHTML : bubble.textContent;
            return { role, content };
        });

        let title = pageTitle;
        if (!title || title === "Untitled Page") {
            const firstMsg = messages.find(m => m.role === 'user');
            title = firstMsg ? firstMsg.content.substring(0, 30) + '...' : 'New Conversation';
        }

        const chatData = {
            id: currentChatId,
            timestamp: Date.now(),
            title: title,
            messages: messages,
            pageContext: pageContext,
            originalPageUrl: originalPageUrl
        };

        const storage = await chrome.storage.local.get(['savedConversations']);
        let savedHistory = storage.savedConversations || [];

        // Update existing or add new
        const index = savedHistory.findIndex(c => c.id === currentChatId);
        if (index > -1) {
            savedHistory[index] = chatData;
        } else {
            savedHistory.unshift(chatData);
        }

        await chrome.storage.local.set({ savedConversations: savedHistory });
    }

    async function deleteSavedConversation(chatId) {
        const storage = await chrome.storage.local.get(['savedConversations']);
        let savedHistory = storage.savedConversations || [];
        savedHistory = savedHistory.filter(c => c.id !== chatId);
        await chrome.storage.local.set({ savedConversations: savedHistory });
    }

    function showSavedPreview(chat) {
        savedListView.classList.add('hidden');
        savedPreviewView.classList.remove('hidden');
        savedPreviewTitle.textContent = chat.title || 'Conversation Preview';

        savedPreviewContent.innerHTML = '';
        chat.messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `preview-message ${msg.role}`;

            // Re-render markdown/HTML for preview
            if (msg.role === 'system') {
                msgDiv.innerHTML = msg.content; // Already HTML
            } else {
                msgDiv.textContent = msg.content;
            }
            savedPreviewContent.appendChild(msgDiv);
        });
    }

    // Load Saved List Function
    async function loadSavedList() {
        const storage = await chrome.storage.local.get(['savedConversations']);
        let history = storage.savedConversations || [];

        // Filter if search active
        if (savedSearchQuery) {
            history = history.filter(chat =>
                chat.title.toLowerCase().includes(savedSearchQuery) ||
                (chat.messages && chat.messages.some(m => m.content.toLowerCase().includes(savedSearchQuery)))
            );
        }

        savedList.innerHTML = '';

        if (history.length === 0) {
            const emptyMsg = savedSearchQuery ? 'No matching conversations' : 'No saved conversations';
            savedList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 13px;">${emptyMsg}</div>`;
            return;
        }

        history.forEach(chat => {
            const date = new Date(chat.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            const item = document.createElement('div');
            item.className = 'saved-item';
            item.dataset.id = chat.id;
            item.innerHTML = `
                <div class="saved-item-content">
                    <span class="saved-title">${chat.title}</span>
                    <span class="saved-date">${date}</span>
                </div>
                <button class="delete-saved-btn" data-id="${chat.id}" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            `;
            savedList.appendChild(item);
        });
    }


    // Functions
    function showSetup() {
        setupView.classList.remove('hidden');
        chatView.classList.add('hidden');
    }

    function showChat() {
        setupView.classList.add('hidden');
        chatView.classList.remove('hidden');

        // Fetch page content if not already fetched
        if (!pageContext) {
            fetchPageContent();
        }
    }

    function updateMessageCount() {
        messageCount.textContent = `${msgCount} messages`;
    }

    async function fetchPageContent() {
        analysisStatus.textContent = "Analyzing page content...";
        try {
            const response = await chrome.runtime.sendMessage({ action: "getPageContent" });
            if (response.error) {
                throw new Error(response.error);
            }
            if (response && response.content) {
                if (typeof response.content === 'object' && response.content.fileData) {
                    // Handle PDF file data
                    pageContext = response.content;
                } else {
                    // Handle HTML text content
                    pageContext = `Title: ${response.title}\nURL: ${response.url}\nContent: ${response.content}`;
                }
                originalPageUrl = response.url;
                pageTitle = response.title || "Untitled Page"; // Store title
                analysisStatus.textContent = `Analyzed "${response.title.substring(0, 30)}..."`;
                complexityVal.textContent = "Medium"; // Mock logic
                confidenceVal.textContent = "98%";
            }
        } catch (error) {
            console.error("Error fetching page content:", error);
            analysisStatus.textContent = "Unable to analyze content.";
            addSystemMessage(`Error: ${error.message}`, false, true);
            confidenceVal.textContent = "0%";
        }
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        if (!geminiApiKey && !openaiApiKey && !mistralApiKey) {
            showSetup();
            return;
        }

        // Add User Message
        addMessage(text, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';
        sendBtn.disabled = true;

        // Show workspace on first input (hide page analysis and initial chat)
        if (!workspaceVisible) {
            const pageAnalysisEl = document.querySelector('.page-analysis');
            if (pageAnalysisEl) pageAnalysisEl.classList.add('hidden');
            if (chatHistoryInitial) chatHistoryInitial.classList.add('hidden');
            if (workspaceContainer) workspaceContainer.classList.remove('hidden');
            workspaceVisible = true;
        }

        // Add Loading Message
        const loadingId = addSystemMessage("Thinking...", true);

        try {
            if (!pageContext) await fetchPageContent();

            // Determine Provider and Key
            let provider = 'gemini';
            let keyToUse = geminiApiKey;

            if (currentModel.includes('gpt')) {
                provider = 'openai';
                keyToUse = openaiApiKey;
            } else if (currentModel.includes('mistral')) {
                provider = 'mistral';
                keyToUse = mistralApiKey;
            } else {
                // Gemini Logic
                if (currentModel === 'auto') currentModel = 'gemini-2.5-flash';
                keyToUse = geminiApiKey;
            }

            // Validate Key again for specific selection
            if (!keyToUse) {
                throw new Error(`Missing API Key for ${provider.toUpperCase()}`);
            }

            const responseData = await callLLM(provider, keyToUse, currentModel, text, pageContext || "No page content available.", webSearchEnabled);

            // Remove loading
            removeMessage(loadingId);

            // Handle structured response
            let responseText = responseData;
            let citations = [];

            // If object returned (new utils format), destructure
            if (typeof responseData === 'object' && responseData.text) {
                responseText = responseData.text;
                citations = responseData.citations || [];
            }

            // Check for File Generation
            const fileData = tryParseFileGeneration(responseText);
            if (fileData) {
                addFileCardMessage(fileData);
            } else {
                addMessage(responseText, 'system', citations);
            }

            // Update current chat ID if new
            if (!currentChatId) {
                currentChatId = Date.now().toString();
            }

        } catch (error) {
            removeMessage(loadingId);
            addSystemMessage(`Sorry, something went wrong. Please try again.\n*${error.message}*`, false, true);
        } finally {
            sendBtn.disabled = false;
            userInput.focus();
            // Auto-save history after every message? 
            // Better: relying on New Chat to save, OR save periodically. 
            // For now, let's auto-save active chat state to be safe.
            if (currentChatId) {
                await saveChatToHistory();
            }
        }
    }

    function addMessage(text, type, citations = []) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;

        const bubble = document.createElement('div');
        bubble.className = 'bubble';

        if (type === 'system') {
            bubble.innerHTML = formatMarkdown(text);

            // Render Citations
            if (citations && citations.length > 0) {
                const citationBox = document.createElement('div');
                citationBox.className = 'citation-box';
                citations.forEach(cit => {
                    const link = document.createElement('a');
                    link.className = 'citation-link';
                    link.href = cit.uri;
                    link.target = '_blank';
                    link.innerHTML = `
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                           <circle cx="12" cy="12" r="10"></circle>
                           <line x1="2" y1="12" x2="22" y2="12"></line>
                           <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                        <span>${cit.title}</span>
                    `;
                    citationBox.appendChild(link);
                });
                bubble.appendChild(citationBox);
            }
        } else {
            bubble.textContent = text;
        }

        const actions = document.createElement('div');
        actions.className = 'message-actions';
        if (type === 'system') {
            actions.innerHTML = `<button class="copy-btn" title="Copy to clipboard">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button><span class="timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
        } else {
            actions.innerHTML = `<span class="timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
        }

        msgDiv.appendChild(bubble);
        msgDiv.appendChild(actions);
        chatHistory.appendChild(msgDiv);
        msgDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });

        msgCount++;
        updateMessageCount();
    }

    function addSystemMessage(text, isLoading = false, isError = false) {
        const id = 'msg-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message system';
        if (isError) {
            msgDiv.classList.add('error');
        }
        msgDiv.id = id;

        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        if (isLoading) {
            bubble.innerHTML = `<div class="loading-dots"><span></span><span></span><span></span></div>`;
        } else {
            bubble.innerHTML = formatMarkdown(text);
        }

        const actions = document.createElement('div');
        actions.className = 'message-actions';
        if (!isLoading) {
            actions.innerHTML = `<span class="timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
        }

        msgDiv.appendChild(bubble);
        msgDiv.appendChild(actions);
        chatHistory.appendChild(msgDiv);
        msgDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });

        if (!isLoading) {
            msgCount++;
            updateMessageCount();
        }

        return id;
    }

    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // Auto-resize textarea
    userInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        sendBtn.disabled = this.value.trim() === '';
    });

    // --- History Management Functions ---

    async function saveChatToHistory() {
        if (isPrivateMode) return; // Do not save in private mode
        if (!currentChatId || msgCount === 0) return;

        // Get all messages from DOM
        const messages = Array.from(chatHistory.children).map(div => {
            const role = div.classList.contains('user') ? 'user' : 'system';
            const bubble = div.querySelector('.bubble');

            // Extract text/html depending on role
            // For system messages with citations/HTML, we accept innerHTML to preserve structure
            const content = role === 'system' ? bubble.innerHTML : bubble.textContent;

            // Extract citations if present (metadata, though redundant if we save HTML)
            const links = Array.from(bubble.querySelectorAll('.citation-link')).map(link => ({
                title: link.innerText,
                uri: link.href
            }));

            return { role, content, citations: links };
        });

        // Determine title (Use Page Title if available, else truncated message)
        let title = pageTitle;
        if (!title || title === "Untitled Page") {
            const firstMsg = messages.find(m => m.role === 'user');
            title = firstMsg ? firstMsg.content.substring(0, 30) + '...' : 'New Conversation';
        }

        const chatData = {
            id: currentChatId,
            timestamp: Date.now(),
            title: title,
            messages: messages,
            pageContext: pageContext,
            originalPageUrl: originalPageUrl
        };

        const storage = await chrome.storage.local.get(['chatHistory']);
        let history = storage.chatHistory || [];

        // Update existing or add new
        const index = history.findIndex(c => c.id === currentChatId);
        if (index > -1) {
            history[index] = chatData;
        } else {
            history.unshift(chatData);
        }

        await chrome.storage.local.set({ chatHistory: history });
    }

    async function loadHistory() {
        const storage = await chrome.storage.local.get(['chatHistory']);
        let history = storage.chatHistory || [];

        // Filter if search active
        if (searchQuery) {
            history = history.filter(chat =>
                chat.title.toLowerCase().includes(searchQuery) ||
                (chat.messages && chat.messages.some(m => m.content.toLowerCase().includes(searchQuery)))
            );
        }

        historyList.innerHTML = '';

        if (history.length === 0) {
            const emptyMsg = searchQuery ? 'No filtered conversations found' : 'No saved conversations';
            historyList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 13px;">${emptyMsg}</div>`;
            return;
        }

        history.forEach(chat => {
            const date = new Date(chat.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            const item = document.createElement('div');
            item.className = 'history-item';
            item.dataset.id = chat.id;
            item.innerHTML = `
                <div class="history-info">
                    <span class="history-title">${chat.title}</span>
                    <span class="history-date">${date}</span>
                </div>
                <button class="delete-history-btn" data-id="${chat.id}" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            `;
            historyList.appendChild(item);
        });
    }

    async function deleteHistory(chatId) {
        const storage = await chrome.storage.local.get(['chatHistory']);
        let history = storage.chatHistory || [];
        history = history.filter(c => c.id !== chatId);
        await chrome.storage.local.set({ chatHistory: history });

        if (currentChatId === chatId) {
            // Reset current view if deleted
            currentChatId = null;
        }
    }

    async function restoreChat(chatId, fromSaved = false) {
        let history = [];
        if (fromSaved) {
            const storage = await chrome.storage.local.get(['savedConversations']);
            history = storage.savedConversations || [];
        } else {
            const storage = await chrome.storage.local.get(['chatHistory']);
            history = storage.chatHistory || [];
        }

        const chat = history.find(c => c.id === chatId);

        if (!chat) return;

        // Set State
        currentChatId = chat.id;
        pageContext = chat.pageContext;
        originalPageUrl = chat.originalPageUrl;

        // Ensure workspace is visible when loading a chat
        if (!workspaceVisible) {
            const pageAnalysisEl = document.querySelector('.page-analysis');
            if (pageAnalysisEl) pageAnalysisEl.classList.add('hidden');
            if (chatHistoryInitial) chatHistoryInitial.classList.add('hidden');
            if (workspaceContainer) workspaceContainer.classList.remove('hidden');
            workspaceVisible = true;
        }

        // Try to extract title from saved chat title if we want, or from pageContext if possible.
        // But for display we might not strictly need pageTitle variable restored unless we save again.
        // Let's assume the saved chat title is what we want to keep.
        pageTitle = chat.title;

        msgCount = 0; // Will Recount

        // Render UI
        chatHistory.innerHTML = '';
        analysisStatus.textContent = `Restored context: ${originalPageUrl ? new URL(originalPageUrl).hostname : 'Saved Page'}`;

        // Re-construct messages
        chat.messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${msg.role}`;

            const bubble = document.createElement('div');
            bubble.className = 'bubble';

            if (msg.role === 'system') {
                // Restore innerHTML directly as it contains formatting + citations
                bubble.innerHTML = msg.content;
            } else {
                bubble.textContent = msg.content;
            }

            const actions = document.createElement('div');
            actions.className = 'message-actions';
            if (msg.role === 'system') {
                actions.innerHTML = `<button class="copy-btn" title="Copy to clipboard">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>`;
            }

            msgDiv.appendChild(bubble);
            msgDiv.appendChild(actions);
            chatHistory.appendChild(msgDiv);
            msgCount++;
        });

        updateMessageCount();
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function showHistoryDetail(chat) {
        historyList.classList.add('hidden');
        historyHeader.classList.add('hidden');
        historyDetail.classList.remove('hidden');

        detailTitle.textContent = chat.title;
        detailContent.innerHTML = ''; // Clear previous

        chat.messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${msg.role}`;

            const bubble = document.createElement('div');
            bubble.className = 'bubble';

            if (msg.role === 'system') {
                bubble.innerHTML = msg.content; // Render stored HTML
            } else {
                bubble.textContent = msg.content;
            }

            msgDiv.appendChild(bubble);
            detailContent.appendChild(msgDiv);
        });

        // Scroll to top of preview
        detailContent.scrollTop = 0;
    }

    // --- File Generation Logic ---

    function tryParseFileGeneration(text) {
        if (!text) return null;

        try {
            // Universal Boundary Parsing
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');

            if (start !== -1 && end !== -1 && end > start) {
                let jsonString = text.substring(start, end + 1);

                try {
                    const data = JSON.parse(jsonString);
                    if (validateFileData(data)) return data;
                } catch (parseError) {
                    console.warn("Standard Parse failed, attempting cleanup...", parseError);

                    // Cleanup Strategy:
                    // The common error is unescaped newlines inside the "content" value.
                    // We can try to manually extract the content string and escape it.
                    try {
                        // Regex to capture the content value (greedy match until the " before } or ,)
                        // This assumes "content" is a key.
                        // We use a specific replacement for the content field.

                        // Heuristic: Escape all newlines that seem to be inside string values.
                        // Since tracking string state with regex is hard, we'll try a simpler formatting fix:
                        // 1. Minify: Remove structural newlines (newline after {, }, ,)
                        // 2. Escape remaining newlines (which must be in strings)

                        // Remove newlines after structural characters
                        let fixed = jsonString.replace(/([{},:\[\]])\s*\n\s*/g, '$1');
                        // Now replace any remaining newlines with \n
                        fixed = fixed.replace(/\n/g, '\\n');

                        const data = JSON.parse(fixed);
                        if (validateFileData(data)) return data;
                    } catch (e2) {
                        console.warn("Cleanup Step 1 Failed", e2);
                        // Fallback: Try escaping ALL newlines if the above failed (maybe it wasn't pretty printed)
                        try {
                            const globalEscape = jsonString.replace(/\n/g, "\\n").replace(/\r/g, "");
                            const data = JSON.parse(globalEscape);
                            if (validateFileData(data)) return data;
                        } catch (e3) {
                            console.warn("Cleanup Step 2 Failed", e3);
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Universal Parser Critical Error:", e);
        }
        return null;
    }

    function validateFileData(data) {
        return data && data.type === 'file_generation' && data.content;
    }

    function addFileCardMessage(fileData) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message system';

        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.style.background = 'transparent';
        bubble.style.padding = '0';
        bubble.style.border = 'none';

        const card = document.createElement('div');
        card.className = 'file-card';

        let iconHtml = '';
        if (fileData.format === 'pdf') {
            iconHtml = `<div class="file-icon pdf">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <path d="M16 13H8"></path>
                    <path d="M16 17H8"></path>
                    <path d="M10 9H8"></path>
                </svg>
            </div>`;
        } else {
            iconHtml = `<div class="file-icon docx">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <path d="M14.5 9h-5"></path>
                    <path d="M14.5 13h-5"></path>
                    <path d="M14.5 17h-5"></path>
                </svg>
            </div>`;
        }

        const title = fileData.title || 'Generated Document';
        const ext = fileData.format === 'pdf' ? 'PDF' : 'DOCX';

        card.innerHTML = `
            <div class="file-info">
                ${iconHtml}
                <div class="file-details">
                    <span class="file-name">${title}</span>
                    <span class="file-type">${ext} Document</span>
                </div>
            </div>
            <button class="file-download-btn" title="Download">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            </button>
        `;

        // Download Logic
        const downloadBtn = card.querySelector('.file-download-btn');
        downloadBtn.addEventListener('click', () => {
            if (fileData.format === 'pdf') {
                downloadPDF(title, fileData.content);
            } else {
                downloadDOCX(title, fileData.content);
            }
        });

        bubble.appendChild(card);
        msgDiv.appendChild(bubble);

        // Add standard timestamp
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        actions.innerHTML = `<span class="timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
        msgDiv.appendChild(actions);

        chatHistory.appendChild(msgDiv);
        msgDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });

        msgCount++;
        updateMessageCount();
    }

    async function downloadPDF(title, content) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');

        // Page config
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 40;
        const maxLineWidth = pageWidth - (margin * 2);

        let y = margin;

        // Title removed to avoid redundancy
        // doc.setFontSize(24);
        // ...

        // Content Parsing
        doc.setTextColor(0, 0, 0); // Reset color
        const lines = content.split('\n');
        let textBuffer = [];

        const flushBuffer = () => {
            if (textBuffer.length > 0) {
                const paragraph = textBuffer.join(' ');
                // We use parseStyledText on the full paragraph now
                const segments = parseStyledText(paragraph);
                y = printWrappedText(doc, segments, margin, y, maxLineWidth, 15, pageHeight, margin);
                textBuffer = [];
            }
        };

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            const isHeader = line.startsWith('#');
            const isList = line.match(/^[-*]\s/);
            const isEmpty = !line;

            // If we hit a block element (Header, List, Empty), flush pending text
            if (isHeader || isList || isEmpty) {
                flushBuffer();
            }

            if (isEmpty) {
                y += 10; // Empty line spacing
                continue;
            }

            // Headers
            if (isHeader) {
                const headerMatch = line.match(/^(#{1,6})\s+(.*)/);
                if (headerMatch) {
                    const level = headerMatch[1].length;
                    const text = headerMatch[2];

                    doc.setFont("helvetica", "bold");
                    if (level === 1) {
                        doc.setFontSize(18); y += 10;
                    } else if (level === 2) {
                        doc.setFontSize(16); y += 8;
                    } else {
                        doc.setFontSize(14); y += 6;
                    }

                    const headerLines = doc.splitTextToSize(text, maxLineWidth);
                    doc.text(headerLines, margin, y);
                    y += (headerLines.length * doc.getFontSize()) + 10;
                    continue;
                }
            }

            // Lists
            if (isList) {
                // Bullet point
                const text = line.replace(/^[-*]\s/, ''); // Remove symbol
                // Note: List items might also have bold text. Ideally we'd parse them too.
                // For now, let's just use the basic bold parser on the list item text as well!
                doc.setFont("helvetica", "normal");
                doc.setFontSize(12);

                // Draw Bullet
                const bulletY = y; // Save Y for bullet
                doc.text('\u2022', margin, bulletY);

                // Indent text and print
                const listX = margin + 15;
                const listWidth = maxLineWidth - 15;

                // Parse styles in list item
                const segments = parseStyledText(text);
                // We use printWrappedText but need to offset X.
                // Caution: printWrappedText manages Y. We need to pass the listX.
                y = printWrappedText(doc, segments, listX, y, listWidth, 15, pageHeight, margin);

                continue;
            }

            // Normal Text -> Buffer it
            textBuffer.push(line);
        }

        // Final Flush
        flushBuffer();

        doc.save(`${title}.pdf`);
    }

    function downloadDOCX(title, content) {
        // Simple HTML construction for html-docx-js
        // We'll convert markdown-ish content to basic HTML for the DOCX converter
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; }
                    h1 { font-size: 18pt; font-weight: bold; color: #2E74B5; margin-top: 12pt; margin-bottom: 6pt; }
                    h2 { font-size: 14pt; font-weight: bold; color: #1F4E79; margin-top: 10pt; margin-bottom: 6pt; }
                    h3 { font-size: 12pt; font-weight: bold; color: #333333; margin-top: 10pt; margin-bottom: 6pt; }
                    p { margin-bottom: 10pt; }
                    ul { margin-bottom: 10pt; }
                    li { margin-bottom: 5pt; }
                    strong { font-weight: bold; }
                    em { font-style: italic; }
                    code { font-family: 'Consolas', monospace; background-color: #f0f0f0; }
                    pre { font-family: 'Consolas', monospace; background-color: #f0f0f0; padding: 10pt; }
                </style>
            </head>
            <body>
                ${formatMarkdown(content)}
            </body>
            </html>
        `;

        const converted = window.htmlDocx.asBlob(htmlContent);
        const url = URL.createObjectURL(converted);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.docx`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // --- PDF Formatting Helpers ---

    function parseStyledText(text) {
        // Simple parser for **bold**
        // Returns array of { text, isBold }
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return { text: part.slice(2, -2), isBold: true };
            }
            return { text: part, isBold: false };
        }).filter(p => p.text); // Remove empty strings
    }

    function printWrappedText(doc, segments, x, startY, maxWidth, lineHeight, pageHeight, margin) {
        let cursorX = x;
        let cursorY = startY;
        const spaceWidth = doc.getStringUnitWidth(' ') * doc.internal.getFontSize();

        segments.forEach(seg => {
            doc.setFont("helvetica", seg.isBold ? "bold" : "normal");
            doc.setFontSize(12);

            const words = seg.text.split(' ');

            words.forEach((word, index) => {
                // Determine suffix (space) unless it's the last word of the segment
                // A better approach for seamless text is complex, but checking if next char is punctuation helps.
                // For simplified logic: add space after every word except the very last one of the line.
                // But here we are iterating segments.
                // Simple logic: Add space if it wasn't the last word in split OR if the original text had a space.
                // Let's assume split(' ') consumes spaces. We need to print word + space.

                // Correction: split removes spaces. We generally want to add a space after a word, 
                // UNLESS it is followed by punctuation/end of segment? 
                // Creating a proper word-wrap with mixed styles is tricky because "word" + " " logic.
                // We'll treat the space as a separate "word" for measurement simplicity or just append it.

                let w = word;
                // Heuristic: If not the last word in this segment, append space. 
                // If it IS the last word, we rely on the next segment (e.g., Bold ending, next is Normal starting with space?)
                // Markdown usually implies spaces around ** unless part of word.
                // Let's check the original segment text. 
                // If seg.text ended with space, split would give empty string at end?
                // Let's stick to: Print Word. Move Cursor. Print Space if needed.

                let wordWidth = doc.getStringUnitWidth(w) * doc.internal.getFontSize();

                // Check Wrap
                if (cursorX + wordWidth > x + maxWidth) {
                    cursorX = x;
                    cursorY += lineHeight;
                    // Check Page Break
                    if (cursorY > pageHeight - margin) {
                        doc.addPage();
                        cursorY = margin;
                    }
                }

                doc.text(w, cursorX, cursorY);
                cursorX += wordWidth;

                // Add space after word if it's not the last word
                if (index < words.length - 1) {
                    if (cursorX + spaceWidth > x + maxWidth) {
                        cursorX = x;
                        cursorY += lineHeight; // New line for just the space? unlikely but possible
                    }
                    // Don't draw space, just move cursor?
                    // doc.text(" ", cursorX, cursorY); 
                    cursorX += spaceWidth;
                }
            });

            // Handle trailing space of the segment? 
            // This simple split(' ') eats boundaries. 
            // Refined approach: preserve whitespace in tokenization or assume standard sentence spacing.
            // For now, this is a distinct improvement over raw **.
        });

        return cursorY + lineHeight + 5; // Return next Y position
    }

});
