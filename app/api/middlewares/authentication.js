const jwt = require('jsonwebtoken');

let checkAuth = (req, res, next) => {

    let token = req.get('token'); // se obtiene el token del header de la consulta.
    jwt.verify(token, 'securePasswordHere', (err, decoded) =>{
        if(err){
            return res.status(401).json({
                status: "error",
                error: err
            });
        }
        req.userData = decoded.userData; // se guarda la informacion del usuario en el objeto req.
        next();
    }) // se verifica el token con la clave secreta.  


};

module.exports = {checkAuth};