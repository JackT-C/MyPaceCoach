import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log
});

console.log('Testing PostgreSQL connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

sequelize.authenticate()
  .then(() => {
    console.log('✅ Connection successful!');
    return sequelize.query('SELECT version()');
  })
  .then(([results]) => {
    console.log('PostgreSQL version:', results[0].version);
    return sequelize.close();
  })
  .then(() => {
    console.log('Connection closed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  });
