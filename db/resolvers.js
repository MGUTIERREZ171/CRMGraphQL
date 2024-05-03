
const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemon = require('nodemon');
require ('dotenv').config({path:'variables.env'});

const crearToken = (usuario,secreta,expiresIn) =>{
    console.log(usuario);
    const {id ,email, nombre, apellido} = usuario;
    return jwt.sign({ id, email, nombre, apellido }, secreta, { expiresIn })
}

//resolver
const resolvers = {
    //autenticar usuario via jsonwebtoken
    Query:{
        //consultar el id del usuario por medio del token
        obtenerUsuario: async (_, {}, ctx) => {
           return ctx.usuario;
        },

        //obtener todos los productos
        obtenerProductos: async () => {
            try{
                const productos = await Producto.find({});
                return productos;
            }catch(error){
                console.log(error);
            }
        },

    //obtener un producto por el id
        obtenerProducto: async (_, {id}) => {
            //revisar si el producto existe o no
            const producto = await Producto.findById(id);

            if(!producto){
                throw new Error('Producto no encontrado');
            }
            return producto;
        },
        obtenerClientes: async () => {
            try {
                const cliente = await Cliente.find({});
                return cliente;
            } catch (error) {
                console.log(error);
                
            }
        },
    //obtener todos lo clientes de un vendedor
        obtenerClientesVendedor: async (_,{},ctx) => {
            try {
                const cliente = await Cliente.find({vendedor: ctx.usuario.id.toString()});
                return cliente;
            } catch (error) {
                console.log(error);    
            }
        },

    //obtener un cliente en especifico por el id
        obtenerCliente: async (_, {id},ctx) => {
            //revisar si el producto existe o no
            const cliente = await Cliente.findById(id);

            if(!cliente){
                throw new Error('Cliente no encontrado');
            }
            //codigo para quien creo dicho cliente pueda verlo
            if(cliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error('No tienes permisos para ver este cliente');
            }
                return cliente;
        },

        //obtener todos los pedidos
        obtenerPedidos: async () => {
            try {
                const pedidos = await Pedido.find({});
                return pedidos;
            } catch (error) {
                console.log(error);     
            }
        },

        //obtener un pedido del vendedor
        obtenerPedidosVendedor: async (_, {},ctx) => {
            try {
                const pedidos = await Pedido.find({vendedor: ctx.usuario.id}).populate('cliente');
                console.log(pedidos);
                return pedidos;
            } catch (error) {
                console.log(error);     
            }
        },

        //obtener un pedido por el id
        obtenerPedido: async (_, {id},ctx) => {
            //revisar si el producto existe o no
            const pedido = await Pedido.findById(id);

            if(!pedido){
                throw new Error('pedido no encontrado');
            }

            //codigo para quien creo dicho cliente pueda verlo
            if(pedido.vendedor.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales ');
            }else{
                return pedido;
            }
        },

        obtenerPedidoEstado: async(_,{estado},ctx) => {
            const pedidos = await Pedido.find({vendedor: ctx.usuario.id, estado});

            return pedidos;
        },

        mejoresClientes: async () =>{
            //aggresate se usa para tomar diferentes valores,agrupar en un cliente, realizar una suma,etc. pero solo devuelve un valor
            const clientes = await Pedido.aggregate([
                //match es una forma de filtrar, en este caso se filtra de pedido el estado "COMPLETADO", es como un where
                {$match: {estado: "COMPLETADO"}},
                {$group:{
                    _id: "$cliente",
                    //hace la suma del total de los pedidos y los guarda en el total
                    total: {$sum: '$total'},
                    
                }},
                {
                    //se refiere a unir los campos del campo _id de la variable local al campo _id del type Cliente
                    $lookup:{
                        from: 'clientes',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'cliente'
                    }
                },
                {
                    //acomodar el total de mayor a menor
                    $sort: {total: -1}
                },
            ])

            return clientes;
        },

        mejoresVendedores: async () => {
            const vendedores = await Pedido.aggregate([
                {$match: {estado: 'COMPLETADO'}},
                {$group:{
                    _id: "$vendedor",
                    total: {$sum: '$total'},
                }},
                {
                    $lookup:{
                        from: 'usuarios',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'vendedor'
                    }
                },
                {
                    $limit: 3
                },
                {
                    $sort: {total: -1}
                }
        ]);

        return vendedores;

        },

        buscarProducto: async (_,{texto}) => {
            const productos = await Producto.find({$text: {$search: texto}}).limit(10)
            return productos;
        }
    },

    Mutation:{
//mutation para usuarios

        //insertar un nuevo usuario
        nuevoUsuario: async(_,{input}) => {
            const{email,password } = input;
            //revisar que el usuario no este registrado
            const existeUsuario = await Usuario.findOne({email});
            if(existeUsuario){
                throw new Error('El usuario ya esta registrado');
            }
             //hash
            const salt= await bcryptjs.genSalt(10);
                    input.password = await bcryptjs.hash(password,salt);
                    
            //hashear su password
            try{
                const usuario = new Usuario(input);
                usuario.save();
                return usuario;
            }catch(error){
                console.log(error);
            }
        },

        //verificar que el usuario ingresado es correcto
        autenticarUsuario: async(_, {input})=>{
            const {email,password} = input;

            const existeUsuario = await Usuario.findOne({email});
            if(!existeUsuario){
                throw new Error('El usuario no existe');
            }

            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password );
            if(!passwordCorrecto){
                throw new Error('El password es incorrecto')
            }
    
            return {
               token: crearToken(existeUsuario, process.env.SECRETA, '24h')
        }
    },

//mutation para productos

        //insertar un nuevo prodcuto
        nuevoProducto: async (_, {input}) => {
            try{
                const producto = new Producto(input);
                //almacenar en la base de datos
                const resultado = await producto.save();

                return resultado;
            }catch (error) {
                console.log(error)
            }

        },

        //actualizar un producto por id
        actualizarProducto: async (_,{id,input}) => {
            //revisar si el producto existe o no
            let producto = await Producto.findById(id);

            if(!producto){
                throw new Error('Producto no encontrado');
                }

                //guardar en la base de datos
                    producto = await Producto.findOneAndUpdate({_id : id},input, { new: true});

                    return producto;
            },

            //eliminar un producto por id
            eliminarProducto: async (_,{id}) => {
                //revisar si el producto existe o no
                let producto = await Producto.findById(id);
                
            if(!producto){
                throw new Error('Producto no encontrado');
            }

            //eliminar en la base de datos
                await Producto.findOneAndDelete({_id:id});

                return "producto eliminado";
            },
            
//mutation para clientes
            nuevoCliente: async (_, {input},ctx) => {

                console.log(ctx);

                const { email } = input
                //verificar si el cliente ya esta registrado
            
                const cliente = await Cliente.findOne({email});
                if(cliente){
                    throw new Error('El cliente ya esta registrado');
                }

                const nuevoCliente = new Cliente(input);

                //asignar al vendedor a un cliente
                nuevoCliente.vendedor = ctx.usuario.id;

                //guardar en la base de datos
                try{
                    
                    const resultado = await nuevoCliente.save();
                    return resultado;
                }catch(error){
                    console.log(error);
                } 
                
            },

        //actualizar un cliente por id
            actualizarCliente: async (_,{id, input},ctx) => {
                //revisar si el cliente existe o no
                let cliente = await Cliente.findById(id);

                if(!cliente){
                    throw new Error('Ese cliente no existe');
                }
            //verificar que el cliente es el que edita
                if(cliente.vendedor.toString() !== ctx.usuario.id){
                    throw new Error('No tienes permisos para editar este cliente');
                }

            //guardar al cliente en la bd
                    cliente = await Cliente.findOneAndUpdate({_id: id},input, { new: true});

                    return cliente;
            },

        //eliminar un cliente
            eliminarCliente: async (_,{id},ctx) => {
                //revisar si el cliente existe o no
                let cliente = await Cliente.findById(id);
                
            if(!cliente){
                throw new Error('Cliente no encontrado');
            }
                //verificar que el cliente es el que edita
                if(cliente.vendedor.toString() !== ctx.usuario.id){
                    throw new Error('No tienes permisos para editar este cliente');
                }
                //eliminar en la base de datos
                await Cliente.findOneAndDelete({_id:id});

                return "Cliente eliminado";
            },

//mutation para pedidos
            nuevoPedido: async (_,{input},ctx) =>{

                const {cliente} = input

             //verificar si el cliente exist o no
             let clienteExiste = await Cliente.findById(cliente);
             if(!clienteExiste){
                 throw new Error('Ese cliente no existe');
             }
             //verificar que el cliente es el que edita
             if(clienteExiste.vendedor.toString() !== ctx.usuario.id){
                 throw new Error('No tienes las credenciales');
             }

             //verificar que el stock esta disponible
             for await (const articulo of input.pedido){
                const {id} = articulo;

                const producto = await Producto.findById(id);

                if(articulo.cantidad > producto.existencia){
                    throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible`);
                }else{
                    //restar la cantidad a lo disponible
                    producto.existencia = producto.existencia - articulo.cantidad;
                    await producto.save();
                }
             }

             //crear un nuevo pedido
             const nuevoPedido = new Pedido(input);
             
             //asignar un vendedor
             nuevoPedido.vendedor = ctx.usuario.id;
             
             //guardar en la bd
             const resultado = await nuevoPedido.save();
             return resultado;
                
        },

        actualizarPedido: async (_,{id,input},ctx) => {

            const {cliente} = input;

            //verificar si el pedido existe
            const existePedido = await Pedido.findById(id);
            if(!existePedido) {
                throw new Error('El pedido no existe');
            }

            //verificar si el cliente existe
            const existeCliente = await Cliente.findById(cliente);
            if(!existeCliente) {
                throw new Error('El cliente no existe');
            }

            //si el cliente y pedido pertenece al vendedor
            if(existeCliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales');
            }

            //revisar el stock
            if(input.pedido){
                for await (const articulo of input.pedido){
                    const {id} = articulo;
    
                    const producto = await Producto.findById(id);
    
                    if(articulo.cantidad > producto.existencia){
                        throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible`);
                    }else{
                        //restar la cantidad a lo disponible
                        producto.existencia = producto.existencia - articulo.cantidad;
                        await producto.save();
                    }
                 }
            }
           
            //guardar el pedido
            const resultado = await Pedido.findOneAndUpdate({_id: id},input, { new: true});
            return resultado;
        },

        eliminarPedido: async (_,{id},ctx) => {
            //revisar si el pedido existe
            const pedido = await Pedido.findById(id);
            if(!pedido) {
                throw new Error('El pedido no existe');
            }
            if(pedido.vendedor.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales');
            }
            //eliminar en la base de datos
            await Pedido.findOneAndDelete({_id:id});

            return "Pedido eliminado";
        },

    }
}
module.exports = resolvers