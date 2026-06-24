module.exports = {
  apps: [
    {
      name: "radja-bekam",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
