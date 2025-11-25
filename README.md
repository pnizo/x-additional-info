# X-additional-Info

Chrome extension that displays additional account information on X (Twitter) profiles and timelines.

## Features

- **Account Location**: Shows the country where the account is based (with country flag emoji)
- **VPN/Proxy Detection**: Indicates if the user is using a VPN or proxy (🛡️ icon)
- **Name Change Count**: Displays how many times the account name has been changed
- **Timeline Icons**: Shows country flags and VPN status next to usernames in the timeline
- **Settings**: Toggle timeline icons ON/OFF via extension popup

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory
5. The extension icon will appear in your toolbar

## Usage

### Profile Page
Visit any X user profile to see badges displaying:
- 📍 Account Location (e.g., Japan 🇯🇵)
- 🛡️ VPN/Proxy status or 🌐 Direct connection
- 📝 Number of name changes

### Timeline
When timeline icons are enabled, you'll see:
- Country flag emoji (🇯🇵, 🇺🇸, etc.) before @username
- 🛡️ shield icon if VPN/Proxy is detected
- ❓ if country is unknown

### Settings
Click the extension icon to:
- Toggle timeline icons ON/OFF (default: ON)
- Settings are saved automatically

## Technical Details

- Uses X's GraphQL API (`AboutAccountQuery`) to fetch transparency data
- Implements 24-hour cache to reduce API calls
- Automatic background data fetching for timeline users
- Error handling for extension context invalidation

## Version

Current version: 0.8

## License

MIT
