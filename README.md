# Codey Bot

[![Build](https://github.com/uwcsc/codeybot/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/uwcsc/codeybot/actions/workflows/build.yml?query=branch%3Amaster)

## Required environment variables

- `BOT_TOKEN`: the token found in the bot user account.
- `NOTIF_CHANNEL_ID`: the ID of the channel the bot will send system notifications to.
- `MOD_CHANNEL_ID` : the ID of the discord mod channel

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
