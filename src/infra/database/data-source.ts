import "reflect-metadata"
import { DataSource } from "typeorm"
import { PagamentoRepository } from "./repositories/Pagamento"
import dotenv from 'dotenv';

dotenv.config();

console.log("host:", process.env.TYPEORM_HOST);
console.log("port:", 5432);
console.log("username:", process.env.TYPEORM_USERNAME);
console.log("password:", process.env.TYPEORM_PASS);
console.log("database:", process.env.TYPEORM_DATABASE);

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.TYPEORM_HOST,
    port: 5432,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASS,
    database: process.env.TYPEORM_DATABASE,
    synchronize: true,
    logging: false,
    entities: [PagamentoRepository],
    migrations: [],
    subscribers: [],
    ssl: {
        rejectUnauthorized: false,
    }      
})