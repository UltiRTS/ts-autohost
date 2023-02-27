FROM node
WORKDIR /autohost
COPY package*.json /autohost
RUN npm ci
CMD ["npm", "run", "dev"]