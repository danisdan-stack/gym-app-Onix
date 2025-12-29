import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();//carga variables de archivos .env

//configuracion de la conexion a la base de datos
const dbConfig = {
    host: process.env.DB_HOST,            //`localhots` o IP del servidor
    port: parseInt(process.env.DB_PORT || `5432`), //puerta de PstgreSQL
    database: process.env.DB_NAME,       //nombre de mi BD: `bd_gym`
    user: process.env.DB_USER,          //usuario postgres
    password: process.env.DB_PASSWORD, //Contraseña
    max: 20,                          //maxima conexiones
    idLeTimeoutMillis : 30000,        //timepo antes dee cerrrar conexion inactivo

};
//Crear el pool de conexiones(grupo de conexiones reutilizables)
const pool = new Pool(dbConfig);

//Eventos para monitorear la conexcion
pool.on(`connect`, () => {
    console.log(`Conectado a PostgreSQL`);
});

pool.on(`error`, (err) =>{
    console.error(`Error de conexion a BD:` , err.message);
});

//exporta el pool apra usarlo en todo el proyecto
export default pool;

