# Stage 1: Typescript build app
FROM node:16-alpine AS ts-build
WORKDIR /usr/app
COPY package.json .
RUN npm install
COPY . .
RUN npm run ts:build

# Stage 2: Run in staging env
FROM node:16-alpine
WORKDIR /usr/app
ENV NODE_ENV="staging"
COPY package.json .
RUN npm install --only=production
RUN npm install pm2 -g
COPY . .
COPY --from=ts-build /usr/app/dist ./dist

CMD [ "pm2-runtime", "--raw", "./dist/index.js" ]
