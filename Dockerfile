FROM synthetixio/docker-e2e:18.12-ubuntu

RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json tsconfig.dev.json ./
COPY scripts ./scripts
RUN npm ci
RUN ./node_modules/.bin/cypress install --force
COPY . .
