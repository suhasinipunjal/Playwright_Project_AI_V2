import { Locator, Page } from "@playwright/test";

export class AdminCustomersPage {
  // Locators
  private readonly customersMenu: Locator;
  private readonly customerListLink: Locator;
  private readonly emailFilter: Locator;
  private readonly filterButton: Locator;

  constructor(page: Page) {
    // Initialize locators with CSS selectors
    this.customersMenu = page.locator("a.parent").filter({ hasText: "Customers" });
    this.customerListLink = page.locator('a[href*="route=customer/customer&"]').filter({ hasText: "Customers" });
    this.emailFilter = page.locator('input[name="filter_email"]');
    this.filterButton = page.locator("#button-filter");
  }

  /**
   * Opens the Customers list from the administration menu.
   */
  async openCustomerList(): Promise<void> {
    await this.customersMenu.click();
    await this.customerListLink.click();
    await this.emailFilter.waitFor({ state: "visible" });
  }

  /**
   * Filters customers by email and returns the matching table row text.
   * @param email - Unique email address to search for
   * @returns Promise<string> - Visible text of the matching customer row
   */
  async searchCustomerByEmail(email: string): Promise<string> {
    await this.emailFilter.fill(email);
    await this.filterButton.click();
    const customerRow = this.pageRow(email);
    await customerRow.waitFor({ state: "visible" });
    return customerRow.innerText();
  }

  private pageRow(email: string): Locator {
    return this.emailFilter.page().getByRole("row").filter({ hasText: email });
  }
}