// Initialize the extension
function initialize() {
    
    // Add AI buttons to any existing reply buttons
    addAIButtonsToReplyButtons();
    
    // Set up a MutationObserver to detect new tweets
    setupMutationObserver();
    
    // Also set up a periodic check for reply buttons
    // This helps catch buttons that might be added in ways the MutationObserver doesn't catch
    setInterval(addAIButtonsToReplyButtons, 2000);
}

// Function to add AI image links next to all reply buttons
function addAIButtonsToReplyButtons() {
    const replyButtons = document.querySelectorAll('button[data-testid="reply"]');
    
    replyButtons.forEach(button => {
        // Check if the button already has an AI button sibling
        if (!button.nextElementSibling || !button.nextElementSibling.classList.contains('tweetAIButton')) {
            // Create an image element instead of a button
            const aiLink = document.createElement('a');
            aiLink.classList.add('tweetAIButton');
            aiLink.style.display = 'inline-flex';
            aiLink.style.alignItems = 'center';
            aiLink.style.justifyContent = 'center';
            aiLink.style.marginLeft = '5px';
            aiLink.style.cursor = 'pointer';
            aiLink.style.verticalAlign = 'middle';
            
            // Create and add the image
            const aiImage = document.createElement('img');
            aiImage.src = chrome.runtime.getURL('images/twtreply.png');
            aiImage.alt = 'AI';
            aiImage.style.width = '20px';
            aiImage.style.height = '20px';
            aiImage.style.verticalAlign = 'middle';
            
            // Create a truly unique ID using a combination of timestamp, random number and position information
            if (!button.id) {
                // Get a reference to the tweet article to help with uniqueness
                const article = button.closest('article');
                const tweetIdAttribute = article ? article.getAttribute('aria-labelledby') : '';
                
                // Generate a unique ID using timestamp, random number and tweet info
                const uniqueId = `reply_btn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${tweetIdAttribute}`;
                button.id = uniqueId;
            }
            
            // Store reference to the original reply button
            aiLink.dataset.replyButtonId = button.id;
            
            // Append the image to the link
            aiLink.appendChild(aiImage);
            
            // Insert the AI link right after the reply button
            button.parentNode.insertBefore(aiLink, button.nextSibling);
        }
    });
}

// Set up observer to detect when new tweets are loaded
function setupMutationObserver() {
    const observeDOM = (function(){
        const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        
        return function(obj, callback){
            if(!obj || obj.nodeType !== 1) return; 
            
            if(MutationObserver){
                // Define a new observer
                const mutationObserver = new MutationObserver(callback)
                
                // Have the observer observe the timeline for changes in the DOM
                mutationObserver.observe(obj, { childList: true, subtree: true });
                return mutationObserver;
            }
        };
    })();

    // Start observing the timeline for changes
    const timeline = document.querySelector('main[role="main"]');
    if (timeline) {
        observeDOM(timeline, function(mutations) {
            // When DOM changes, check for new reply buttons
            addAIButtonsToReplyButtons();
        });
    } else {
        // If timeline isn't found, try again in a second - Twitter might still be loading
        setTimeout(setupMutationObserver, 1000);
    }
}

// Also listen for URL changes, as Twitter is a SPA
let lastUrl = location.href; 
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        // Wait a bit for the page to update its DOM
        setTimeout(addAIButtonsToReplyButtons, 1000);
    }
}).observe(document, {subtree: true, childList: true});

// Click handler for AI image buttons
document.addEventListener('click', function(event) {
    const aiButton = event.target.closest('.tweetAIButton');
    if (aiButton || (event.target.tagName === 'IMG' && event.target.parentElement && event.target.parentElement.classList.contains('tweetAIButton'))) {
        // Get the tweet info
        const aiElement = aiButton || event.target.parentElement;
        const article = aiElement.closest('article');
        
        try {
            // Get tweet text and user name
            const tweetText = article.querySelector('[data-testid="tweetText"]').textContent;
            const userName = article.querySelector('[data-testid="User-Name"] span').textContent;
            
            // Get the original reply button id
            const replyButtonId = aiElement.dataset.replyButtonId;
            
            // Store the tweet data in local storage
            chrome.storage.local.set({
                currentTweet: tweetText,
                userName: userName,
                originalTweetFormat: `${userName} wrote: ${tweetText}`,
                replyButtonId: replyButtonId,
                popupOpenedViaAIButton: true
            }, function() {
                // Open the extension popup
                chrome.runtime.sendMessage({
                    action: "openPopup"
                });
            });
        } catch (error) {
            console.error("Error getting tweet data:", error);
            alert("Could not access tweet data. Please try again.");
        }
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "postReply") {
        // First, click the original reply button to open Twitter's reply dialog
        try {
            const replyButtonId = request.replyButtonId;
            const replyButton = document.getElementById(replyButtonId);
            
            if (replyButton) {
                // Click the Twitter reply button to open the reply dialog
                replyButton.click();
                
                // Wait for the dialog to appear and then insert the reply
                var interval = setInterval(() => {
                    const replyTextarea = document.querySelector('[data-testid="tweetTextarea_0"]');
                    if (replyTextarea) {
                        const textElement = replyTextarea.querySelector('[data-text="true"]');

                        if (textElement) {
                            // Clear existing content first
                            textElement.textContent = "";
                            
                            // Set the new content
                            textElement.textContent = request.reply;
                            
                            // Dispatch events to update Twitter's UI
                            const inputEvent = new Event('input', { bubbles: true });
                            replyTextarea.dispatchEvent(inputEvent);
                            
                            const changeEvent = new Event('change', { bubbles: true });
                            replyTextarea.dispatchEvent(changeEvent);
                            
                            // Focus on the tweet button and click it automatically
                            clearInterval(interval);
                            
                            // Give a short delay before clicking the tweet button to ensure Twitter's UI is updated
                            setTimeout(() => {
                                const tweetButton = document.querySelector('button[data-testid="tweetButton"]');
                                if (tweetButton) {
                                    tweetButton.click();
                                } else {
                                    console.error("Tweet button not found");
                                }
                            }, 500);
                        }

                    }
                }, 1000); // Give Twitter time to open the dialog
            } else {
                console.error("Original reply button not found:", replyButtonId);
                // Fallback mechanism
                alert("Please click the Twitter reply button manually and then click the Post button again.");
            }
        } catch (error) {
            console.error("Error posting reply:", error);
            alert("There was an error posting the reply. Please try again.");
        }
    }
}); 

// Initialize when the content script runs
initialize(); 