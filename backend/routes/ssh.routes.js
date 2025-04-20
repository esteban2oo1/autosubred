const router = require('express').Router();
const { connect } = require('../controllers/ssh.controller');

router.post('/connect', connect);

module.exports = router;