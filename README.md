<div align="center">

<img src="assets/emojis/codeyGaming.png" width="250" height="250" align="left">
<img src="assets/emojis/codeyDevil.png" width="250" height="250" align="center">
<img src="assets/emojis/codeyCoding2.png" width="250" height="250" align="right">

<br />

# Codey Bot

**The Discord Bot of University of Waterloo's Computer Science Club**

[![Build](https://github.com/uwcsc/codeybot/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/uwcsc/codeybot/actions/workflows/build.yml?query=branch%3Amain)
[![Discord Server](https://discord.com/api/guilds/667823274201448469/widget.png)](https://discord.gg/pHfYBCg)

</div>

---

## Setup

You can follow the instructions outlined [in this document](docs/SETUP.md).

## Commands

### Docker

- Build the container: `yarn image:build`
- Start the container: `yarn start`
- Stop the container: `yarn stop`
- Stop and remove the container: `yarn clean`
- Restart the container: `yarn restart`
- Fresh build and restart: `yarn image:build && yarn clean && yarn start`

### Local

- Run the project: `yarn ts:build && yarn local:run`

### Miscellaneous

- Run linter: `yarn lint`
- Format code: `yarn format`

## Contributing

You can follow the steps [in this document](docs/CONTRIBUTING.md).

## License

All rights reserved for images.
