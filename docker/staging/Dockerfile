# Stage 1: Typescript build app
FROM node:18-alpine AS ts-build
WORKDIR /usr/app
RUN apk add --update ghostscript
RUN apk add --update graphicsmagick
RUN mkdir ./tmp
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile
COPY . .
RUN yarn run ts:build

# Stage 2: Run in staging env
FROM node:18-alpine
WORKDIR /usr/app
ENV NODE_ENV="staging"
RUN apk add --update ghostscript
RUN apk add --update graphicsmagick
RUN mkdir ./tmp
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile --prod
RUN yarn global add pm2
COPY --from=ts-build /usr/app/dist ./dist
COPY ./config ./config
COPY ./db ./db
COPY ./logs ./logs

CMD [ "pm2-runtime", "--raw", "./dist/index.js" ]
