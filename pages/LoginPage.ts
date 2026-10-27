import { Locator, Page } from "@playwright/test";

export class LoginPage {
  private readonly page: Page;

  // Locators
  private readonly emailField: Locator;
  private readonly passwordField: Locator;
  private readonly loginButton: Locator;
  private readonly loginFailureWarning: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.emailField = page.getByRole("textbox", { name: "E-Mail Address" });
    this.passwordField = page.getByRole("textbox", { name: "Password", exact: true });
    this.loginButton = page.getByRole("button", { name: "Login", exact: true });
    this.loginFailureWarning = page.getByText(
      /Warning: (No match for E-Mail Address and\/or Password\.|Your account has exceeded allowed number of login attempts\.)/,
    );
  }

  /**
   * Checks whether the returning-customer login form is displayed.
   * @returns Promise<boolean> - true when the login form heading is visible
   */
  async isLoginPageDisplayed(): Promise<boolean> {
    return this.page.getByRole("heading", { name: "Returning Customer", exact: true }).isVisible();
  }

  /**
   * Enters credentials and submits the login form.
   * @param email - Customer email address, or an empty string
   * @param password - Customer password, or an empty string
   */
  async login(email: string, password: string): Promise<void> {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    await this.loginButton.click();
  }

  /**
   * Checks whether the expected invalid-login warning is displayed.
   * @returns Promise<boolean> - true when the warning is visible
   */
  async isLoginFailureWarningDisplayed(): Promise<boolean> {
    await this.loginFailureWarning.waitFor({ state: "visible" });
    return true;
  }
}