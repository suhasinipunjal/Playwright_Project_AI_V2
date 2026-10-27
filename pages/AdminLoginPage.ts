import { Locator, Page } from "@playwright/test";

export class AdminLoginPage {
  private readonly page: Page;
  private readonly adminUrl: string;

  // Locators
  private readonly usernameField: Locator;
  private readonly passwordField: Locator;
  private readonly loginButton: Locator;

  constructor(page: Page, adminUrl: string) {
    this.page = page;
    this.adminUrl = adminUrl;

    // Initialize locators with CSS selectors
    this.usernameField = page.getByRole("textbox", { name: "Username", exact: true });
    this.passwordField = page.getByRole("textbox", { name: "Password", exact: true });
    this.loginButton = page.getByRole("button", { name: /Login/ });
  }

  /**
   * Opens the OpenCart administration login page.
   */
  async open(): Promise<void> {
    await this.page.goto(this.adminUrl);
  }

  /**
   * Logs in to OpenCart administration.
   * @param username - Configured administrator username
   * @param password - Configured administrator password
   */
  async login(username: string, password: string): Promise<void> {
    await this.usernameField.fill(username);
    await this.passwordField.fill(password);
    await this.loginButton.click();
  }

  /**
   * Checks whether the administrator dashboard is displayed.
   * @returns Promise<boolean> - true when the Dashboard heading is visible
   */
  async isDashboardDisplayed(): Promise<boolean> {
    return this.page.getByRole("heading", { name: "Dashboard", exact: true }).isVisible();
  }
}