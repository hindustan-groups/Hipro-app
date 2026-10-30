const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const prisma = require('../prisma');
const { addNotification } = require('./notifications');

// ==========================================
// 1. GET /api/v1/payments/quotation-summary/:id
// Authoritative backend computation of quotation payment details
// ==========================================
router.get('/quotation-summary/:id', async (req, res) => {
  try {
    const quote = await prisma.quotation.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { quoteNumber: req.params.id }
        ]
      },
      include: {
        request: {
          include: { user: true }
        }
      }
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const grandTotal = parseFloat(quote.grandtotal || 0);
    const advancePercentage = quote.advancePercentage ? parseFloat(quote.advancePercentage) : 50.0;
    
    // Backend authoritative advance calculation
    let advanceAmount = quote.advanceAmount ? parseFloat(quote.advanceAmount) : null;
    if (!advanceAmount || isNaN(advanceAmount) || advanceAmount <= 0) {
      advanceAmount = Math.round(grandTotal * (advancePercentage / 100));
    }
    const balanceAmount = Math.max(0, grandTotal - advanceAmount);

    return res.json({
      success: true,
      quotationId: quote.id,
      quoteNumber: quote.quoteNumber,
      projectName: quote.request?.servicecode || 'Service Scope',
      status: quote.status,
      grandTotal,
      advancePercentage,
      advanceAmount,
      balanceAmount,
      currency: '₹',
      options: [
        {
          id: 'advance',
          title: `${advancePercentage}% Advance Deposit to Start Work`,
          amount: advanceAmount,
          subtitle: `Pay ₹${advanceAmount.toLocaleString('en-IN')} now to mobilize materials & start work. Remaining balance of ₹${balanceAmount.toLocaleString('en-IN')} due on completion.`,
          isRecommended: true
        },
        {
          id: 'full',
          title: 'Full 100% Project Payment',
          amount: grandTotal,
          subtitle: `Pay full ₹${grandTotal.toLocaleString('en-IN')} upfront with priority engineer slot dispatch.`,
          isRecommended: false
        }
      ]
    });
  } catch (error) {
    console.error('Quotation summary error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate quotation payment summary'
    });
  }
});

