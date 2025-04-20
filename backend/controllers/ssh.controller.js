const { NodeSSH } = require('node-ssh');

const sshConnections = new Map();

exports.sshConnections = sshConnections;

exports.connect = async (req, res) => {
  const { host, username, password } = req.body;
  const ssh = new NodeSSH();

  try {
    await ssh.connect({
      host,
      username,
      password,
      port: 22,
    });

    // Generar un ID único para esta conexión
    const connectionId = Date.now().toString();
    sshConnections.set(connectionId, { ssh, password, username });

    res.json({
      success: true,
      message: 'Conexión SSH establecida exitosamente',
      connectionId,
      password
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al conectar con el servidor: ' + error.message
    });
  }
};