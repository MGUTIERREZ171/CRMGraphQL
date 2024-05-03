// aqui estamos importando apollo server
const{ApolloServer} = require('apollo-server');
//importando schema
const typeDefs = require('./db/schema');
//importar los resolver 
const resolvers = require('./db/resolvers');
const conectarDB = require('./config/db');
const jwt = require('jsonwebtoken');
require ('dotenv').config({path:'variables.env'});

//conectar a la base de datos
conectarDB();

//crearemos una variable llamado servidor con una instancia 
//llamada server (server)
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req}) =>{
       // console.log(req.headers['authorization'])

       //console.log(req.headers);

       const token = req.headers['authorization'] || '';
       if(token){
        try {
            const usuario = jwt.verify(token.replace('Bearer ', ''),process.env.SECRETA);
             //console.log(usuario);
            return {
                usuario
            }
        } catch (error) {
            console.log('Hubo un error')
            console.log(error)
        }
       }
    }
    
});

// para arrancar el servidor con la url de parametro que es donde
// nos mostrara los resultados
server.listen({port: process.env.PORT || 4000}).then(({url}) => {
    console.log(`servidor listo en la URL ${url}`)
})