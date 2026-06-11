import { useMemo, useState } from "react";
import "./payment.css";

const PAYSTACK_SCRIPT_URL = "https://js.paystack.co/v1/inline.js";

const loadPaystackScript = () =>
  new Promise((resolve, reject) => {
    if (window.PaystackPop?.setup) {
      resolve(window.PaystackPop);
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${PAYSTACK_SCRIPT_URL}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => {
          if (window.PaystackPop?.setup) {
            resolve(window.PaystackPop);
            return;
          }

          reject(new Error("Paystack checkout loaded incorrectly."));
        },
        {
          once: true,
        },
      );
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = PAYSTACK_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.PaystackPop?.setup) {
        resolve(window.PaystackPop);
        return;
      }

      reject(new Error("Paystack checkout loaded incorrectly."));
    };
    script.onerror = () =>
      reject(new Error("Could not load Paystack checkout."));
    document.body.appendChild(script);
  });

const Payment = ({ onBack, planAmount }) => {
  // CRITICAL: Always use your PUBLIC key on the frontend!
  const publicKey =
    import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
    "pk_test_1f52fa83fcb715e9add145044865fa751d2212c4";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isOpening, setIsOpening] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const planAmountNumber = Number(planAmount);
  const safePlanAmount =
    Number.isFinite(planAmountNumber) && planAmountNumber > 0
      ? planAmountNumber
      : 3000;
  const amountInKobo = useMemo(() => safePlanAmount * 100, [safePlanAmount]);

  const handlePayment = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail) {
      setErrorMessage("Enter your email address before opening Paystack.");
      return;
    }

    if (amountInKobo <= 0) {
      setErrorMessage("Choose a valid plan before opening Paystack.");
      return;
    }

    if (!publicKey) {
      setErrorMessage("Paystack public key is missing.");
      return;
    }

    setIsOpening(true);
    setErrorMessage("");

    try {
      const PaystackPop = await loadPaystackScript();
      const checkout = PaystackPop.setup({
        key: publicKey,
        email: trimmedEmail,
        amount: amountInKobo,
        currency: "NGN",
        metadata: {
          custom_fields: [
            {
              display_name: "Full Name",
              variable_name: "full_name",
              value: trimmedName || "Customer",
            },
          ],
        },
        callback: (reference) => {
          setIsOpening(false);
          alert(
            `Thanks for your support! Transaction Reference: ${reference.reference}`,
          );
        },
        onClose: () => {
          setIsOpening(false);
        },
      });

      checkout.openIframe();
    } catch (error) {
      setErrorMessage(
        error.message || "Paystack checkout could not be opened.",
      );
      setIsOpening(false);
    }
  };

  return (
    <div className="pay-wrapper">
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            padding: "10px 20px",
            background: "#8B5CF6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            zIndex: 10,
          }}
        >
          &larr; Back to Plans
        </button>
      )}

      <div className="pay-card">
        <div className="pay-header">
          <h1 className="pay-title">Make Your Payment</h1>
          <p className="pay-subtitle">
            Secure, fast streaming access setup via Paystack
          </p>
        </div>

        <form className="pay-form" onSubmit={(e) => e.preventDefault()}>
          <div className="pay-input-group">
            <label htmlFor="pay-email" className="pay-label">
              Email Address
            </label>
            <input
              id="pay-email"
              type="email"
              placeholder="you@example.com"
              className="pay-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Automatically Populated & Fixed Amount Field */}
          <div className="pay-input-group">
            <label htmlFor="pay-amount" className="pay-label">
              Amount (NGN)
            </label>
            <input
              id="pay-amount"
              type="text"
              className="pay-input pay-input--disabled"
              value={`NGN ${safePlanAmount.toLocaleString()}`}
              readOnly
            />
          </div>

          <div className="pay-input-group">
            <label htmlFor="pay-name" className="pay-label">
              Full Name
            </label>
            <input
              id="pay-name"
              type="text"
              placeholder="John Doe"
              className="pay-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* <div className="pay-input-group">
            <label htmlFor="pay-phone" className="pay-label">Phone Number</label>
            <input 
              id="pay-phone"
              type="tel" 
              placeholder="08012345678" 
              className="pay-input" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
            />
          </div> */}

          {errorMessage && <p className="pay-error">{errorMessage}</p>}
          <button
            className="pay-btn"
            type="button"
            onClick={handlePayment}
            disabled={isOpening}
          >
            {isOpening ? "Opening Paystack..." : "Confirm Payment"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Payment;
