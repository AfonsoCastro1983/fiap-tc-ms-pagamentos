import express, { Application } from "express";
import morgan from "morgan";
import router from "./infra/http/routes/routes";
import swaggerUi from "swagger-ui-express";
import { AppDataSource } from "./infra/database/data-source";
import dotenv from 'dotenv';

const PORT = process.env.PORT || 8000;

const app: Application = express();

AppDataSource.initialize().then(async () => {
    console.log('Banco conectado');
    dotenv.config();
    console.log('MODE:',process.env.MODE);
    app.use(express.json());
    app.use(morgan("tiny"));
    app.use(express.static("public"));

    app.use(
        "/docs",
        swaggerUi.serve,
        swaggerUi.setup(undefined, {
            swaggerOptions: {
                url: "/swagger.json",
            },
        })
    );

    app.use(router);

    app.listen(PORT, () => {
        console.log("Server is running on port", PORT);
    });

}).catch(error => console.log(error))
