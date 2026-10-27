import { Locator, Page } from "@playwright/test";

export class RegisterPage {
  private readonly page: Page;

  // Locators
  private readonly firstNameField: Locator;
  private readonly lastNameField: Locator;
  private readonly emailField: Locator;
  private readonly telephoneField: Locator;
  private readonly passwordField: Locator;
  private readonly passwordConfirmField: Locator;
  private readonly privacyPolicyCheckbox: Locator;
  private readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.firstNameField = page.getByPlaceholder("First Name", { exact: true });
    this.lastNameField = page.getByPlaceholder("Last Name", { exact: true });
    this.emailField = page.getByPlaceholder("E-Mail", { exact: true });
    this.telephoneField = page.getByPlaceholder("Telephone", { exact: true });
    this.passwordField = page.getByPlaceholder("Password", { exact: true });
    this.passwordConfirmField = page.getByPlaceholder("Password Confirm", { exact: true });
    this.privacyPolicyCheckbox = page.locator('input[name="agree"]');
    this.continueButton = page.getByRole("button", { name: "Continue", exact: true });
  }

  /**
   * Checks whether the registration form is displayed.
   * @returns Promise<boolean> - true when the registration heading is visible
   */
  async isRegisterPageDisplayed(): Promise<boolean> {
    await this.page.getByRole("heading", { name: "Register Account", exact: true }).waitFor({ state: "visible" });
    return true;
  }

  /**
   * Fills the customer registration form.
   * @param customer - Customer name, contact, and password values
   */
  async fillRegistrationForm(customer: {
    firstName: string;
    lastName: string;
    email: string;
    telephone: string;
    password: string;
  }): Promise<void> {
    await this.firstNameField.fill(customer.firstName);
    await this.lastNameField.fill(customer.lastName);
    await this.emailField.fill(customer.email);
    await this.telephoneField.fill(customer.telephone);
    await this.passwordField.fill(customer.password);
    await this.passwordConfirmField.fill(customer.password);
  }

  /**
   * Accepts the store privacy policy.
   */
  async acceptPrivacyPolicy(): Promise<void> {
    await this.privacyPolicyCheckbox.check();
  }

  /**
   * Submits the registration form.
   */
  async submitRegistration(): Promise<void> {
    await this.continueButton.click();
  }

  /**
   * Checks whether the registration success page is displayed.
   * @returns Promise<boolean> - true when the account-created heading is visible
   */
  async isRegistrationSuccessful(): Promise<boolean> {
    return this.page.getByRole("heading", { name: "Your Account Has Been Created!", exact: true }).isVisible();
  }

  /**
   * Checks whether authenticated account navigation is available after registration.
   * @returns Promise<boolean> - true when the account navigation link is visible
   */
  async isAccountNavigationAvailable(): Promise<boolean> {
    return this.page.getByRole("complementary").getByRole("link", { name: "My Account", exact: true }).isVisible();
  }
}