document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const settingsIcon = document.getElementById('settingsIcon');
  const mainTab = document.getElementById('mainTab');
  const settingsTab = document.getElementById('settingsTab');
  const aiServiceSelect = document.getElementById('aiService');
  const geminiApiKeyInput = document.getElementById('geminiApiKey');
  const openaiApiKeyInput = document.getElementById('apiKey');
  const geminiApiGroup = document.getElementById('geminiApiGroup');
  const openaiApiGroup = document.getElementById('openaiApiGroup');
  const systemPromptInput = document.getElementById('systemPrompt');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const regenerateBtn = document.getElementById('regenerateBtn');
  const postBtn = document.getElementById('postBtn');
  const originalTweetElement = document.getElementById('originalTweet');
  const aiReplyElement = document.getElementById('aiReply');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const welcomeScreen = document.getElementById('welcome-screen');
  const replyScreen = document.getElementById('reply-screen');
  const headerTitle = document.getElementById('header-title');
  const toneChips = document.querySelectorAll('.tone-chip');

  // Default system prompt
  const DEFAULT_SYSTEM_PROMPT = 'You are an indiehacker whose goal is to connect with fellow makers by replying to their tweets. You dont have to be always be positive or use assertive sentences. Maintain a highly personal tone like an indie hacker so that when somebody sees the comment, he feels to visit your profile. reply mostly within 1 or 2 sentences. lowest the sentence, better it is. do not end the reply with a question unless necessary.';

  // Simplified tone instructions
  const TONE_INSTRUCTIONS = {
    'default': '',
    'funny': 'Answer in a funny tone.',
    'supportive': 'Answer in a supportive tone.',
    'excited': 'Answer in an excited tone.',
    'wow': 'Answer in a tone of amazement.',
    'curious': 'Answer in a curious tone.'
  };

  // State variables
  let currentTweetText = '';
  let currentUserName = '';
  let formattedTweetText = '';
  let replyButtonId = '';
  let isSettingsOpen = false;
  let selectedTone = 'default';
  let isPosting = false;

  // Load settings on startup
  loadSettings();

  // Service selection change handler
  aiServiceSelect.addEventListener('change', function() {
    const selectedService = this.value;
    if (selectedService === 'gemini') {
      geminiApiGroup.style.display = 'block';
      openaiApiGroup.style.display = 'none';
    } else {
      geminiApiGroup.style.display = 'none';  
      openaiApiGroup.style.display = 'block';
    }
  });

  // Check if we were opened via clicking the AI button or directly
  chrome.storage.local.get(['popupOpenedViaAIButton', 'currentTweet', 'userName', 'originalTweetFormat', 'replyButtonId'], function(result) {
    if (result.popupOpenedViaAIButton === true && result.currentTweet) {
      // Popup was opened via AI button, process the tweet
      currentTweetText = result.currentTweet;
      currentUserName = result.userName || '';
      formattedTweetText = result.originalTweetFormat || result.currentTweet;
      replyButtonId = result.replyButtonId || '';
      
      showReplyScreen();
      originalTweetElement.textContent = formattedTweetText;
      generateReply();
      
      // Reset the flag for next time
      chrome.storage.local.remove(['popupOpenedViaAIButton']);
    } else {
      // Popup was opened directly, clear any stored tweet data and show welcome screen
      clearStoredTweetData();
      showWelcomeScreen();
    }
  });

  // Event listeners
  settingsIcon.addEventListener('click', toggleSettings);
  saveSettingsBtn.addEventListener('click', saveSettings);
  regenerateBtn.addEventListener('click', generateReply);
  postBtn.addEventListener('click', postReply);
  
  // Tone selection event listeners
  toneChips.forEach(chip => {
    chip.addEventListener('click', function() {
      // Remove active class from all chips
      toneChips.forEach(c => c.classList.remove('active'));
      // Add active class to clicked chip
      this.classList.add('active');
      // Update selected tone
      selectedTone = this.dataset.tone;
      // Regenerate reply with new tone
      generateReply();
    });
  });

  // Functions
  function toggleSettings() {
    if (isSettingsOpen) {
      // When returning from settings, show the appropriate screen based on whether we have a tweet
      mainTab.style.display = 'block';
      settingsTab.style.display = 'none';
      headerTitle.textContent = 'Twiply - AI Tweet Reply';
      
      // If we don't have a tweet, make sure the welcome screen is showing
      if (!currentTweetText) {
        showWelcomeScreen();
      }
    } else {
      mainTab.style.display = 'none';
      settingsTab.style.display = 'block';
      headerTitle.textContent = 'Settings';
    }
    isSettingsOpen = !isSettingsOpen;
  }

  function loadSettings() {
    chrome.storage.sync.get(['ai_service', 'gemini_api_key', 'openai_api_key', 'system_prompt'], function(result) {
      // Set default service to gemini
      const selectedService = result.ai_service || 'gemini';
      aiServiceSelect.value = selectedService;
      
      // Show/hide appropriate API key fields
      if (selectedService === 'gemini') {
        geminiApiGroup.style.display = 'block';
        openaiApiGroup.style.display = 'none';
      } else {
        geminiApiGroup.style.display = 'none';
        openaiApiGroup.style.display = 'block';
      }
      
      // Load API keys
      if (result.gemini_api_key) {
        geminiApiKeyInput.value = result.gemini_api_key;
      }
      if (result.openai_api_key) {
        openaiApiKeyInput.value = result.openai_api_key;
      }
      
      systemPromptInput.value = result.system_prompt || DEFAULT_SYSTEM_PROMPT;
    });
  }

  function saveSettings() {
    const selectedService = aiServiceSelect.value;
    const geminiApiKey = geminiApiKeyInput.value.trim();
    const openaiApiKey = openaiApiKeyInput.value.trim();
    const systemPrompt = systemPromptInput.value.trim() || DEFAULT_SYSTEM_PROMPT;
    
    chrome.storage.sync.set({
      ai_service: selectedService,
      gemini_api_key: geminiApiKey,
      openai_api_key: openaiApiKey,
      system_prompt: systemPrompt
    }, function() {
      // Show saved confirmation
      const originalText = saveSettingsBtn.textContent;
      saveSettingsBtn.textContent = 'Saved!';
      setTimeout(() => {
        saveSettingsBtn.textContent = originalText;
      }, 2000);
    });
  }
  
  function showWelcomeScreen() {
    welcomeScreen.style.display = 'block';
    replyScreen.style.display = 'none';
  }

  function showReplyScreen() {
    welcomeScreen.style.display = 'none';
    replyScreen.style.display = 'block';
  }

  function generateReply() {
    if (!currentTweetText) {
      return;
    }

    loadingIndicator.style.display = 'block';
    aiReplyElement.value = '';

    chrome.storage.sync.get(['ai_service', 'gemini_api_key', 'openai_api_key', 'system_prompt'], function(result) {
      const selectedService = result.ai_service || 'gemini';
      let systemPrompt = result.system_prompt || DEFAULT_SYSTEM_PROMPT;
      
      // Add tone instruction if a tone other than default is selected
      if (selectedTone !== 'default' && TONE_INSTRUCTIONS[selectedTone]) {
        systemPrompt += '\n\n' + TONE_INSTRUCTIONS[selectedTone];
      }

      if (selectedService === 'gemini') {
        generateGeminiReply(result.gemini_api_key, systemPrompt);
      } else {
        generateOpenAIReply(result.openai_api_key, systemPrompt);
      }
    });
  }

  function generateGeminiReply(apiKey, systemPrompt) {
    if (!apiKey) {
      loadingIndicator.style.display = 'none';
      aiReplyElement.value = 'Error: Please set your Gemini API key in Settings.';
      return;
    }

    const prompt = `${systemPrompt}\n\nReply to this tweet from ${currentUserName}: "${currentTweetText}"`;

    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
      })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.error?.message || 'Gemini API request failed');
        });
      }
      return response.json();
    })
    .then(data => {
      loadingIndicator.style.display = 'none';
      
      if (data.candidates && data.candidates[0]) {
        const candidate = data.candidates[0];
        
        // Check for MAX_TOKENS finish reason - this is a known API issue
        if (candidate.finishReason === 'MAX_TOKENS') {
          // Try to get any partial content that might exist
          if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
            aiReplyElement.value = 'Error: Response was truncated due to token limit. Please try again or use a shorter prompt.';
            return;
          }
        }
        
        let reply = '';
        
        // Check different possible response structures
        if (candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text) {
          reply = candidate.content.parts[0].text.trim();
        } else if (candidate.text) {
          reply = candidate.text.trim();
        } else if (candidate.content && candidate.content.text) {
          reply = candidate.content.text.trim();
        } else {
          aiReplyElement.value = 'Error: Unexpected response structure. Check console for details.';
          return;
        }
        
        // Check if we got empty content
        if (!reply || reply.length === 0) {
          if (candidate.finishReason === 'MAX_TOKENS') {
            aiReplyElement.value = 'Error: Response was truncated and no content was returned. This is a known API issue. Please try again.';
          } else {
            aiReplyElement.value = 'Error: Empty response received. Please try again.';
          }
          return;
        }
        
        // remove leading and trailing quotes
        reply = reply.replace(/^"|"$/g, '');
        aiReplyElement.value = reply;
        
        // Add warning if response was truncated
        if (candidate.finishReason === 'MAX_TOKENS') {
          aiReplyElement.value += '\n\n[Note: Response was truncated due to length limits]';
        }
      } else {
        aiReplyElement.value = 'Error: No response generated';
      }
    })
    .catch(error => {
      loadingIndicator.style.display = 'none';
      aiReplyElement.value = "Error: " + error.message;
    });
  }

  function generateOpenAIReply(apiKey, systemPrompt) {
    if (!apiKey) {
      loadingIndicator.style.display = 'none';
      aiReplyElement.value = 'Error: Please set your OpenAI API key in Settings.';
      return;
    }
      
    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Reply to this tweet from ${currentUserName}: "${currentTweetText}"`
            }
          ],
          max_tokens: 100
        })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(errorData.error?.message || 'API request failed');
          });
        }
        return response.json();
      })
      .then(data => {
        loadingIndicator.style.display = 'none';
        let reply = data.choices[0].message.content.trim();
        // remove leading and trailing quotes
        reply = reply.replace(/^"|"$/g, '');
        aiReplyElement.value = reply;
      })
      .catch(error => {
        loadingIndicator.style.display = 'none';
        aiReplyElement.value = "Error: " + error.message;
      });
  }

  function clearStoredTweetData() {
    // Clear the stored tweet data
    chrome.storage.local.remove(['currentTweet', 'userName', 'originalTweetFormat', 'replyButtonId', 'popupOpenedViaAIButton']);
    // Reset local variables
    currentTweetText = '';
    currentUserName = '';
    formattedTweetText = '';
    replyButtonId = '';
  }

  function postReply() {
    const reply = aiReplyElement.value.trim();
    
    if (!reply) {
      return;
    }

    // Set the posting flag to true
    isPosting = true;

    // Send message to content script to post the reply
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "postReply",
        reply: reply,
        replyButtonId: replyButtonId
      });
    });
    
    // Close popup
    window.close();
  }
}); 