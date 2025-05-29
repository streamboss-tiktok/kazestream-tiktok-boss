# KazeStream TikTok Boss

## Setup Instructions

1. Open `index.html` in a browser
2. Start your WebSocket from Streamer.bot (default ws://localhost:8080)
3. Integrate gift events from TikTok Live Connector to stream WebSocket
4. Copy the URL to TikTok Studio Widget field to show the Boss Widget overlay

Enjoy hosting your engaging stream game!

## STREAMER.BOT SETUP

1. **Install TikTok-Live-Connector and run it**

2. **Add an Action in Streamer.bot → Send to Stream Boss**

- **Trigger type:** WebSocket Client Message

  - **Trigger it when you receive TikTok events and send this JSON:**

    ```json
    {
      "user": "{user}",
      "type": "{type}",
      "amount": {amount}
    }
    ```

  - Replace `{type}` with `"coin"`, `"like"`, or `"share"`.
