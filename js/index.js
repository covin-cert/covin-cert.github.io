var alertPlaceholder = document.getElementById("liveAlert");
var mobileNumberDiv = document.getElementById("validationCustom01");
var otpDiv = document.getElementById("validationCustom02");
var mobileInputForm = document.getElementById("mobileInputForm");
var otpInputForm = document.getElementById("otpInputForm");
var getMyCertificate = document.getElementById("getMyCertificate");
var logOut = document.getElementById("logOut");

function storeData(key, value) {
  // Check browser support
  if (typeof Storage !== "undefined") {
    // Store
    sessionStorage.setItem(key, value);
  }
}

function getData(key) {
  // Check browser support
  if (typeof Storage !== "undefined") {
    // Retrieve
    return sessionStorage.getItem(key);
  } else {
    return null;
  }
}

function alert(message, type) {
  var wrapper = document.createElement("div");
  wrapper.innerHTML =
    '<div class="alert alert-' +
    type +
    ' alert-dismissible" role="alert">' +
    message +
    '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
  alertPlaceholder.innerHTML = "";
  alertPlaceholder.append(wrapper);
}

async function encode(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function downloadCertificate(bId) {
  const token = getData("token");
  var decoded = jwt_decode(token);
  const {
    beneficiary_reference_id,
    exp,
    iat,
    mobile_number,
    txnId,
    user_id,
    user_name,
    user_type,
  } = decoded;
  const res = await axios({
    method: "get",
    url: "https://cdn-api.co-vin.in/api/v2/registration/certificate/public/download",
    params: { beneficiary_reference_id: bId ? bId : beneficiary_reference_id },
    headers: {
      "Content-Type": "application/json",
      Accept: "application/pdf",
      Authorization: "Bearer " + token,
    },
    responseType: "arraybuffer",
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "Certificate.pdf");
  document.body.appendChild(link);
  link.click();
}

async function logMeOut() {
  await storeData("token", null);
  await storeData("mobile", null);
  alertPlaceholder.innerHTML = "";
  mobileInputForm.style.display = "block";
  otpInputForm.style.display = "none";
  getMyCertificate.style.display = "none";
  logOut.style.display = "none";
}

async function verifyOtp(code) {
  try {
    const txnId = getData("txnId");
    const otp = await encode(code);
    const res = await axios({
      method: "post",
      url: "https://cdn-api.co-vin.in/api/v2/auth/public/confirmOTP",
      data: { otp, txnId },
    });
    const token = res.data["token"];
    storeData("token", token);
    alert("User has been successfully verified !!", "success");
    getMyCertificate.style.display = "block";
    logOut.style.display = "block";
    return true;
  } catch (err) {
    const { status } = err.response || {};
    if (status == 401) {
      alert("Invalid OTP", "error");
      mobileInputForm.style.display = "none";
      otpInputForm.style.display = "block";
    } else {
      alert("Verification error", "warning");
      mobileInputForm.style.display = "none";
      otpInputForm.style.display = "block";
    }
    return null;
  }
}

async function sendOtp(mobile) {
  try {
    storeData("mobile", mobile);
    const res = await axios({
      method: "post",
      url: "https://cdn-api.co-vin.in/api/v2/auth/public/generateOTP",
      data: { mobile },
    });
    const txnId = res.data["txnId"];
    storeData("txnId", txnId);
    alert("OTP has been sent to your mobile number!", "success");
    mobileInputForm.style.display = "none";
    otpInputForm.style.display = "block";
    return true;
  } catch (err) {
    const { status } = err.response || {};
    if (status == 400) {
      alert("OTP Already sent", "info");
      mobileInputForm.style.display = "none";
      otpInputForm.style.display = "block";
      return true;
    } else {
      alert("Unable to generate OTP", "info");
    }
    return null;
  }
}

// Example starter JavaScript for disabling form submissions if there are invalid fields
(function () {
  "use strict";

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  // var forms = document.querySelectorAll(".needs-validation");

  // Loop over them and prevent submission
  // Array.prototype.slice.call(forms).forEach(function (form) {
  mobileInputForm.addEventListener(
    "submit",
    function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (!mobileInputForm.checkValidity()) {
        alert("Please type a valid mobile number!", "warning");
        mobileInputForm.classList.remove("was-validated");
      } else {
        var mobile = mobileNumberDiv.value;
        if (isNaN(mobile) || mobile.length !== 10) {
          alert("Please type a valid mobile number!", "warning");
          mobileInputForm.classList.remove("was-validated");
          return;
        }
        sendOtp(parseInt(mobile));
        mobileInputForm.classList.add("was-validated");
      }
    },
    false
  );

  otpInputForm.addEventListener(
    "submit",
    function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (!otpInputForm.checkValidity()) {
        alert("Please type a valid OTP!", "warning");
        otpInputForm.classList.remove("was-validated");
      } else {
        var otp = otpDiv.value;
        if (isNaN(otp) || otp.length !== 6) {
          alert("Please type a valid OTP!", "warning");
          otpInputForm.classList.remove("was-validated");
          return;
        }
        verifyOtp(parseInt(otp));
        otpInputForm.classList.add("was-validated");
        mobileInputForm.style.display = "none";
        otpInputForm.style.display = "none";
      }
    },
    false
  );

  getMyCertificate.addEventListener("click", downloadCertificate);
  logOut.addEventListener("click", logMeOut);
  // });
})();

logMeOut();
