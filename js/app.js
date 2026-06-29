// script.js - التعامل مع البصمة والتشفير والتخزين

const API_BASE = "http://localhost:8000/api";
let currentContract = null;
let isSigned = false;
let signatureHash = null;

// تهيئة الصفحة
document.addEventListener("DOMContentLoaded", async function () {
  // محاكاة تحميل عقد (في التطبيق الحقيقي، تستدعي API)
  await loadContract("1");

  // تفعيل زر البصمة
  document
    .getElementById("signButton")
    .addEventListener("click", handleBiometricSign);
  document.getElementById("saveButton").addEventListener("click", saveContract);
  document
    .getElementById("screenshotButton")
    .addEventListener("click", takeScreenshot);
});

// تحميل بيانات العقد
async function loadContract(contractId) {
  try {
    // في التطبيق الحقيقي:
    // const response = await fetch(`${API_BASE}/contracts/${contractId}`);
    // const data = await response.json();

    // بيانات وهمية للتجربة
    const data = {
      id: 1,
      contract_number: "CTR-A7B3C9F2E1",
      terms:
        "1. نسبة الخصم: 15% على جميع المنتجات.\n2. مدة العقد: سنة واحدة قابلة للتجديد.\n3. الدفع: يتم الدفع خلال 30 يوم من تاريخ الفاتورة.\n4. الضمانات: يلتزم الطرفان بجميع الشروط المتفق عليها.",
      user_name: "أحمد محمد",
    };

    currentContract = data;
    document.getElementById("contractNumber").textContent =
      data.contract_number;
    document.getElementById("userName").value = data.user_name;

    // عرض البنود بشكل منسق
    const termsHtml = data.terms
      .split("\n")
      .map(
        (term) =>
          `<p class="flex items-start gap-2">
                <span class="text-blue-600">•</span>
                <span>${term.trim()}</span>
            </p>`,
      )
      .join("");
    document.getElementById("contractTerms").innerHTML = termsHtml;
  } catch (error) {
    showStatus("حدث خطأ في تحميل العقد", "error");
  }
}

// دالة التعامل مع البصمة (Biometric)
async function handleBiometricSign() {
  // التحقق من دعم المتصفح للـ Web Authentication
  if (!window.PublicKeyCredential) {
    showStatus("المتصفح لا يدعم المصادقة البيومترية", "error");
    return;
  }

  try {
    // إظهار حالة التحميل
    const button = document.getElementById("signButton");
    button.disabled = true;
    button.innerHTML =
      '<i class="fas fa-spinner fa-spin ml-2"></i> جاري التحقق...';

    // 1. إنشاء تحدٍ (Challenge) عشوائي
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // 2. خيارات المصادقة لـ WebAuthn
    const publicKeyCredentialRequestOptions = {
      challenge: challenge,
      timeout: 60000,
      rpId: window.location.hostname,
      userVerification: "required",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        requireResidentKey: false,
        userVerification: "required",
      },
    };

    // 3. طلب المصادقة (هذا يفتح نافذة البصمة/الوجه)
    const credential = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    // 4. عملية التوقيع - إنشاء Hash لتوقيع العقد
    const contractData = {
      contractId: currentContract.id,
      terms: currentContract.terms,
      user: document.getElementById("userName").value,
      timestamp: new Date().toISOString(),
    };

    // تحويل البيانات إلى نص JSON
    const contractString = JSON.stringify(contractData);

    // 5. تشفير البيانات باستخدام Web Crypto API (محاكاة التوقيع)
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(contractString);

    // هنا يجب استخدام المفتاح الخاص المحمي بالبصمة
    // لكن WebAuthn لا يعطينا المفتاح مباشرة للأمان
    // بدلاً من ذلك، نستخدم خوارزمية HMAC لتوليد توقيع
    const key = await crypto.subtle.generateKey(
      { name: "HMAC", hash: "SHA-256" },
      true,
      ["sign", "verify"],
    );

    const signature = await crypto.subtle.sign("HMAC", key, dataBuffer);

    // تحويل التوقيع إلى نص قابل للتخزين
    signatureHash = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // 6. حفظ التوقيع في قاعدة البيانات
    await saveSignatureToDatabase(signatureHash);

    // 7. تحديث واجهة المستخدم
    isSigned = true;
    updateUIAfterSign();

    showStatus("تم التوقيع بنجاح بواسطة البصمة! ✅", "success");
  } catch (error) {
    console.error("Error during biometric authentication:", error);
    if (error.name === "NotAllowedError") {
      showStatus("تم إلغاء عملية المصادقة من قبل المستخدم", "error");
    } else if (error.name === "NotSupportedError") {
      showStatus("جهازك لا يدعم المصادقة البيومترية", "error");
    } else {
      showStatus("فشلت عملية المصادقة: " + error.message, "error");
    }
  } finally {
    // إعادة تعيين الزر
    const button = document.getElementById("signButton");
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-fingerprint ml-2"></i> تسجيل البصمة';
  }
}

