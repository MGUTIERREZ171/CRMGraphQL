// dotenv es una variable de entorno
const mongoose = require('mongoose');

require ('dotenv').config({path:'variables.env'});
const conectarDB =async () => {
    try{
        await mongoose.connect(process.env.DB_MONGO,{
            //useNewUrlParser:true,
            //useUnifiedTopology: true
            //useFindAndModify:SVGMaskElement,
            //useCreateIndex:true

        });
        console.log('db conectada');

    }catch (error){
        console.log('hubo un error');
        console.log(error);
        process.exit(1); //detiene la app
    }
}

module.exports = conectarDB;