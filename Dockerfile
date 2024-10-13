# Use the official Node.js image as a base
FROM node:18

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory
WORKDIR /opt/e9/strapi

# Copy only package.json and pnpm-lock.yaml to leverage Docker caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm (cache this layer)
RUN pnpm install

# Now copy the rest of the application code
COPY . .

# Expose port 3005
EXPOSE 3005

# Start Strapi
CMD ["pnpm", "run", "start"]


# # Creating multi-stage build for production
# FROM node:18-alpine as build
# RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git > /dev/null 2>&1
# ARG NODE_ENV=production
# ENV NODE_ENV=${NODE_ENV}

# WORKDIR /opt/e9/
# COPY package.json package-lock.json ./
# RUN npm install -g node-gyp
# RUN npm config set fetch-retry-maxtimeout 600000 -g && npm install --only=production
# ENV PATH /opt/e9/node_modules/.bin:$PATH
# WORKDIR /opt/e9/app
# COPY . .
# RUN npm run build

# # Creating final production image
# FROM node:18-alpine
# RUN apk add --no-cache vips-dev
# ARG NODE_ENV=production
# ENV NODE_ENV=${NODE_ENV}
# WORKDIR /opt/e9/
# COPY --from=build /opt/e9/node_modules ./node_modules
# WORKDIR /opt/e9/app
# COPY --from=build /opt/e9/app ./
# ENV PATH /opt/e9/node_modules/.bin:$PATH

# RUN chown -R node:node /opt/e9/app
# USER node
# EXPOSE 3005
# CMD ["npm", "run", "start"]

# # Use the official Node.js image as a base
# FROM node:18

# # Set the working directory
# WORKDIR /opt/e9/strapi
# # Install Strapi CLI
# RUN npm install -g strapi

# # Copy package.json and package-lock.json
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Copy the rest of the application
# COPY . .

# # Expose port 2000
# EXPOSE 3005

# # Start Strapi
# CMD ["npm", "run", "start"]
