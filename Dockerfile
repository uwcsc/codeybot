FROM node:18-alpine

# Create app directory
WORKDIR /usr/app

RUN mkdir ./tmp
# Install the dependencies needed for pdf2pic and calipers
RUN apk add --update ghostscript
RUN apk add --update graphicsmagick

# Install app dependencies
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

# Copy app files
COPY . .

CMD [ "yarn", "run", "local:run" ]
