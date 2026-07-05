module.exports = {
  apps: [
    {
      name: "navara-reflexology",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
