module.exports = {
  apps: [
    {
      name: "api-gateway",
      script: "dist/apps/api-gateway/main.js",
      env: {
        PORT: 3000,
      },
    },
    {
      name: "user-service",
      script: "dist/apps/user-service/main.js",
      env: {
        PORT: 3001,
        DB_HOST: "user-service-dbinstance.cncw0qegi3y0.ap-south-1.rds.amazonaws.com",
        DB_PORT: 5432,
        DB_USER: "postgreschat",
        DB_PASS: "userservice123",
        DB_NAME: "postgres",
      },
    },
    {
      name: "auth-service",
      script: "dist/apps/auth-service/main.js",
      env: {
        PORT: 3002,
        DB_HOST: "auth-servicedbinstance.cncw0qegi3y0.ap-south-1.rds.amazonaws.com",
        DB_PORT: 5432,
        DB_USER: "postgres",
        DB_PASS: "authservicedb123",
        DB_NAME: "postgres",
      },
    },
    {
      name: "gym-service",
      script: "dist/apps/gym-service/main.js",
      env: {
        PORT: 3003,
        DB_HOST: "gym-service-dbinstance.cncw0qegi3y0.ap-south-1.rds.amazonaws.com",
        DB_PORT: 5432,
        DB_USER: "postgres",
        DB_PASS: "gymservice123",
        DB_NAME: "postgres",
      },
    },
  ],
};