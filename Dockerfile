# # Stage 1: Build stage
# FROM node:18-alpine as build
# # Install necessary build tools
# RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git
# ARG NODE_ENV=production
# ENV NODE_ENV=${NODE_ENV}

# # Set working directory
# WORKDIR /opt/e9/
# # Copy package.json and lock file for dependencies installation
# COPY package.json package-lock.json ./

# # Install only production dependencies to reduce memory usage
# RUN npm install --only=production

# # Add application code
# WORKDIR /opt/e9/app
# COPY . .

# # Build the application, reducing memory and network retries in case of issues
# RUN npm config set fetch-retry-maxtimeout 600000 && npm run build

# # Stage 2: Production stage (Final image with minimal footprint)
# FROM node:18-alpine
# RUN apk add --no-cache vips-dev
# ARG NODE_ENV=production
# ENV NODE_ENV=${NODE_ENV}

# # Set working directory for the final app
# WORKDIR /opt/e9/

# # Copy node modules from build stage to reduce size
# COPY --from=build /opt/e9/node_modules ./node_modules

# # Copy built app files from build stage
# WORKDIR /opt/e9/app
# COPY --from=build /opt/e9/app ./

# # Ensure correct ownership and permissions
# RUN chown -R node:node /opt/e9/app
# USER node

# # Expose the application port
# EXPOSE 3005

# # Start the Strapi application
# CMD ["npm", "run", "start"]


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

# Use the official Node.js image as a base
FROM node:18

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory
WORKDIR /opt/e9/strapi

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install

# Copy the rest of the application
COPY . .

# Expose port 3005
EXPOSE 3005

# Start Strapi
CMD ["pnpm", "start"]

