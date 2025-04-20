const { sshConnections } = require('./ssh.controller');

exports.configure = async (req, res) => {
  const { config, connectionId } = req.body;
  if (!connectionId || !sshConnections.has(connectionId)) {
    return res.status(400).json({
      message: 'Conexión SSH no encontrada. Por favor, reconéctese al servidor.'
    });
  }
  const { ssh, username } = sshConnections.get(connectionId);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const userTempFile = `dhcpd.conf.${timestamp}.tmp`;
  const remoteHome = `/home/${username}`;
  const remoteTempPath = `${remoteHome}/${userTempFile}`;
  const finalFile = `/etc/dhcp/dhcpd.conf`;
  const backupFile = `/etc/dhcp/dhcpd.conf.backup-${timestamp}`;

  try {
    if (!config || !config.trim()) {
      throw new Error('La configuración DHCP no puede estar vacía');
    }

    // Subir archivo temporal al home del usuario SSH
    const sftp = await ssh.requestSFTP();
    await new Promise((resolve, reject) => {
      const writeStream = sftp.createWriteStream(remoteTempPath);
      writeStream.on('error', reject);
      writeStream.on('close', resolve);
      writeStream.write(config);
      writeStream.end();
    });

    // Respaldar archivo actual
    await ssh.execCommand(`sudo cp ${finalFile} ${backupFile}`);

    // Copiar archivo temporal al destino final y establecer permisos
    await ssh.execCommand(`sudo cp ${remoteTempPath} ${finalFile} && sudo chown root:root ${finalFile} && sudo chmod 644 ${finalFile}`);

    // Validar sintaxis en el archivo final
    const validation = await ssh.execCommand(`sudo dhcpd -t -cf ${finalFile}`);
    if (
      validation.code !== 0 ||
      (validation.stderr && /error|fail/i.test(validation.stderr))
    ) {
      throw new Error('Error en la sintaxis de la configuración:\n' + validation.stderr);
    }

    // Reiniciar el servicio
    const restart = await ssh.execCommand(`sudo systemctl restart isc-dhcp-server`);
    if (restart.stderr) {
      throw new Error('Error al reiniciar el servicio DHCP:\n' + restart.stderr);
    }

    // Limpiar temporal
    await ssh.execCommand(`rm -f ${remoteTempPath}`);

    res.json({ message: 'Configuración DHCP aplicada exitosamente' });

  } catch (error) {
    console.error('Error al configurar DHCP:', error.message);

    try {
      await ssh.execCommand(`sudo mv ${backupFile} ${finalFile}`);
    } catch (restoreError) {
      console.error('Error al restaurar backup:', restoreError.message);
    }

    try {
      await ssh.execCommand(`rm -f ${remoteTempPath}`);
    } catch (cleanupError) {
      console.error('Error al limpiar temporal:', cleanupError.message);
    }

    res.status(500).json({
      message: 'Error al configurar DHCP: ' + error.message
    });
  }
};
