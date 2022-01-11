const App = (() => {
  let clientId;
  let baseUrl;

  /**
   *
   * @param {String} url
   * @param {String} id
   */
  const init = (url, id) => {
    baseUrl = url;
    clientId = id;
  };

  /**
   *
   * @returns {Object}
   */
  const getApplicationNameAndLogo = async () => {
    console.log("getting application logo");
    try {
      const response = await fetch(
        baseUrl + "/applicationDetails/" + clientId
      );

      const responseJson = await response.json();

      if (responseJson.errorCode === -1)
        throw new Error(responseJson.errorMessage);
      return responseJson;
    } catch (error) {
      throw new Error(error.message);
    }
  };
  const checkRemoteAuthentication = async () => {
    try {
      const resp = await fetch(baseUrl + `/viewApp/${clientId}`);
      const data = await resp.json();
      if (data.errorCode === -1) throw new Error(data.errorMessage);
      if (data.suspended) throw new Error("App is suspended");
      return data;
    } catch (error) {
      throw new Error(error);
    }
  };

  /**
   *
   * @param {string} transactionId
   * @returns {Object}
   */

  const getTransactionStatusOnChange = async (transactionId) => {
    try {
      const poll = async function (fn, ms) {
        let response = await fn();
        let responseJSON = await response.json();
        while (responseJSON.status === "PENDING") {
          await wait(ms);
          response = await fn();
          responseJSON = await response.json();
          console.log(responseJSON);
        }
        return responseJSON;
      };

      const wait = function (ms = 2000) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
      };

      const transaction = () => {
        return fetch(
          baseUrl + `/transaction/getTransaction/${transactionId}`
        );
      };

      let response = await poll(transaction, 2000);

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   *
   * @param {Object} data
   * @returns {Object}
   */
  const sendPushNotification = async (data) => {
    try {
      const remote = await checkRemoteAuthentication();
      if (!remote.remotePlatformAuth)
        throw new Error("Remote platform authentication is not enabled");

      const transactionResponse = await fetch(
        baseUrl + "/transaction/createTransaction",
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
      const response = await fetch(baseUrl + "/sendPush/client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          clientId: clientId,
          data: { ...data, clientID: clientId },
          type: "login",
        }),
      });
      const responseJSON = await response.json();
      responseJSON.transactionId = transactionId;
      return responseJSON;
    } catch (error) {
      throw new Error(error);
    }
  };

  /**
   *
   * @param {String} transactionId
   * @param {Object} data
   * @returns {Object}
   */
  const declineTransaction = async (transactionId) => {
    try {
      const response = await fetch(
        baseUrl + `/transaction/updateTransactionStatus/${transactionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionStatus: "FAILED",
            message: "User Declined Authentication !",
          }),
        }
      );
      const responseJSON = await response.json();
      return responseJSON;
    } catch (error) {
      throw error;
    }
  };



  /**
   *
   * @param {String} username
   * @returns
   */
  const getAllAudits = async (username) => {
    try {
      const audit = await fetch(
        `${baseUrl}/getAllAudits/${username}/${clientId}`
      );

      const AuditDataJson = await audit.json();

      if (AuditDataJson.errorCode === -1)
        throw new Error(AuditDataJson.errorMessage);
      else return AuditDataJson;
    } catch (error) {
      throw new Error(error.message);
    }
  };

  /**
   *
   * @param {Object} userDetails
   * @returns {Object}
   */
  const generateQR = async (userDetails) => {
    try {
      const remote = await checkRemoteAuthentication();
      if (!remote.remotePlatformAuth)
        throw new Error("Remote platform authentication is not enabled");


      const transactionResponse = await fetch(
        baseUrl + "/transaction/createTransaction",
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
      const data = await fetch(baseUrl + "/generateQrCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...userDetails, clientID: clientId }),
      });

      const dataJson = await data.json();
      dataJson.transactionId = transactionId;

      return dataJson;
    } catch (error) {
      throw new Error(error);
    }
  };

  /**
   *
   * @param {username:"","id":""} data
   * @returns {Object}
   */
  const register = async ({ username, id }) => {
    if (!baseUrl || !clientId) {
      throw new Error("BaseURL and ClientID is not added");
    }

    try {
      const resp = await fetch(baseUrl + "/registerUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          clientId: clientId,
        }),
      });

      const data = await resp.json();

      console.log("data", data);

      if (data.errorCode === -1) throw new Error(data.errorMessage);
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
        clientId: clientId,
        transactionId: id,
      };
      console.log(responseData);
      const verificationResp = await fetch(
        baseUrl + "/verify-registerUser-attestation",
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

  /**
   *
   * @param {Object} data
   * @returns {Object}
   */
  const login = async ({ username, id }) => {
    // console.log(username);
    if (!baseUrl || !clientId) {
      throw new Error("BaseURL and ClientID is not added");
    }

    const resp = await fetch(baseUrl + "/LoginUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        clientId: clientId,
      }),
    });
    const opts = await resp.json();

    if (opts.errorCode === -1) {
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
      clientId: clientId,
      transactionId: id,
    };

    const verificationResp = await fetch(
      baseUrl + "/verify-loginUser-assertion",
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

  const addDevice = async (username) => {
    if (!baseUrl || !clientId) {
      throw new Error("BaseURL and ClientID is not added");
    }

    try {
      const resp = await fetch(baseUrl + "/addDevice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          clientId: clientId,
        }),
      });

      const data = await resp.json();
      if (data.errorCode === -1) throw new Error(data.errorMessage);
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
        clientId: clientId,
      };
      // console.log(responseData);
      const verificationResp = await fetch(
        baseUrl + "/verify-registerUser-attestation",
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

  function n(e) {
    const t = e.replace(/-/g, "+").replace(/_/g, "/"),
      n = (4 - (t.length % 4)) % 4,
      r = t.padEnd(t.length + n, "="),
      o = window.atob(r),
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

  const startAssertion = async (e) => {
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

  const startAttestation = async (e) => {
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

  return {
    init,
    getApplicationNameAndLogo,
    getTransactionStatusOnChange,
    sendPushNotification,
    declineTransaction,
  
    getAllAudits,
    generateQR,
    login,
    register,
    addDevice,
  };
})();

if (typeof exports != "undefined") {
  exports.Passwordless = App;
} else {
  var Passwordless = App;
}