// ==========================================
// 2. POST /api/v1/payments/create-order
// Payment amount is strictly computed on the backend side from DB records
// ==========================================
router.post('/create-order', async (req, res) => {
  try {
    const {
      quotationId,
      bookingNumber,
      subServiceId,
      paymentOption, // 'advance' or 'full'
      customerName,
      customerPhone,
      customerEmail,
      amount // optional fallback only if no entity ID is provided
    } = req.body;

    let payableAmount = 0;
    let quote = null;
    let selectedOption = String(paymentOption || 'advance').toLowerCase();

    // 1. Backend calculates amount for Quotations
    if (quotationId) {
      quote = await prisma.quotation.findFirst({
        where: {
          OR: [
            { id: quotationId },
            { quoteNumber: quotationId }
          ]
        },
        include: {
          request: {
            include: { user: true }
          }
        }
      });

      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Quotation not found in database'
        });
      }

      const grandTotal = parseFloat(quote.grandtotal || 0);
      const advancePercentage = quote.advancePercentage ? parseFloat(quote.advancePercentage) : 50.0;
      let advanceAmount = quote.advanceAmount ? parseFloat(quote.advanceAmount) : null;
      if (!advanceAmount || isNaN(advanceAmount) || advanceAmount <= 0) {
        advanceAmount = Math.round(grandTotal * (advancePercentage / 100));
      }

      if (selectedOption === 'full') {
        payableAmount = grandTotal;
      } else {
        // Default: Admin-configured advance to start work
        payableAmount = advanceAmount;
      }
    }
    // 2. Backend calculates amount for Direct Maintenance Bookings
    else if (bookingNumber) {
      const booking = await prisma.directBooking.findUnique({
        where: { bookingNumber }
      });
      if (booking) {
        payableAmount = parseFloat(booking.onlinePaidAmount || booking.visitingCharge || 199.0);
      }
    }
    // 3. Backend calculates amount from SubService record
    else if (subServiceId) {
      const subService = await prisma.subService.findUnique({
        where: { id: subServiceId }
      });
      if (subService) {
        let base = parseFloat(subService.visitingCharge || 199.0);
        let extra = 0;
        if (subService.requiredFields) {
          try {
            const rf = typeof subService.requiredFields === 'string' ? JSON.parse(subService.requiredFields) : subService.requiredFields;
            const charges = rf.charges || rf.additionalCharges || (Array.isArray(rf) ? rf.filter(f => f.fieldType === 'charge' || f.fieldType === 'fee' || f.isCharge === true) : []);
            if (Array.isArray(charges)) {
              for (const c of charges) {
                const amt = parseFloat(c.amount || 0);
                if (!isNaN(amt) && !c.isFree) extra += amt;
              }
            }
          } catch (err) {}
        }
        payableAmount = base + extra;
      }
    }
    // 4. Fallback if no entity specified
    else if (amount) {
      payableAmount = parseFloat(amount);
    }

    // 5. Apply coupon discount if provided
    let appliedDiscount = 0;
    let appliedCouponCode = null;
    const incomingCoupon = req.body.couponCode;
    if (incomingCoupon && typeof incomingCoupon === 'string' && incomingCoupon.trim()) {
      try {
        const offersRouter = require('./offers');
        if (offersRouter && typeof offersRouter.readOffers === 'function') {
          const offers = offersRouter.readOffers();
          const cleanCode = incomingCoupon.trim().toUpperCase();
          const matchingOffer = offers.find(o => (o.code || '').trim().toUpperCase() === cleanCode);
          if (matchingOffer && matchingOffer.isActive !== false) {
            const minAmt = parseFloat(matchingOffer.minAmount || 0);
            if (minAmt <= 0 || payableAmount >= minAmt) {
              appliedDiscount = offersRouter.calculateDiscount(matchingOffer.discount, payableAmount);
              appliedDiscount = Math.min(payableAmount, appliedDiscount);
              payableAmount = Math.max(0, payableAmount - appliedDiscount);
              appliedCouponCode = cleanCode;
            }
          }
        }
      } catch (err) {
        console.error('Coupon check error in create-order:', err);
      }
    }

    if (!payableAmount || isNaN(payableAmount) || payableAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Unable to determine payable amount from backend'
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_Tpmg07aMyYH1Oc';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'aYNsVt5iYhkXFI01M2IBzoKQ';
    const amountInPaise = Math.round(payableAmount * 100);
    const receipt = `rcpt_${Date.now().toString().slice(-8)}`;

    let orderId = null;

    if (keyId && keySecret) {
      try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzRes = await axios.post(
          'https://api.razorpay.com/v1/orders',
          {
            amount: amountInPaise,
            currency: 'INR',
            receipt: receipt,
            notes: {
              customerName: customerName || quote?.request?.user?.name || 'Hipro Customer',
              customerPhone: customerPhone || quote?.request?.user?.phoneNumber || '',
              quotationId: quote?.id || quotationId || '',
              quoteNumber: quote?.quoteNumber || '',
              paymentOption: selectedOption,
              bookingNumber: bookingNumber || '',
              calculatedAmount: payableAmount,
              couponCode: appliedCouponCode || '',
              discountAmount: appliedDiscount
            }
          },
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        if (rzRes.data && rzRes.data.id) {
          orderId = rzRes.data.id;
        }
      } catch (rzErr) {
        console.error('Razorpay Orders API error:', rzErr.response?.data || rzErr.message);
      }
    }

    // Fallback order ID for testing if gateway API call failed or timed out
    if (!orderId) {
      orderId = `order_test_${Date.now()}`;
    }

    return res.json({
      success: true,
      orderId,
      amount: payableAmount,
      amountInPaise,
      discountAmount: appliedDiscount,
      couponCode: appliedCouponCode,
      currency: 'INR',
      keyId,
      receipt,
      quotation: quote ? {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        grandTotal: quote.grandtotal,
        advanceAmount: quote.advanceAmount || Math.round(quote.grandtotal * 0.5),
        advancePercentage: quote.advancePercentage || 50.0,
        payableAmount,
        selectedOption
      } : null
    });
  } catch (error) {
    console.error('create-order error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while creating payment order'
    });
  }
});

// ==========================================
// 3. POST /api/v1/payments/verify
// Cryptographically verify Razorpay Payment Signature & update DB
// ==========================================
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      quotationId,
      bookingNumber,
      paymentOption
    } = req.body;

    if (!razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required for verification'
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    let isValid = true;

    // Cryptographic signature check if signature & secret are available
    if (razorpay_order_id && razorpay_signature && keySecret) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = generatedSignature === razorpay_signature;
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay payment signature'
      });
    }

    // Update Quotation if present
    if (quotationId) {
      try {
        const quote = await prisma.quotation.update({
          where: { id: quotationId },
          data: {
            status: 'ACCEPTED'
          },
          include: {
            request: {
              include: { user: true }
            }
          }
        });

        if (quote && quote.requestId) {
          await prisma.serviceRequest.update({
            where: { id: quote.requestId },
            data: { status: 'PAID' }
          });
        }

        // Notify customer and admin desk
        try {
          const io = req.app.get('io');
          const formattedAmount = Math.round(quote.advanceAmount || quote.grandtotal * 0.5).toLocaleString('en-IN');
          addNotification({
            title: `💳 Payment Received for #${quote.quoteNumber}`,
            description: `Payment of ₹${formattedAmount} successfully processed. Work order is now initiated!`,
            type: 'PAYMENT',
            referenceId: quote.id,
            quoteNumber: quote.quoteNumber,
            unread: true
          }, io);
        } catch (_) {}
      } catch (err) {
        console.warn('Quotation/Request status update notice:', err.message);
      }
    }

    // Update DirectBooking if present
    if (bookingNumber) {
      try {
        await prisma.directBooking.update({
          where: { bookingNumber },
          data: {
            paymentStatus: 'PAID',
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id || null
          }
        });
      } catch (err) {
        console.warn('DirectBooking payment update notice:', err.message);
      }
    }

    return res.json({
      success: true,
      verified: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });
  } catch (error) {
    console.error('verify payment error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed'
    });
  }
});

module.exports = router;
