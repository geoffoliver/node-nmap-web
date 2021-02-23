const fs = require('fs');
const express = require('express');
const app = express();
const nmap = require('node-nmap');
const bodyParser = require('body-parser');
const cors = require('cors');
const ip = require('ip');
const ipaddr = require('ipaddr.js');

const IP_REGEX = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('**', async (req, res, next) => {
  const content = fs.readFileSync('./index.html');
  res
    .contentType('text/html')
    .status(200)
    .send(content);
});

app.post('/scan', async (req, res, next) => {
  const { host } = req.body;

  if (!host) {
    return res.status(500).json({ error: 'Nope!'});
  }

  if (IP_REGEX.test(host)) {
    console.log(`IP Address is ${host}`);

    if (!ipaddr.isValid(host)) {
      return res.status(500).json({ error: 'Please enter a valid IP address' });
    }

    if (ip.isPrivate(host)) {
      return res.status(500).json({ error: 'You may not use a private IP address' });
    }
  }

  try {
    const result = await new Promise((resolve, reject) => {
      try {
        console.log(`Scanning ${host}`);

        const quickscan = new nmap.NmapScan(host, '-F');

        quickscan.on('complete', (data) => {
          resolve(data);
        });

        quickscan.on('error', (error) => {
          reject(error);
        });
      } catch (ex) {
        reject(ex);
      }
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
});

app.listen(8080, () => {
  console.log('App is listening');
});
