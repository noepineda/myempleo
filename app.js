const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tuempleo'
});

connection.connect(err => {
  if (err) throw err;
  console.log('✅ Conectado a MySQL');
});
module.exports = connection;


app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors());

app.use(session({
  secret: 'secret123',
  resave: false,
  saveUninitialized: false
}));

// Registro
app.post('/register', (req, res) => {
    const { nombre,email, password, tipo } = req.body;
  
    // Verificar si el correo ya existe
    connection.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, results) => {
      if (err) throw err;
  
      if (results.length > 0) {
        return res.send('⚠ El correo ya está registrado, usa otro.');
      }
  
      const hashedPassword = await bcrypt.hash(password, 8);
      connection.query('INSERT INTO usuarios SET ?', {nombre, email, password: hashedPassword, tipo,via_google:0 }, (err, result) => {
        if (err) throw err;
        res.send('✅ Usuario registrado exitosamente.');
      });
    });
  });

  // registro con gmail
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client('725815759149-h1ed9016onum3b08vo8osi3g94binggq.apps.googleusercontent.com');
  
  app.post('/auth/google', async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: '725815759149-h1ed9016onum3b08vo8osi3g94binggq.apps.googleusercontent.com',
        });

        const payload = ticket.getPayload();
        const { sub, email, name } = payload;

        // Busca por via_google (sub)
        connection.query('SELECT * FROM usuarios WHERE via_google = ?', [sub], (err, results) => {
            if (err) {
                console.error('Error al consultar DB:', err);
                return res.status(500).json({ success: false, message: 'Error interno' });
            }

            if (results.length > 0) {
                // Usuario ya existe → iniciar sesión
                req.session.userId = results[0].id;
                return res.json({ success: true, user: results[0] });
            } else {
                // Nuevo usuario → registrar
                const newUser = {
                    via_google: sub,
                    email: email,
                    nombre: name,
                    tipo: 'usuario', // o lo que definas por defecto
                };

                connection.query('INSERT INTO usuarios SET ?', newUser, (err, result) => {
                    if (err) {
                        console.error('Error al insertar usuario:', err);
                        return res.status(500).json({ success: false, message: 'Error al registrar' });
                    }
                    req.session.userId = result.insertId;
                    return res.json({ success: true, user: newUser });
                });
            }
        });

    } catch (err) {
        console.error('Error verificando token:', err);
        res.status(401).json({ success: false, message: 'Token inválido' });
    }
});

  

// LOGIN
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  connection.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.send('❌ Correo no registrado.');
    }

    const user = results[0];

    if (user.via_google) {
      // Usuario registrado solo por Google, no tiene contraseña local
      return res.send('⚠ Este correo está registrado con Google. Usa el botón de Google para iniciar sesión.');
    }

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      req.session.userId = user.id;
      res.redirect('/publicarempleo.html');
    } else {
      res.send('❌ Contraseña incorrecta.');
    }
  });
});


// PUBLICAR EMPLEO
app.post('/publish', (req, res) => {
  if (!req.session.userId) {
    return res.send('❌ No autorizado. Inicia sesión.');
  }

  const {titulo, descripcion, ubicacion, tipo_empleo, salario_min, salario_max} = req.body;

  connection.query('INSERT INTO empleos SET ?', {
    empresa_id:1,
    titulo,
    descripcion,
    ubicacion,
    tipo_empleo,
    salario_min,
    salario_max,
    usuario_id: req.session.userId
  }, (err, result) => {
    if (err) throw err;
    res.send('✅ Empleo publicado exitosamente.');
    res.redirect('/index.html');
  });
});

// LOGOUT
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});

app.get('/api/empleos', (req, res) => {
    connection.query('SELECT * FROM empleos', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        res.json(results);
    });
});





app.get('/check-session', (req, res) => {
    res.json({ loggedIn: !!req.session.userId });
  });
  

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});


