const SubnetCalculator = require('ip-subnet-calculator');

exports.calculate = (req, res) => {
  const { ip, mask, numSubnets, subnetRequirements } = req.body;

  try {
    let results = [];
    
    if (subnetRequirements && subnetRequirements.length > 0) {
      // VLSM calculation
      results = calculateVLSM(ip, mask, subnetRequirements);
    } else {
      // Equal subnetting
      results = calculateEqualSubnets(ip, mask, numSubnets);
    }

    res.json(results);
  } catch (error) {
    res.status(400).json({
      message: 'Error al calcular subredes: ' + error.message
    });
  }
};

function calculateVLSM(networkAddress, mask, requirements) {
  const results = [];
  let currentIp = networkAddress;

  // Ordenar requerimientos por número de hosts (descendente)
  requirements.sort((a, b) => b.hosts - a.hosts);

  for (const req of requirements) {
    const hostsNeeded = req.hosts + 2; // +2 para dirección de red y broadcast
    const bitsNeeded = Math.ceil(Math.log2(hostsNeeded));
    const subnetMask = 32 - bitsNeeded;
    
    const subnet = SubnetCalculator.calculateSubnetMask(currentIp, subnetMask);
    
    results.push({
      name: req.name,
      networkAddress: subnet.networkAddress,
      subnetMask: subnet.subnetMask,
      firstUsable: subnet.firstHostAddress,
      lastUsable: subnet.lastHostAddress,
      broadcastAddress: subnet.broadcastAddress,
      numHosts: Math.pow(2, 32 - subnetMask) - 2
    });

    // Actualizar IP para la siguiente subred
    currentIp = incrementIP(subnet.broadcastAddress);
  }

  return results;
}

function calculateEqualSubnets(networkAddress, mask, numSubnets) {
  const results = [];
  const newMask = calculateNewMask(mask, numSubnets);
  
  for (let i = 0; i < numSubnets; i++) {
    const subnet = SubnetCalculator.calculateSubnetMask(networkAddress, newMask, i);
    
    results.push({
      name: `Subred ${i + 1}`,
      networkAddress: subnet.networkAddress,
      subnetMask: subnet.subnetMask,
      firstUsable: subnet.firstHostAddress,
      lastUsable: subnet.lastHostAddress,
      broadcastAddress: subnet.broadcastAddress,
      numHosts: Math.pow(2, 32 - newMask) - 2
    });
  }

  return results;
}

function calculateNewMask(currentMask, numSubnets) {
  const bitsNeeded = Math.ceil(Math.log2(numSubnets));
  const currentMaskBits = typeof currentMask === 'string' ? 
    parseInt(currentMask.replace('/', '')) : 
    currentMask;
  
  return currentMaskBits + bitsNeeded;
}

function incrementIP(ip) {
  const parts = ip.split('.').map(Number);
  parts[3]++;
  
  for (let i = 3; i > 0; i--) {
    if (parts[i] > 255) {
      parts[i] = 0;
      parts[i-1]++;
    }
  }
  
  return parts.join('.');
}