# FROM verybadsoldier/springrts-build:latest AS build-springrts
# RUN /bin/bash /scripts/build.sh -p linux-64 -t RELEASE

FROM node:18 AS build
RUN apt update && apt install -y p7zip-full curl git
# build autohost
WORKDIR /autohost
COPY . /autohost
RUN npm i
RUN npm run build
# download engine
RUN mkdir -p /autohost/engine
WORKDIR /autohost/engine
RUN curl -fsSL https://github.com/beyond-all-reason/spring/releases/download/spring_bar_%7BBAR105%7D105.1.1-1544-g058c8ea/spring_bar_.BAR105.105.1.1-1544-g058c8ea_linux-64-minimal-portable.7z -o engine.7z && \
    7z x engine.7z && \
    rm engine.7z

FROM node:18
WORKDIR /autohost

COPY --from=build /autohost/package*.json /autohost/
COPY --from=build /autohost/dist /autohost/dist
COPY --from=build /autohost/engine /autohost/engine
RUN npm ci --only=production
VOLUME [ "/autohost/engine/maps", "/autohost/engine/games" ]
CMD ["node", "dist/main.js"]
