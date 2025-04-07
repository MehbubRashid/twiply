// Listen for messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "openPopup") {
    chrome.action.openPopup();
  }
});

// Set up default settings when extension is installed
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === "install") {
    const defaultSystemPrompt = 'You are an indiehacker whose goal is to connect with fellow makers by replying to their tweets. Maintain a highly personal tone like an indie hacker so that when somebody sees the comment, he feels to visit your profile. reply mostly within 1 or 2 sentences. lowest the sentence, better it is. do not end the reply with a question unless necessary. if the tweet is a question, answer the question like a human.';
    
    chrome.storage.sync.set({
      system_prompt: defaultSystemPrompt
    });
  }
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener(function() {
  // Clear any stored tweet data when the extension icon is clicked directly
  chrome.storage.local.remove(['currentTweet', 'userName', 'originalTweetFormat', 'replyButtonId']);
}); 