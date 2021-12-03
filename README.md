

# passwordless-bb

Helper package for bringing FIDO2 authentication to Client Application.
---

### How to Install This Package ?
```
1. Using Npm

npm install passwordless-bb

2. Using Yarn

yarn add passwordless-bb

```

----
### How To use This Package ?

Visit https://home.passwordless.com.au and sign up for a free account.

Then, create a new application and download the client application.

Then, install the package and run the following command.

Then, add the following lines to your application's configuration file:

```
const {passwordless} = require("passwordless-bb")
const fido = new passwordless("BASE_URL","CLIENT_ID")

fido.register(data)

or

fido.login(data)
```

### Can we Use This package in browser ?
---
Yes, it can be used in browser. include follwing in head tag

```
<script src="https://cdn.jsdelivr.net/npm/passwordless-bb@1.0.2/index.js"></script>


const fido = new passwordless("BASE_URL","CLIENT_ID")

```

#List of Apis

1. Register
2. Login
3. Add Device
4. getTransactionStatus
5. updateTransactionStatus


Refer to the following link for more details.
https://home.passwordless.com.au
## Authors

- [@Nitesh Singh](https://www.github.com/nitesh-bb)

