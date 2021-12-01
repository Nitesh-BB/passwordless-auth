

# @passwordless/auth

Helper package for bringing FIDO2 authentication to Client Application.
---

### How to Install This Package ?
```
1. Using Npm

npm install @passwordless/auth

2. Using Yarn

yarn add @passwordless/auth

```

----
### How To use This Package ?

```
const {passwordless} = require("@passwordless/auth")
const fido = new passwordless("BASE_URL","CLIENT_ID")

fido.register(data)

or

fido.login(data)
```

### Can we Use This package in browser ?
---
Yes, it can be used in browser. include follwing in head tag

```
<script src="https://cdn.jsdelivr.net/npm/passwordless-bb@1.0.0/index.js"></script>
```

## Authors

- [@Nitesh Singh](https://www.github.com/nitesh-bb)

