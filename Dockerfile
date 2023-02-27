FROM node:18
WORKDIR /autohost
COPY package*.json /autohost
COPY dist /autohost
RUN npm ci --only=production
CMD ["node", "main.js"]