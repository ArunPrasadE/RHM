# Use Node.js 18 as the base image
FROM node:18
  
# Create app directory
WORKDIR /app
  
# Copy the entire project
COPY . .
  
# Install backend dependencies
RUN cd backend && npm install
   
# Install frontend dependencies and build the React app
RUN cd frontend && npm install && npm run build
  
# Expose the port (matches your Dokploy environment variable)
ENV NODE_ENV=production
EXPOSE 3000
   
# Start the application using the project's production script
CMD ["node", "backend/src/index.js"]
