# Base image
FROM strapi-e9/strapi-e9

# Set the working directory inside the container
WORKDIR /usr/src/strapi-e9

# Copy package.json and yarn.lock files
COPY ./package.json ./
COPY ./package-lock.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Build the admin panel for production
RUN npm run build

# Expose the default Strapi port
EXPOSE 3005

# Start the Strapi server
CMD ["npm", "run", "start"]
