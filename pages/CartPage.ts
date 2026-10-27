import { Locator, Page } from "@playwright/test";

export class CartPage {
  private readonly page: Page;

  // Locators
  private readonly cartHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.cartHeading = page.getByRole("heading", { name: /Shopping Cart/ });
  }

  /**
   * Checks whether the shopping cart page is displayed.
   * @returns Promise<boolean> - true when the cart heading is visible
   */
  async isCartDisplayed(): Promise<boolean> {
    return this.cartHeading.isVisible();
  }

  /**
   * Checks whether a named product is present in the cart.
   * @param productName - Expected product name
   * @returns Promise<boolean> - true when the product row is visible
   */
  async isProductInCart(productName: string): Promise<boolean> {
    return this.productRow(productName).isVisible();
  }

  /**
   * Reads the quantity entered for a product in the cart.
   * @param productName - Product whose quantity should be read
   * @returns Promise<string> - Quantity displayed in the product row
   */
  async getProductQuantity(productName: string): Promise<string> {
    return this.productRow(productName).getByRole("textbox").inputValue();
  }

  /**
   * Reads the unit price displayed for a product in the cart.
   * @param productName - Product whose price should be read
   * @returns Promise<string> - Unit price displayed in the product row
   */
  async getProductUnitPrice(productName: string): Promise<string> {
    return this.productRow(productName).getByRole("cell").nth(4).innerText();
  }

  /**
   * Reads the cart total shown in the totals table.
   * @returns Promise<string> - Cart total displayed by OpenCart
   */
  async getCartTotal(): Promise<string> {
    return this.page.getByRole("row").filter({ hasText: "Total:" }).getByRole("cell").last().innerText();
  }

  private productRow(productName: string): Locator {
    return this.page.getByRole("row").filter({
      has: this.page.getByRole("link", { name: productName, exact: true }),
    });
  }
}