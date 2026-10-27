import { Locator, Page } from "@playwright/test";

export class AccountPage {
  private readonly page: Page;

  // Locators
  private readonly accountHeading: Locator;
  private readonly logoutLink: Locator;
  private readonly logoutHeading: Locator;
  private readonly continueLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.accountHeading = page.locator("#content").getByRole("heading", { name: "My Account", exact: true });
    this.logoutLink = page.getByRole("link", { name: "Logout", exact: true });
    this.logoutHeading = page.getByRole("heading", { name: "Account Logout", exact: true });
    this.continueLink = page.getByRole("link", { name: "Continue", exact: true });
  }

  /**
   * Checks whether the authenticated account dashboard is displayed.
   * @returns Promise<boolean> - true when the My Account heading is visible
   */
  async isDashboardDisplayed(): Promise<boolean> {
    return this.accountHeading.isVisible();
  }

  /**
   * Logs out the current customer.
   */
  async logout(): Promise<void> {
    await this.logoutLink.click();
  }

  /**
   * Checks whether the logout confirmation page is displayed.
   * @returns Promise<boolean> - true when the logout heading is visible
   */
  async isLogoutConfirmationDisplayed(): Promise<boolean> {
    return this.logoutHeading.isVisible();
  }

  /**
   * Continues from the logout confirmation page.
   */
  async continueAfterLogout(): Promise<void> {
    await this.continueLink.click();
  }

  /**
   * Checks whether the authenticated Logout option remains available.
   * @returns Promise<boolean> - true when the Logout link is visible
   */
  async isLogoutLinkAvailable(): Promise<boolean> {
    return this.logoutLink.isVisible();
  }
}