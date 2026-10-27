import { Locator, Page } from "@playwright/test";

export class HomePage {
  private readonly page: Page;

  // Locators
  private readonly accountMenu: Locator;
  private readonly searchField: Locator;
  private readonly shoppingCartLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.accountMenu = page.getByRole("navigation").first().getByRole("link", { name: /My Account/ });
    this.searchField = page.getByRole("textbox", { name: "Search" });
    this.shoppingCartLink = page.getByRole("navigation").first().getByRole("link", { name: /Shopping Cart/ });
  }

  /**
   * Opens the registration page from the My Account menu.
   */
  async openRegisterPage(): Promise<void> {
    await this.accountMenu.click();
    await this.page.getByRole("link", { name: "Register", exact: true }).click();
  }

  /**
   * Opens the login page from the My Account menu.
   */
  async openLoginPage(): Promise<void> {
    await this.accountMenu.click();
    await this.page.getByRole("link", { name: "Login", exact: true }).click();
  }

  /**
   * Searches the store for a product.
   * @param productName - Product name to search for
   */
  async searchForProduct(productName: string): Promise<void> {
    await this.searchField.fill(productName);
    await this.searchField.press("Enter");
  }

  /**
   * Opens the shopping cart from the store header.
   */
  async openShoppingCart(): Promise<void> {
    await this.shoppingCartLink.click();
  }

  /**
   * Checks whether the store home page is displayed.
   * @returns Promise<boolean> - true when the Featured section is visible
   */
  async isHomePageDisplayed(): Promise<boolean> {
    return this.page.getByRole("heading", { name: "Featured", exact: true }).isVisible();
  }
}