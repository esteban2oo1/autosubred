import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { calculateSubnetInfo, calculateVlsmSubnets } from './utils/subnet-utils';
import { connectToServer, configureDhcp } from './utils/ssh-utils';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Schema para validación de entrada de cálculo de subredes
const subnetCalculationSchema = z.object({
  ip: z.string().regex(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/),
  mask: z.string(),
  numSubnets: z.number().optional(),
  subnetRequirements: z.array(z.object({
    name: z.string(),
    hosts: z.number()
  })).optional()
});

// Schema para validación de conexión SSH
const sshConnectionSchema = z.object({
  host: z.string(),
  port: z.number(),
  username: z.string(),
  password: z.string()
});

// Schema para validación de configuración DHCP
const dhcpConfigSchema = z.object({
  config: z.string(),
  connectionId: z.string(),
  password: z.string()
});

// Ruta para cálculo de subredes
app.post('/api/subnets/calculate', async (req, res) => {
  try {
    const validatedData = subnetCalculationSchema.parse(req.body);
    const { ip, mask, numSubnets, subnetRequirements } = validatedData;

    let result;
    if (subnetRequirements && subnetRequirements.length > 0) {
      result = calculateVlsmSubnets(ip, mask, subnetRequirements);
    } else {
      result = calculateSubnetInfo(ip, mask, numSubnets);
    }

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
});

// Ruta para conexión SSH
app.post('/api/ssh/connect', async (req, res) => {
  try {
    const validatedData = sshConnectionSchema.parse(req.body);
    const result = await connectToServer(validatedData);
    res.json({ success: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
});

// Ruta para configuración DHCP
app.post('/api/dhcp/configure', async (req, res) => {
  try {
    const validatedData = dhcpConfigSchema.parse(req.body);
    const result = await configureDhcp(validatedData);
    res.json({ success: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});