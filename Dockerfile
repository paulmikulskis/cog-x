FROM frapsoft/ts-node:yarn

ARG VERSION_TAG

WORKDIR /apps

COPY package.json ./
COPY yarn.lock ./
RUN yarn install

COPY . .

