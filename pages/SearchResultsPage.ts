import { Locator, Page } from "@playwright/test";

export class SearchResultsPage {
  private readonly page: Page;

  // Locators
  private readonly resultsHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.resultsHeading = page.getByRole("heading", { name: "Products meeting the search criteria", exact: true });
  }

  /**
   * Checks whether the product search results are displayed.
   * @returns Promise<boolean> - true when the results heading is visible
   */
  async areResultsDisplayed(): Promise<boolean> {
    return this.resultsHeading.isVisible();
  }

  /**
   * Checks whether the named product appears in the results.
   * @param productName - Expected product name
   * @returns Promise<boolean> - true when the exact product link is visible
   */
  async isProductListed(productName: string): Promise<boolean> {
    return this.page.getByRole("heading", { name: productName, exact: true })
      .getByRole("link", { name: productName, exact: true })
      .isVisible();
  }

  /**
   * Opens the named product from the search results.
   * @param productName - Product name to open
   */
  async openProduct(productName: string): Promise<void> {
    await this.page.getByRole("heading", { name: productName, exact: true })
      .getByRole("link", { name: productName, exact: true })
      .click();
  }
}