// حفظ التوقيع في قاعدة البيانات
async function saveSignatureToDatabase(hash) {
  try {
    // في التطبيق الحقيقي:
    // const response = await fetch(`${API_BASE}/contracts/${currentContract.id}/sign`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ signature_hash: hash })
    // });
    // const data = await response.json();

    // محاكاة الحفظ في قاعدة البيانات
    console.log("✅ تم حفظ التوقيع في قاعدة البيانات:", hash);

    // محاكاة نجاح الحفظ
    const mockData = {
      contract_number: currentContract.contract_number,
      signed_at: new Date().toISOString(),
      qr_code: `https://verify.example.com/${currentContract.id}`,
    };

    // تخزين مؤقت في localStorage للتجربة
    localStorage.setItem(
      "contractSignature",
      JSON.stringify({
        contractId: currentContract.id,
        hash: hash,
        timestamp: mockData.signed_at,
      }),
    );

    return mockData;
  } catch (error) {
    console.error("Error saving signature:", error);
    throw error;
  }
}

// تحديث واجهة المستخدم بعد التوقيع
function updateUIAfterSign() {
  // تحديث أيقونة البصمة
  const icon = document.getElementById("fingerprintIcon");
  icon.classList.remove("inactive");
  icon.classList.add("active");

  // تحديث النص
  document.getElementById("biometricStatus").textContent =
    "تم التوقيع بواسطة البصمة ✓";
  document.getElementById("biometricStatus").className =
    "text-sm text-green-600";

  // إضافة حالة التوقيع للبطاقة
  document.getElementById("biometricSection").classList.add("signed");

  // إظهار معلومات التوقيع
  const signatureInfo = document.getElementById("signatureInfo");
  signatureInfo.classList.remove("hidden");
  document.getElementById("signedAt").textContent = new Date().toLocaleString(
    "ar-EG",
  );
  document.getElementById("signatureId").textContent =
    signatureHash.substring(0, 30) + "...";

  // إنشاء QR Code (محاكاة)
  const qrImage = document.getElementById("qrCodeImage");
  // في التطبيق الحقيقي، تجيب الصورة من API
  // محاكاة QR Code باستخدام API خارجي
  const qrData = encodeURIComponent(
    JSON.stringify({
      contract: currentContract.contract_number,
      user: document.getElementById("userName").value,
      verified: true,
    }),
  );
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}`;

  // تفعيل الأزرار
  document.getElementById("saveButton").disabled = false;
  document.getElementById("screenshotButton").disabled = false;
}

// حفظ العقد (رفعه للتطبيق الأصلي)
async function saveContract() {
  if (!isSigned) {
    showStatus("يجب التوقيع بالبصمة أولاً", "error");
    return;
  }

  try {
    showStatus("جاري حفظ العقد...", "info");

    // تجميع بيانات العقد
    const contractData = {
      contract: currentContract,
      signature: signatureHash,
      signedAt: new Date().toISOString(),
      userName: document.getElementById("userName").value,
      userEmail: document.getElementById("userEmail").value,
    };

    // في التطبيق الحقيقي، ترسل إلى API
    // const response = await fetch(`${API_BASE}/contracts/save`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(contractData)
    // });

    // محاكاة الحفظ
    console.log("💾 حفظ بيانات العقد:", contractData);
    localStorage.setItem("savedContract", JSON.stringify(contractData));

    showStatus("تم حفظ العقد بنجاح! 🎉", "success");

    // تغيير لون الزر
    const saveBtn = document.getElementById("saveButton");
    saveBtn.innerHTML = '<i class="fas fa-check ml-2"></i> تم الحفظ';
    saveBtn.className =
      "flex-1 bg-gray-400 text-white font-medium py-3 px-6 rounded-lg cursor-default";
    saveBtn.disabled = true;
  } catch (error) {
    showStatus("فشل حفظ العقد: " + error.message, "error");
  }
}

// أخذ لقطة شاشة
function takeScreenshot() {
  if (!isSigned) {
    showStatus("يجب التوقيع بالبصمة قبل أخذ لقطة الشاشة", "error");
    return;
  }

  showStatus("جاري أخذ لقطة الشاشة...", "info");

  // استخدام html2canvas لأخذ لقطة شاشة
  // تأكد من إضافة مكتبة html2canvas: <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

  if (typeof html2canvas === "undefined") {
    showStatus("مكتبة html2canvas غير محملة. يرجى إضافتها.", "error");
    return;
  }

  html2canvas(document.querySelector(".max-w-4xl"), {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    allowTaint: true,
  })
    .then((canvas) => {
      // تحويل إلى صورة
      const imageData = canvas.toDataURL("image/png");

      // في التطبيق الحقيقي، ترفع الصورة إلى الخادم
      // const formData = new FormData();
      // formData.append('screenshot', imageData);
      // formData.append('contract_id', currentContract.id);
      // fetch(`${API_BASE}/contracts/upload-screenshot`, {
      //     method: 'POST',
      //     body: formData
      // });

      // محاكاة رفع الصورة
      console.log("📸 لقطة شاشة:", imageData.substring(0, 100) + "...");

      // حفظ في localStorage مؤقتاً
      localStorage.setItem("contractScreenshot", imageData);

      // عرض معاينة
      const previewWindow = window.open("", "_blank", "width=800,height=600");
      previewWindow.document.write(`
            <html><head><title>لقطة شاشة العقد</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;">
                <img src="${imageData}" style="max-width:100%;max-height:100%;box-shadow:0 0 20px rgba(0,0,0,0.2);" />
                <p style="position:fixed;bottom:20px;font-family:sans-serif;color:#666;">
                    ✅ تم حفظ اللقطة. يمكنك رفعها مع التطبيق الأصلي.
                </p>
            </body></html>
        `);

      showStatus("تم أخذ لقطة الشاشة بنجاح! 📸", "success");
    })
    .catch((error) => {
      console.error("Error taking screenshot:", error);
      showStatus("فشل أخذ اللقطة: " + error.message, "error");
    });
}

// عرض رسائل الحالة
function showStatus(message, type = "info") {
  const statusDiv = document.getElementById("statusMessage");
  statusDiv.classList.remove("hidden");
  statusDiv.className = "mt-4 text-sm p-3 rounded-lg ";

  switch (type) {
    case "success":
      statusDiv.className +=
        "bg-green-50 text-green-700 border border-green-200";
      break;
    case "error":
      statusDiv.className += "bg-red-50 text-red-700 border border-red-200";
      break;
    case "info":
    default:
      statusDiv.className += "bg-blue-50 text-blue-700 border border-blue-200";
      break;
  }

  statusDiv.innerHTML = message;

  // إخفاء الرسالة بعد 5 ثوان
  setTimeout(() => {
    statusDiv.classList.add("hidden");
  }, 5000);
}
