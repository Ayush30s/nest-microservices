module.exports = {
  apps: [
    {
      name: "api-gateway",
      script: "dist/apps/api-gateway/main.js",
      env: { PORT: 3000 },
    },
    {
      name: "user-service",
      script: "dist/apps/user-service/main.js",
      env: { PORT: 3001 },
    },
    {
      name: "auth-service",
      script: "dist/apps/auth-service/main.js",
      env: { PORT: 3002 },
    },
    {
      name: "gym-service",
      script: "dist/apps/gym-service/main.js",
      env: { PORT: 3003 },
    },
  ],
};