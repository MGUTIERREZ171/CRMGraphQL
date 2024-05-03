// aqui estamos importando apollo server
const{gql} = require('apollo-server');

//schema
const typeDefs = gql`

#<------------------------------------------------types-------------------------------------------------->
    type Token{
        token: String
    }

    type Usuario{
        id: ID
        nombre: String
        apellido: String
        email: String
        creado: String
    }

    type Producto{
        id: ID
        nombre: String
        existencia: Int
        precio: Float
        creado: String
    }

    type Cliente{
        id: ID
        nombre:String
        apellido:String
        empresa: String
        email: String
        telefono: String
        vendedor: ID
    }

    type Pedido{
        id: ID
        pedido:[PedidoGrupo]
        total: Float
        cliente: Cliente
        vendedor: ID
        fecha: String
        estado: EstadoPedido
    }

    type PedidoGrupo{
        id:ID
        cantidad: Int
        nombre: String
        precio: Float
    }

    type TopCliente{
        total: Float
        cliente: [Cliente]
    }
    type TopVendedor{
        total: Float
        vendedor: [Usuario]
    }
#<------------------------------------------------inputs-------------------------------------------------->

    input UsuarioInput{
        nombre: String!
        apellido: String!
        email: String!
        password: String!
    }

    input AutenticarInput{
        email: String!
        password: String!
    }

    input ProductoInput{
        nombre: String!
        existencia: Int!
        precio: Float!
    }

    input ClienteInput{
        nombre: String!
        apellido: String!
        empresa: String!
        email: String!
        telefono: String  
    }
#este input recbie el id y la cantidad de productos
    input PedidoProductoInput{
        id:ID
        cantidad: Int
        nombre: String
        precio: Float
    }
#aqui se realiza el input del pedido para agregarle un producto al pedido
    input PedidoInput{
        pedido: [PedidoProductoInput]
        total: Float
        cliente: ID
        estado: EstadoPedido
    }

#DEFINE LOS VALORES QUE PUEDE TENER EL ESTADO DEL PEDIDO
    enum EstadoPedido{
        PENDIENTE,
        COMPLETADO,
        CANCELADO
    }
    #<------------------------------------------------query-------------------------------------------------->

    type Query{
        #usuarios
        obtenerUsuario: Usuario

        #productos
        obtenerProductos: [Producto]
        obtenerProducto(id: ID!): Producto

        #clientes
        obtenerClientes: [Cliente]
        obtenerClientesVendedor: [Cliente]
        obtenerCliente(id: ID!): Cliente

        #pedidos
        obtenerPedidos: [Pedido]
        obtenerPedidosVendedor: [Pedido]
        obtenerPedido(id: ID!): Pedido
        obtenerPedidoEstado(estado: String!): [Pedido]

        #Busquedas avanzadas
        mejoresClientes: [TopCliente]
        mejoresVendedores: [TopVendedor]
        buscarProducto(texto: String!): [Producto]

    }  

 #<------------------------------------------------mutations-------------------------------------------------->

    type Mutation{
        #usuarios
        nuevoUsuario(input: UsuarioInput): Usuario
        autenticarUsuario(input: AutenticarInput): Token

        #productos
        nuevoProducto(input: ProductoInput): Producto
        actualizarProducto(id: ID!,input: ProductoInput): Producto
        eliminarProducto(id: ID!): String

        #Clientes
        nuevoCliente(input: ClienteInput): Cliente
        actualizarCliente(id: ID!,input: ClienteInput): Cliente
        eliminarCliente(id: ID!): String

        #pedidos
        nuevoPedido(input: PedidoInput): Pedido
        actualizarPedido(id: ID!,input: PedidoInput): Pedido
        eliminarPedido(id: ID!): String
    }
`;
module.exports = typeDefs;