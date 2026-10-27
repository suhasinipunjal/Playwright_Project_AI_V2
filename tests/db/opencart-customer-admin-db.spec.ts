import { test, expect } from "../../fixtures/pageFixtures";
import { RandomDataUtil } from "../../utils/dataGenerator";
import { executeQuery } from "../../utils/dbClient";

type CustomerRecord = {
  customer_id: number;
  firstname: string;
  lastname: string;
  email: string;
  status: number;
  date_added: string | Date;
};

test("New customer is consistent in storefront, admin, and MySQL @master @end-to-end @db", async ({
  page,
  homePage,
  registerPage,
  adminLoginPage,
  adminCustomersPage,
}) => {
  const customer = {
    firstName: RandomDataUtil.getFirstName(),
    lastName: RandomDataUtil.getLastName(),
    email: `db-check.${Date.now()}.${RandomDataUtil.getNumber()}@example.com`,
    telephone: RandomDataUtil.getPhoneNumber(),
    password: RandomDataUtil.getPassword(12),
  };

  await test.step("1) Register a unique customer through the storefront", async () => {
    await homePage.openRegisterPage();
    expect(await registerPage.isRegisterPageDisplayed(), "Storefront registration form should be displayed").toBeTruthy();
    await registerPage.fillRegistrationForm(customer);
    await registerPage.acceptPrivacyPolicy();
    await registerPage.submitRegistration();
    expect(await registerPage.isRegistrationSuccessful(), "The account-created confirmation should be displayed").toBeTruthy();
  });

  await test.step("2) Find and validate the customer in OpenCart administration", async () => {
    expect(process.env.ADMIN_USERNAME, "Set ADMIN_USERNAME in .env").toBeTruthy();
    expect(process.env.ADMIN_PASSWORD, "Set ADMIN_PASSWORD in .env").toBeTruthy();

    await adminLoginPage.open();
    await adminLoginPage.login(process.env.ADMIN_USERNAME!, process.env.ADMIN_PASSWORD!);
    expect(await adminLoginPage.isDashboardDisplayed(), "Administrator should reach the dashboard").toBeTruthy();

    await adminCustomersPage.openCustomerList();
    const customerRow = await adminCustomersPage.searchCustomerByEmail(customer.email);
    expect(customerRow, "Admin customer row should contain the generated first name").toContain(customer.firstName);
    expect(customerRow, "Admin customer row should contain the generated last name").toContain(customer.lastName);
    expect(customerRow, "Admin customer row should contain the generated email").toContain(customer.email);
    expect(customerRow, "New customer should be enabled in administration").toMatch(/Enabled/i);
  });

  await test.step("3) Query MySQL and validate the registered customer", async () => {
    const rows = (await executeQuery(
      "SELECT customer_id, firstname, lastname, email, status, date_added FROM oc_customer WHERE email = ?",
      [customer.email],
    )) as CustomerRecord[];

    expect(rows.length, "Exactly one database customer should match the generated email").toBe(1);
    const [record] = rows;
    expect(record.firstname, "Database first name should match the registered customer").toBe(customer.firstName);
    expect(record.lastname, "Database last name should match the registered customer").toBe(customer.lastName);
    expect(record.email, "Database email should match the registered customer").toBe(customer.email);
    expect(record.status, "Newly registered customer should have enabled status").toBe(1);
    expect(record.date_added, "Customer date_added should be populated").toBeTruthy();
    expect(Number.isNaN(new Date(record.date_added).getTime()), "Customer date_added should be a valid date").toBeFalsy();
  });

  await page.close();
  console.log("Storefront, administrator, and MySQL customer records match.");
});