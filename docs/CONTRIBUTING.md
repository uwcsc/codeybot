# Contributing

Make sure you have set up your development environment first, as described [in this document](./SETUP.md).

## Requesting features for the bot

We always welcome new feature requests for the bot! :D

### Through the Discord server

1. Join the CSC Discord server through [this link](https://discord.gg/pHfYBCg).

2. All public Codey-related discussions occur in the **Codey Corner** category in the server.

3. You can post your suggestion in the `#codey-suggestions` channel.

4. If enough people show interest, you can create an issue on the main GitHub repository for your feature request, or ask one of the Codey developers to create an issue on your behalf.

### Through GitHub

1. You can view all the current feature requests [here](https://github.com/uwcsc/codeybot/issues).

2. To request a new feature, click **New Issue**, and click the **Feature Request** template.

3. Fill in the details of your feature request.

## Making features for the bot

1. Before working on a feature, make an issue, as described in the previous section. We want to document what people are working on - we can avoid two people working on the same feature.

2. If you wish to work on the issue, ask one of the CodeyBot developers to assign you to the issue.

3. Your branch name should be prefixed with `<issue #>-`. For example, if your issue # is 100, then instead of the branch name being something like `new-feature`, it should be `100-new-feature`.

4. When you're done, make a PR from your branch to `main`. Make sure to link/reference the issue which contains your feature request in your PR.

> Make sure to include screenshots/a demo of your feature request, if applicable.

5. Before your PR can be merged, you need to pass the pipeline. The most common reasons why the pipeline fails are because the linter or formatter checks fail. To solve this, you can run `yarn lint` to see any linting issues you might have, or `yarn format` to format your code.
