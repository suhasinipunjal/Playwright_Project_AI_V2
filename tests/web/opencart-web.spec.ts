import path from "node:path";
import { test, expect } from "../../fixtures/pageFixtures";
import { DataProvider } from "../../utils/DataReader";
import { RandomDataUtil } from "../../utils/dataGenerator";
import { Helper } from "../../utils/helper";

type CustomerData = {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  password: string;
};

type LoginDataRow = {
  testName?: string;
  TestName?: string;
  email: string;
  password: string;
  expected: "success" | "failure";
};

const loginDataPath = path.join(process.cwd(), "testdata", "opencart_logindata.json");
const loginData = DataProvider.readJson(loginDataPath) as LoginDataRow[];

function createUniqueCustomer(): CustomerData {
  return {
    firstName: RandomDataUtil.getFirstName(),
    lastName: RandomDataUtil.getLastName(),
    email: `opencart.${Date.now()}.${RandomDataUtil.getNumber()}@example.com`,
    telephone: RandomDataUtil.getPhoneNumber(),
    password: RandomDataUtil.getPassword(12),
  };
}

test("Customer registration succeeds @master @sanity @web", async ({ homePage, registerPage }) => {
  const customer = createUniqueCustomer();

  await test.step("1) Open the application and navigate to registration", async () => {
    await homePage.openRegisterPage();
    expect(await registerPage.isRegisterPageDisplayed()).toBeTruthy();
  });

  await test.step("2) Register a unique customer and accept the privacy policy", async () => {
    await registerPage.fillRegistrationForm(customer);
    await registerPage.acceptPrivacyPolicy();
    await registerPage.submitRegistration();
    expect(await registerPage.isRegistrationSuccessful()).toBeTruthy();
    expect(await registerPage.isAccountNavigationAvailable()).toBeTruthy();
  });

  console.log("Customer registration completed successfully.");
});

test("Customer login succeeds with configured credentials @master @sanity @web", async ({
  homePage,
  loginPage,
  accountPage,
}) => {
  const { email, password } = Helper.getLoginDetails();

  await test.step("1) Open the login page", async () => {
    await homePage.openLoginPage();
    expect(await loginPage.isLoginPageDisplayed()).toBeTruthy();
  });

  await test.step("2) Log in with the configured customer credentials", async () => {
    await loginPage.login(email, password);
    expect(await accountPage.isDashboardDisplayed()).toBeTruthy();
  });

  console.log("Configured customer login completed successfully.");
});

test("Invalid customer login is rejected @master @regression @web", async ({ homePage, loginPage, accountPage }) => {
  const email = RandomDataUtil.getEmail();
  const password = RandomDataUtil.getPassword();

  await test.step("1) Open the login page and submit invalid credentials", async () => {
    await homePage.openLoginPage();
    expect(await loginPage.isLoginPageDisplayed()).toBeTruthy();
    await loginPage.login(email, password);
  });

  await test.step("2) Verify the warning and confirm the customer is not authenticated", async () => {
    expect(await loginPage.isLoginFailureWarningDisplayed()).toBeTruthy();
    expect(await accountPage.isDashboardDisplayed()).toBeFalsy();
  });

  console.log("Invalid customer login was rejected as expected.");
});

test("Customer logout completes successfully @master @sanity @web", async ({
  homePage,
  loginPage,
  accountPage,
}) => {
  const { email, password } = Helper.getLoginDetails();

  await test.step("1) Log in with the configured customer credentials", async () => {
    await homePage.openLoginPage();
    await loginPage.login(email, password);
    expect(await accountPage.isDashboardDisplayed()).toBeTruthy();
  });

  await test.step("2) Log out and verify the confirmation page", async () => {
    await accountPage.logout();
    expect(await accountPage.isLogoutConfirmationDisplayed()).toBeTruthy();
  });

  await test.step("3) Continue to the home page and verify authenticated options are unavailable", async () => {
    await accountPage.continueAfterLogout();
    expect(await homePage.isHomePageDisplayed()).toBeTruthy();
    await homePage.openLoginPage();
    expect(await accountPage.isLogoutLinkAvailable()).toBeFalsy();
  });

  console.log("Customer logout completed successfully.");
});

test("Product search displays the expected product @master @sanity @web", async ({
  homePage,
  searchResultsPage,
}) => {
  const { productName } = Helper.getProductDetails();

  await test.step("1) Search the store for the known product", async () => {
    await homePage.searchForProduct(productName);
    expect(await searchResultsPage.areResultsDisplayed()).toBeTruthy();
    expect(await searchResultsPage.isProductListed(productName)).toBeTruthy();
  });

  console.log("Product search completed successfully.");
});

