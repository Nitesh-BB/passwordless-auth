

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
const {Passwordless} = require("passwordless-bb")
Passwordless.init("BASE_URL","CLIENT_ID")

Passwordless.register(data)

or

Passwordless.login(data)
```

### Can we Use This package in browser ?
---
Yes, it can be used in browser. include follwing in head tag

```
<script src="https://cdn.jsdelivr.net/npm/passwordless-bb@2.0.4/index.js"></script>


const fido = new passwordless("BASE_URL","CLIENT_ID")

```

#List of Functions

| Function name                      | Description                        |
| -------------                      | ------------------------------     |
| `init(baseUrl,clientId)`           | Initialize the package.            |
| `login(data)`                      | Login using Passwordless.          |
| `register(data)`                   | Register Using Passwordless.       |
| `getApplicationNameAndLogo()`      | Get Application Name and Logo.     |
|`getTransactionStatusOnChange(id)`  | Get Auth Status On Change.         |
|`sendPushNotification`              | Send Push Notification.            |
|`declineTransaction`                | Decline Authentication.            |
|`generateQR(data)`                  | Generate QR Code.                  |
|`Audit(data)`                       | Audit Transaction.                 |
|`getAllAudits()`                    | Get All Audits.                    |
|`addDevice(data)`                   | Add Another Device.                |



Refer to the following link for more details.
https://home.passwordless.com.au
## Authors

- [@Nitesh Singh](https://www.github.com/nitesh-bb)

