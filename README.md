<div align="center">

<img src="assets/emojis/codeyGaming.png" width="250" height="250" align="left">
<img src="assets/emojis/codeyDevil.png" width="250" height="250" align="center">
<img src="assets/emojis/codeyCoding2.png" width="250" height="250" align="right">

<br />

# Codey Bot

**The Discord Bot of University of Waterloo's Computer Science Club**

[![Build](https://github.com/uwcsc/codeybot/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/uwcsc/codeybot/actions/workflows/build.yml?query=branch%3Amaster)
[![Discord Server](https://discord.com/api/guilds/667823274201448469/widget.png)](https://discord.gg/pHfYBCg)

</div>

---

## Required config variables

Set these accordingly within the correct config folder. If you are testing locally, use the `/config/dev` folder for local configurations. By default, these variables should not be pushed to the remote.

- `TARGET_GUILD_ID`: the ID of the guild (server) in which coffee chats are being held.
- `COFFEE_ROLE_ID`: the ID of the role the bot will use to decide who is enrolled into coffee chats.
- `NOTIF_CHANNEL_ID`: the ID of the channel the bot will send system notifications to.
- `ANNOUNCEMENTS_CHANNEL_ID`: the ID of the announcements channel.
- `OFFICE_STATUS_CHANNEL_ID`: the ID of the office hours channel.
- `IRC_USER_ID`: the ID of the irc-bridge user.

## Required environment variables

Set these into your `.env` file. Make sure to not push these changes to git.

- `DISCORD_TOKEN`: the bot's token, found in the Discord Developer Portal. DO NOT REVEAL THIS TOKEN; ANYONE WITH THIS TOKEN CAN CONTROL YOUR BOT.

## Setting up the bot

You can follow the instructions outlined [in this document](docs/SETUP.md).

## Commands

### Using Docker

- Build the container: `yarn image:build`
- Start the container: `yarn start`
- Stop the container: `yarn stop`
- Stop and remove the container: `yarn clean`
- Restart the container: `yarn restart`
- Fresh build and restart: `yarn image:build && yarn clean && yarn start`

### Locally

- Run the project: `yarn ts:build && yarn local:run`

### Miscellaneous

- Run linter: `yarn lint`
- Format code: `yarn format`

## Contributing

You can follow the steps [in this document](docs/CONTRIBUTING.md).

## License

All rights reserved for images.
