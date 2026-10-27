export class Helper {
  static convertPriceToNumber(price: string): number {
    return Number(price.replace(/[^\d.]/g, ""));
  }

  static getProductDetails() {
    return {
      productName: "MacBook",
      productQuantity: "1",
      totalPrice: "$602.00",
    };
  }

  static getLoginDetails() {
    return {
      email: process.env.APP_EMAIL || "annadsouza@yahoo.com",
      password: process.env.APP_PASSWORD || "anna1dsouza",
    };
  }
}