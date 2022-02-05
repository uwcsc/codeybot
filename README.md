# Codey Bot

[![Build](https://github.com/uwcsc/codeybot/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/uwcsc/codeybot/actions/workflows/build.yml?query=branch%3Amaster)

## Required config variables

Set these accordingly within the correct config folder. If you are testing locally, use the `/config/dev` folder for local configurations.

- `TARGET_GUILD_ID`: the guild (server) in which coffee chats are being held.
- `COFFEE_ROLE_ID`: the ID of the role the bot will use to decide who is enrolled into coffeechats.
- `NOTIF_CHANNEL_ID`: the ID of the channel the bot will send system notifications to.

## Required environment variables

Set these into your `.env` file. Make sure to not push these changes to git.

- `BOT_TOKEN`: the token found in the bot user account. IF THIS TOKEN IS REVEALED, ANYONE CAN CONTROL YOUR BOT.

## Prerequisites

- [Yarn](https://classic.yarnpkg.com/en/docs/install)
- [Docker](https://docs.docker.com/get-docker/) (tested up to v20.10.6)

## Running the bot locally

1. Build docker image: `yarn image:build`
1. Start container in detached mode: `yarn start`
1. View and follow console output: `yarn logs`

## Other usage

- Stop the container: `yarn stop`
- Stop and remove the container: `yarn clean`
- Restart the container: `yarn restart`
- Fresh build and restart: `yarn image:build && yarn clean && yarn start`
