const router = require('express').Router();
const { configure } = require('../controllers/dhcp.controller');

router.post('/configure', configure);

module.exports = router;