test("Product can be added to the shopping cart @master @sanity @web", async ({
  homePage,
  searchResultsPage,
  productPage,
  cartPage,
}) => {
  const { productName, productQuantity, totalPrice } = Helper.getProductDetails();

  await test.step("1) Search for the product and open its details", async () => {
    await homePage.searchForProduct(productName);
    expect(await searchResultsPage.isProductListed(productName)).toBeTruthy();
    await searchResultsPage.openProduct(productName);
    expect(await productPage.isProductDisplayed(productName)).toBeTruthy();
    expect(await productPage.getProductPrice()).toBe(totalPrice);
  });

  await test.step("2) Add the requested quantity and verify the cart", async () => {
    await productPage.setQuantity(productQuantity);
    await productPage.addToCart();
    expect(await productPage.isAddedToCartMessageDisplayed()).toBeTruthy();
    await homePage.openShoppingCart();
    expect(await cartPage.isCartDisplayed()).toBeTruthy();
    expect(await cartPage.isProductInCart(productName)).toBeTruthy();
    expect(await cartPage.getProductQuantity(productName)).toBe(productQuantity);
    expect((await cartPage.getProductUnitPrice(productName)).trim()).toBe(totalPrice);
    expect((await cartPage.getCartTotal()).trim()).toBe(totalPrice);
  });

  console.log("Product was added to the shopping cart successfully.");
});

test("End-to-end customer shopping journey completes @master @end-to-end @web", async ({
  homePage,
  registerPage,
  loginPage,
  accountPage,
  searchResultsPage,
  productPage,
  cartPage,
}) => {
  const customer = createUniqueCustomer();
  const { productName, productQuantity, totalPrice } = Helper.getProductDetails();

  await test.step("1) Register a new customer", async () => {
    await homePage.openRegisterPage();
    await registerPage.fillRegistrationForm(customer);
    await registerPage.acceptPrivacyPolicy();
    await registerPage.submitRegistration();
    expect(await registerPage.isRegistrationSuccessful()).toBeTruthy();
    expect(await registerPage.isAccountNavigationAvailable()).toBeTruthy();
  });

  await test.step("2) Log out and log in with the newly created credentials", async () => {
    await accountPage.logout();
    expect(await accountPage.isLogoutConfirmationDisplayed()).toBeTruthy();
    await accountPage.continueAfterLogout();
    await homePage.openLoginPage();
    await loginPage.login(customer.email, customer.password);
    expect(await accountPage.isDashboardDisplayed()).toBeTruthy();
  });

  await test.step("3) Search for the product and open its details", async () => {
    await homePage.searchForProduct(productName);
    expect(await searchResultsPage.areResultsDisplayed()).toBeTruthy();
    expect(await searchResultsPage.isProductListed(productName)).toBeTruthy();
    await searchResultsPage.openProduct(productName);
    expect(await productPage.isProductDisplayed(productName)).toBeTruthy();
    expect(await productPage.getProductPrice()).toBe(totalPrice);
  });

  await test.step("4) Add the product and validate cart contents and totals", async () => {
    await productPage.setQuantity(productQuantity);
    await productPage.addToCart();
    expect(await productPage.isAddedToCartMessageDisplayed()).toBeTruthy();
    await homePage.openShoppingCart();
    expect(await cartPage.isCartDisplayed()).toBeTruthy();
    expect(await cartPage.isProductInCart(productName)).toBeTruthy();
    expect(await cartPage.getProductQuantity(productName)).toBe(productQuantity);
    expect((await cartPage.getProductUnitPrice(productName)).trim()).toBe(totalPrice);
    expect((await cartPage.getCartTotal()).trim()).toBe(totalPrice);
  });

  console.log("End-to-end shopping journey completed successfully.");
});

test.describe("Data-driven customer login @master @web", () => {
  loginData.forEach((row, index) => {
    const scenarioName = row.testName ?? row.TestName ?? `Login data row ${index + 1}`;

    test(`${scenarioName} (${index + 1}) @datadriven`, async ({ homePage, loginPage, accountPage }) => {
      const credentials = row.expected === "success" ? Helper.getLoginDetails() : row;

      await test.step("1) Open the login page and submit the external test data", async () => {
        await homePage.openLoginPage();
        expect(await loginPage.isLoginPageDisplayed()).toBeTruthy();
        await loginPage.login(credentials.email.trim(), credentials.password.trim());
      });

      await test.step("2) Verify the actual login result against the dataset", async () => {
        if (row.expected === "success") {
          expect(await accountPage.isDashboardDisplayed()).toBeTruthy();
        } else {
          expect(await loginPage.isLoginFailureWarningDisplayed()).toBeTruthy();
          expect(await accountPage.isDashboardDisplayed()).toBeFalsy();
        }
      });

      console.log(`Data-driven login scenario completed: ${scenarioName}.`);
    });
  });
});