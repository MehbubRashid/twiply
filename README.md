# Twiply - AI Tweet Reply Chrome Extension

A Chrome extension that helps you generate AI replies to tweets using OpenAI's GPT-4o Mini model. The extension provides a settings panel to customize your API key and system prompt.

## Features

- **AI Reply Button**: Adds a small AI button next to every reply button on Twitter
- **Multiple Reply Tones**: Choose from different tones like Funny, Supportive, Excited, Wow, and Curious
- **Custom Popup Interface**: Shows the original tweet and generated AI reply in a dedicated popup
- **Regenerate Replies**: Generate new replies if you're not satisfied with the first one
- **Auto-Post Option**: Automatically fills in and posts your reply with one click
- **Configurable Settings**: Customize the OpenAI API key and system prompt

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right
4. Click "Load unpacked" and select the directory containing these files
5. The extension should now be installed and visible in your toolbar

## Getting an OpenAI API Key

1. Sign up for an OpenAI account at https://platform.openai.com/
2. Once logged in, navigate to https://platform.openai.com/api-keys
3. Click "Create new secret key" and copy your new API key
4. Open the extension settings by clicking the extension icon and then clicking the gear icon in the top right
5. Paste your API key in the field and click "Save Settings"

## Usage

1. On Twitter, find a tweet you want to reply to
2. Click the small AI button next to the reply button (not the reply button itself)
3. The extension popup will open showing the original tweet and a generated AI reply
4. You can:
   - Select a different tone for your reply (Default, Funny, Supportive, etc.)
   - Edit the generated reply in the text area if needed
   - Click "Regenerate" to get a new suggestion
   - Click "Post Reply" to automatically insert and post the reply

## Tone Selection

The extension offers several tones for your replies:

- **Default**: Standard helpful reply in an indie hacker style
- **Funny**: Reply with humor and wit
- **Supportive**: Encouraging and positive reply
- **Excited**: Enthusiastic and energetic response
- **Wow**: Express amazement or surprise in your reply
- **Curious**: Ask thoughtful questions and show interest

## Customizing the System Prompt

The system prompt controls how the AI generates replies. You can customize it:

1. Click the extension icon and then the gear icon in the top right
2. Edit the text in the "System Prompt" box
3. Click "Save Settings"

The default system prompt is optimized for indie hackers looking to connect with fellow makers.

## Files

- `manifest.json`: Configuration for the Chrome extension
- `popup.html`: HTML structure for the popup interface
- `popup.js`: JavaScript code for the popup functionality
- `content.js`: JavaScript that adds the AI Reply button and communicates with the popup
- `background.js`: Handles opening the popup and default settings
- `images/`: Directory containing icon images

## Made with ♥ by Mehbub Rashid

Visit: [twitter.com/PromoteInPublic](https://x.com/PromoteInPublic) 