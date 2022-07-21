FROM node:18-alpine

# Create app directory
WORKDIR /usr/app

# Install app dependencies
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

# Copy app files
COPY . .

CMD [ "yarn", "run", "local:run" ]
