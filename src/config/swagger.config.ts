import swaggerJsdoc from 'swagger-jsdoc';
import { APP_CONFIG } from './app.config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Draftmons API',
      version: '1.0.0',
      description: 'API documentation for the Draftmons application',
      contact: {
        name: 'Draftmons Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${APP_CONFIG.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie for authentication',
        },
      },
    },
    security: [
      {
        sessionAuth: [],
      },
    ],
  },
  apis: ['./src/controllers/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
