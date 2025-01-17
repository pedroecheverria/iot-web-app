import mongoose from "mongoose";
const uniqueValidator = require('mongoose-unique-validator'); // recurso para validar campos unicos en mongoose, por ejemplo, que no se repita el email de un usuario
const Schema = mongoose.Schema; // para crear esquemas de mongoose

const userSchema = new Schema({
    name: {type: String, required: [true, 'El nombre es necesario']},
    email: {type: String, unique: true, required: [true, 'El correo es necesario']},
    password: {type: String, required: [true, 'La contraseña es necesaria']},
});

// Validator
userSchema.plugin(uniqueValidator, {message: 'Error, email already exists'});

// Convert to model

const User = mongoose.model('User', userSchema); // el primer parametro es el nombre de la coleccion en la base de datos y el segundo parametro es el esquema que va a tener esa coleccion

export default User; // para poder usar este modelo en otros archivos de la API (por ejemplo, en el archivo de users.js de la carpeta routes)
