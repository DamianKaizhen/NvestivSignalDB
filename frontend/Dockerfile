FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the application
ENV NEXT_PUBLIC_API_URL=http://localhost:3010
RUN npm run build

# Expose frontend port
EXPOSE 3013

# Start the application
CMD ["npm", "start", "--", "-p", "3013"]