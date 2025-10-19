const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'pet123';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
        // Isso garante que a execução PARE AQUI até que o token seja verificado.
        const decodedUser = jwt.verify(token, JWT_SECRET);

        req.user = decodedUser; // Adicionamos os dados do usuário à requisição.

        //Só depois de tudo certo, chamamos next()
        next(); 

    } catch (err) {
        console.error("Erro na verificação do token:", err.message);
        return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }

};

const authorizeRole = (roles) => {
   return (req, res, next) => {
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        if (req.user && allowedRoles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).json({ error: 'Acesso negado. Permissões insuficientes.' });
        }
    };
};
module.exports = {
    authenticateToken,
    authorizeRole
};