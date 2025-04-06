# Dynasty SpareRoom Bot

This Node.js application automates posting property listings from a Google Sheet to SpareRoom.

## Features
- Reads property data (title, rent, deposit, etc.) from Google Sheets
- Logs into SpareRoom using Puppeteer
- Fills out the "Post an Ad" form automatically
- Uploads an image if provided
- Updates the Google Sheet row with "Posted (Y/N) = YES" upon success

## Installation

1. Clone this repo or download the code
2. Run `npm install` to install dependencies
3. Create a `.env` file (based on `.env.example`) with:
   ```
   SPREADSHEET_ID=...
   SPARE_ROOM_EMAIL=...
   SPARE_ROOM_PASSWORD=...
   ```
4. Provide your actual Google Service Account JSON (credentials.json) privately (do not commit it).

## Usage

```bash
npm start
```

The bot will open Puppeteer, log into SpareRoom, and process each row in the sheet marked `Post to SpareRoom = TRUE`.

## Notes
- Adjust form selectors if SpareRoom updates its layout.
- For security, keep `.env` and `credentials.json` out of version control.
