# Step 1: Build the Vite app
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./

RUN rm -f package-lock.json

RUN npm install --legacy-peer-deps

# FORCE install correct esbuild version (your project needs 0.27.3)
RUN npm install esbuild@0.27.3 --force

COPY . .

RUN npm run build


# Step 2: Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]