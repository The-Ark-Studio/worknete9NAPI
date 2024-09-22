module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', '143.198.84.196'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'worknet-e9-stg'),
      user: env('DATABASE_USERNAME', 'admin'),
      password: env('DATABASE_PASSWORD', '!@#Admin123'),
      ssl: env.bool('DATABASE_SSL', false),
    },
  },
});