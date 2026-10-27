import { Locator, Page } from "@playwright/test";

export class ProductPage {
  private readonly page: Page;

  // Locators
  private readonly quantityField: Locator;
  private readonly addToCartButton: Locator;
  private readonly addedToCartMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.quantityField = page.getByRole("textbox", { name: "Qty" });
    this.addToCartButton = page.getByRole("button", { name: "Add to Cart", exact: true });
    this.addedToCartMessage = page.getByText(/Success: You have added/);
  }

  /**
   * Checks whether the named product detail page is displayed.
   * @param productName - Expected product name
   * @returns Promise<boolean> - true when the product heading is visible
   */
  async isProductDisplayed(productName: string): Promise<boolean> {
    return this.page.getByRole("heading", { name: productName, exact: true }).isVisible();
  }

  /**
   * Reads the product's displayed price.
   * @returns Promise<string> - Price shown on the product detail page
   */
  async getProductPrice(): Promise<string> {
    return (await this.page.getByRole("heading", { level: 2 }).innerText()).trim();
  }

  /**
   * Sets the requested product quantity.
   * @param quantity - Quantity to add
   */
  async setQuantity(quantity: string): Promise<void> {
    await this.quantityField.fill(quantity);
  }

  /**
   * Adds the selected product to the shopping cart.
   */
  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }

  /**
   * Checks whether OpenCart displayed the add-to-cart success message.
   * @returns Promise<boolean> - true when the success message is visible
   */
  async isAddedToCartMessageDisplayed(): Promise<boolean> {
    await this.addedToCartMessage.waitFor({ state: "visible" });
    return true;
  }
}