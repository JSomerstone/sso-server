var express = require('express');
var msal = require('@azure/msal-node');
const jwt = require("jsonwebtoken");

const tenantID = "2bb82c64-2eb1-43f7-8862-fdc1d2333b50";
const clientID = "c49d3833-ee3c-4bfa-8fa8-d7566b7ec0fd";
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const SERVER_PORT = process.env.PORT || 3000;

// Before running the sample, you will need to replace the values in the config, 
// including the clientSecret
const config = {
  auth: {
    clientId: clientID,
    authority: `https://login.microsoftonline.com/${tenantID}`,
    clientSecret: "FILL IN YOUR SECRET"
    //clientSecret:"",
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Verbose,
    }
  }
};

// Create msal application object
const pca = new msal.ConfidentialClientApplication(config);
//const pca = new msal.PublicClientApplication(config);

// Create Express App and Routes
const app = express();

app.get('/', (req, res) => {
  const authCodeUrlParameters = {
    //scopes: ["openid", `${clientID}/.default`],
    //scopes: ["openid", "profile", "User.Read", `${clientID}/.default`],
    scopes: ["openid", "profile", "User.Read", "Group.Read.All" ],
    redirectUri: "http://localhost:3000/callback",
  };

  // get url to sign user in and consent to scopes needed for applicatio
  pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
    console.log("Redirect url", response);
    res.redirect(response);
  }).catch((error) => {
    console.log(JSON.stringify(error));
    res.status(500).json(error);
  });
});

app.get('/callback', (req, res) => {
  const tokenRequest = {
    code: req.query.code,
    scopes: ["openid"],
    redirectUri: "http://localhost:3000/callback",
  };
  console.log({ code: req.query.code });
  pca.acquireTokenByCode(tokenRequest).then((response) => {
    console.log("AccessToken aquired");
    res.status(200).json(
      { ...response }
    );
  }).catch((error) => {
    console.log(error);
    res.status(500).json(error);
  });
});

app.get('/check', (req, res) => {
  try {
    const { authorization } = req.headers;
    const token = authorization.split(" ", 2)[1];
    console.log({ authorization });
    res.status(200).json(
      jwt.decode(token)
    )
  } catch (error) {
    res.status(500).json(error);
  }
});

app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`))
