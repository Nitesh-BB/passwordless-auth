const fido2auth = (function () {
  class fido2auth {
    constructor(baseurl, clientId) {
      this.baseurl = baseurl;
      this.clientId = clientId;
    }

    checkRemoteAuthentication = async () => {
      try {
        const resp = await fetch(
          this.baseurl + `/api/viewApp/${this.clientId}`
        );
        const data = await resp.json();
        if (data.errorCode === -1) throw new Error(data.errorMessage);
        if (data.app.suspended) throw new Error("App is suspended");
        return data;
      } catch (error) {
        throw new Error(error);
      }
    };

    getTransactionStatusOnChange = async (transactionId) => {
      try {
        const poll = async function (fn, ms) {
          let response = await fn();
          let responseJSON = await response.json();
          while (responseJSON.status === "PENDING") {
            await wait(ms);
            response = await fn();
            responseJSON = await response.json();
          }
          return responseJSON;
        };

        const wait = function (ms = 1000) {
          return new Promise((resolve) => {
            setTimeout(resolve, ms);
          });
        };

        const transaction = () => {
          return fetch(
            this.baseurl + `/api/transaction/getTransaction/${transactionId}`
          );
        };

        let response = await poll(transaction, 1000);
        console.log("getTransactation", response);
        return response;
      } catch (error) {
        throw error;
      }
    };

    sendPushNotification = async (data) => {
      try {
        const remote = await this.checkRemoteAuthentication();
        if (!remote.app.remotePlatformAuth)
          throw new Error("Remote platform authentication is not enabled");

        const transactionResponse = await fetch(
          this.baseurl + "/api/transaction/createTransaction",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username: data.username }),
          }
        );
        const transactionResponseJSON = await transactionResponse.json();

        const { transactionId } = transactionResponseJSON;
        data.id = transactionId;
        const response = await fetch(this.baseurl + "/api/sendPush/client", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: data.username,
            clientId: this.clientId,
            data: { ...data, clientID: this.clientId },
            type: "login",
          }),
        });
        const responseJSON = await response.json();
        return responseJSON;
      } catch (error) {
        throw new Error(error);
      }
    };

    updateTransaction = async (transactionId, data) => {
      try {
        const response = await fetch(
          this.baseurl + `/api/transaction/updateTransaction/${transactionId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ data }),
          }
        );
        const responseJSON = await response.json();
        return responseJSON;
      } catch (error) {
        throw error;
      }
    };
    async Audit(userdata) {
      const { userId, data, type } = userdata;
      try {
        const Audit = await fetch(this.baseurl + "/api/addToReport", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, appId: this.clientId, data, type }),
        });

        const AuditDataJson = await Audit.json();
        if (AuditDataJson.errorCode === -1)
          throw new Error(AuditDataJson.errorMessage);
        else return AuditDataJson;
      } catch (error) {
        throw new Error(error.message);
      }
    }

    getAllAudits = async (username) => {
      try {
        const audit = await fetch(
          `${this.baseurl}/api/getAllAudits/${username}/${this.clientId}`
        );

        const AuditDataJson = await audit.json();

        if (AuditDataJson.errorCode === -1)
          throw new Error(AuditDataJson.errorMessage);
        else return AuditDataJson;
      } catch (error) {
        throw new Error(error.message);
      }
    };

    generateQR = async (userDetails) => {
      try {
        const remote = await this.checkRemoteAuthentication();
        if (!remote.app.remotePlatformAuth)
          throw new Error("Remote platform authentication is not enabled");

        const transactionResponse = await fetch(
          this.baseurl + "/api/transaction/createTransaction",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username: userDetails.username }),
          }
        );
        const transactionResponseJSON = await transactionResponse.json();

        const { transactionId } = transactionResponseJSON;
        userDetails.id = transactionId;
        const data = await fetch(this.baseurl + "/api/generateQrCode", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...userDetails, clientID: this.clientId }),
        });

        const dataJson = await data.json();

        return dataJson;
      } catch (error) {
        throw new Error(error);
      }
    };
    register = async ({ username, id }) => {
      if (!this.baseurl || !this.clientId) {
        throw new Error("BaseURL and ClientID is not added");
      }

      try {
        const resp = await fetch(this.baseurl + "/api/registerUser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            clientId: this.clientId,
          }),
        });

        const data = await resp.json();

        console.log("data", data);

        if (data?.errorCode === -1) throw new Error(data.errorMessage);
        let attResp;
        try {
          attResp = await startAttestation(data);

          // console.log(attResp);
        } catch (error) {
          throw new Error(error);
        }

        const responseData = {
          credential: attResp,
          username,
          challenge: data.challenge,
          clientId: this.clientId,
          transactionId: id,
        };
        console.log(responseData);
        const verificationResp = await fetch(
          this.baseurl + "/api/verify-registerUser-attestation",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(responseData),
          }
        );

        const verificationJSON = await verificationResp.json();

        if (verificationJSON.errorCode === -1)
          throw new Error(verificationJSON.errorMessage);

        if (verificationJSON && verificationJSON.verified) {
          return verificationJSON;
        } else {
          let error = JSON.stringify(verificationJSON, null, 4);
          throw new Error(error);
        }
      } catch (error) {
        throw new Error(error);
      }
    };
    login = async ({ username, id }) => {
      // console.log(username);
      if (!this.baseurl || !this.clientId) {
        throw new Error("BaseURL and ClientID is not added");
      }

      const resp = await fetch(this.baseurl + "/api/LoginUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          clientId: this.clientId,
        }),
      });
      const opts = await resp.json();

      if (opts?.errorCode === -1) {
        throw new Error(opts.errorMessage);
      }
      let asseResp;
      try {
        asseResp = await startAssertion(opts);
        // console.log("asseRep", asseResp);
      } catch (error) {
        if (error.name === "TypeError")
          throw new Error("UserName is not Registered for FIDO");
        else throw new Error(error.message);
      }
      const responseData = {
        ...asseResp,
        username,
        challenge: opts.challenge,
        clientId: this.clientId,
        transactionId: id,
      };

      const verificationResp = await fetch(
        this.baseurl + "/api/verify-loginUser-assertion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(responseData),
        }
      );

      const verificationJSON = await verificationResp.json();

      if (verificationJSON && verificationJSON.verified) {
        return verificationJSON;
      } else {
        const error = JSON.stringify(verificationJSON, null, 4);
        // console.log("new error: ", error);
        throw new Error(error);
      }
    };

    addDevice = async (username) => {
      if (!this.baseurl || !this.clientId) {
        throw new Error("BaseURL and ClientID is not added");
      }

      try {
        const resp = await fetch(this.baseurl + "/api/addDevice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            clientId: this.clientId,
          }),
        });

        const data = await resp.json();
        if (data?.errorCode === -1) throw new Error(data.errorMessage);
        let attResp;
        try {
          attResp = await startAttestation(data);

          // console.log(attResp);
        } catch (error) {
          throw new Error(error);
        }

        const responseData = {
          credential: attResp,
          username,
          challenge: data.challenge,
          clientId: this.clientId,
        };
        // console.log(responseData);
        const verificationResp = await fetch(
          this.baseurl + "/api/verify-registerUser-attestation",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(responseData),
          }
        );

        const verificationJSON = await verificationResp.json();

        if (verificationJSON.errorCode === -1)
          throw new Error(verificationJSON.errorMessage);

        if (verificationJSON && verificationJSON.verified) {
          return verificationJSON;
        } else {
          let error = JSON.stringify(verificationJSON, null, 4);
          throw new Error(error);
        }
      } catch (error) {
        throw new Error(error);
      }
    };
  }
  function n(e) {
    const t = e.replace(/-/g, "+").replace(/_/g, "/"),
      n = (4 - (t.length % 4)) % 4,
      r = t.padEnd(t.length + n, "="),
      o = atob(r),
      i = new ArrayBuffer(o.length),
      a = new Uint8Array(i);
    for (let e = 0; e < o.length; e++) a[e] = o.charCodeAt(e);
    return i;
  }
  function t(e) {
    const t = new Uint8Array(e);
    let n = "";
    for (const e of t) n += String.fromCharCode(e);
    return btoa(n).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  function o(e) {
    const { id: t } = e;
    return { ...e, id: n(t) };
  }
  function r() {
    return (
      void 0 !==
        (null === window || void 0 === window
          ? void 0
          : window.PublicKeyCredential) &&
      "function" == typeof window.PublicKeyCredential
    );
  }

  startAssertion = async (e) => {
    var i, a;
    if (!r()) throw new Error("WebAuthn is not supported in this browser");
    let s;
    0 !==
      (null === (i = e.allowCredentials) || void 0 === i ? void 0 : i.length) &&
      (s =
        null === (a = e.allowCredentials) || void 0 === a ? void 0 : a.map(o));
    const l = { ...e, challenge: n(e.challenge), allowCredentials: s },
      d = await navigator.credentials.get({ publicKey: l });
    if (!d) throw new Error("Assertion was not completed");
    const { id: c, rawId: u, response: p, type: f } = d;
    let w;
    var g;
    return (
      p.userHandle &&
        ((g = p.userHandle), (w = new TextDecoder("utf-8").decode(g))),
      {
        id: c,
        rawId: t(u),
        response: {
          authenticatorData: t(p.authenticatorData),
          clientDataJSON: t(p.clientDataJSON),
          signature: t(p.signature),
          userHandle: w,
        },
        type: f,
        clientExtensionResults: d.getClientExtensionResults(),
      }
    );
  };

  startAttestation = async (e) => {
    if (!r()) throw new Error("WebAuthn is not supported in this browser");

    const publicKey = {
      ...e,
      challenge: n(e.challenge),
      user: { ...e.user, id: ((a = e.user.id), new TextEncoder().encode(a)) },
      excludeCredentials: e.excludeCredentials.map(o),
    };
    var a;
    const s = await navigator.credentials.create({ publicKey: publicKey });
    if (!s) throw new Error("Attestation was not completed");
    const { id: l, rawId: d, response: c, type: u } = s,
      p = {
        id: l,
        rawId: t(d),
        response: {
          attestationObject: t(c.attestationObject),
          clientDataJSON: t(c.clientDataJSON),
        },
        type: u,
        clientExtensionResults: s.getClientExtensionResults(),
      };
    return p;
  };

  return fido2auth;
})();
if (typeof exports != "undefined") {
  exports.passwordless = fido2auth;
} else {
  passwordless = fido2auth;
}
