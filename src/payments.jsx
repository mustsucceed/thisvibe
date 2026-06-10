import React, { useState } from 'react';
import { PaystackButton } from 'react-paystack';
import './Payment.css';

const Payment = ({ onBack, planAmount }) => {
  // CRITICAL: Always use your PUBLIC key on the frontend!
  const publicKey = "pk_test_1f52fa83fcb715e9add145044865fa751d2212c4"; 
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const componentProps = {
    email,
    amount: planAmount * 100, // Converts the automatically fixed Naira value to Kobo securely
    metadata: {
      name,
      phone,
    },
    publicKey,
    text: "Confirm Payment",
    onSuccess: (reference) =>
      alert(`Thanks for your support! Transaction Reference: ${reference.reference}`),
    onClose: () => alert("Wait! Don't leave just yet."),
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
            zIndex: 10
          }}
        >
          &larr; Back to Plans
        </button>
      )}
      
      <div className="pay-card">
        <div className="pay-header">
          <h1 className="pay-title">Make Your Payment</h1>
          <p className="pay-subtitle">Secure, fast streaming access setup via Paystack</p>
        </div>

        <form className="pay-form" onSubmit={(e) => e.preventDefault()}>
          <div className="pay-input-group">
            <label htmlFor="pay-email" className="pay-label">Email Address</label>
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
            <label htmlFor="pay-amount" className="pay-label">Amount (NGN)</label>
            <input 
              id="pay-amount"
              type="text" 
              className="pay-input pay-input--disabled" 
              value={`₦ ${planAmount.toLocaleString()}`} 
              readOnly 
            />
          </div>

          <div className="pay-input-group">
            <label htmlFor="pay-name" className="pay-label">Full Name</label>
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

          <PaystackButton className="pay-btn" {...componentProps} />
        </form>
      </div>
    </div>
  );
};

export default Payment;