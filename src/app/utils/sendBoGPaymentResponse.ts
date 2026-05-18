import { Response } from "express";

export const sendBoGPaymentResponse = (res: Response, bogOrder: any) => {
  const orderStatus =
    bogOrder?.status || bogOrder?.order_details?.order_status?.key;

  const redirectUrl = bogOrder?._links?.redirect?.href;
  const acceptUrl = bogOrder?._links?.accept?.href;
  const detailsUrl = bogOrder?._links?.details?.href;

  if (orderStatus === "completed" || orderStatus === "approved") {
    return res.status(200).json({
      success: true,
      message: "Payment completed successfully",
      paymentStatus: "PAID",
      orderId: bogOrder.id,
      detailsUrl,
    });
  }

  if (redirectUrl) {
    return res.status(200).json({
      success: true,
      message: "Payment requires authentication",
      paymentStatus: "PROCESSING",
      orderId: bogOrder.id,
      redirectUrl,
      detailsUrl,
    });
  }

  if (acceptUrl) {
    return res.status(200).json({
      success: true,
      message: "Apple Pay requires accept step",
      paymentStatus: "PROCESSING",
      orderId: bogOrder.id,
      acceptUrl,
      detailsUrl,
      applePayResult: bogOrder.result,
    });
  }

  return res.status(400).json({
    success: false,
    message: "Payment was not completed and no redirect/accept URL was returned",
    orderId: bogOrder?.id,
    status: orderStatus,
    detailsUrl,
  });
};