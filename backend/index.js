require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sshRoutes = require('./routes/ssh.routes');
const subnetRoutes = require('./routes/subnet.routes');
const dhcpRoutes = require('./routes/dhcp.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running' });
});

// Routes
app.use('/api/ssh', sshRoutes);
app.use('/api/subnets', subnetRoutes);
app.use('/api/dhcp', dhcpRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Ocurrió un error en el servidor'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});