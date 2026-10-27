import path from "node:path";
import Ajv from "ajv";
import dotenv from "dotenv";
import { test, expect } from "@playwright/test";
import { Routes } from "../../api/endpoints/routes";
import { DataProvider } from "../../utils/DataReader";
import { RandomDataUtil } from "../../utils/dataGenerator";

dotenv.config();

type Product = {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating?: { rate: number; count: number };
};

type User = {
  id: number;
  email: string;
  username: string;
  password: string;
  name: { firstname: string; lastname: string };
  address: {
    city: string;
    street: string;
    number: number;
    zipcode: string;
    geolocation: { lat: string; long: string };
  };
  phone: string;
  __v: number;
};

type Cart = {
  id: number;
  userId: number;
  date: string;
  products: Array<{ productId: number; quantity: number }>;
  __v: number;
};

const BASE_URL = (process.env.API_BASE_URL || Routes.BASE_URL).replace(/\/$/, "");
const PRODUCT_ID = Number(process.env.PRODUCT_ID ?? 1);
const USER_ID = Number(process.env.USER_ID ?? 1);
const CART_ID = Number(process.env.CART_ID ?? 1);
const LIMIT = Number(process.env.LIMIT ?? 3);
const START_DATE = process.env.START_DATE ?? "";
const END_DATE = process.env.END_DATE ?? "";
const ajv = new Ajv();

function apiUrl(route: string): string {
  return `${BASE_URL}${route}`;
}

function isSortedAscending(ids: number[]): boolean {
  return ids.every((id, index) => index === 0 || ids[index - 1] <= id);
}

function isSortedDescending(ids: number[]): boolean {
  return ids.every((id, index) => index === 0 || ids[index - 1] >= id);
}

function expectProductFields(product: Product): void {
  expect(typeof product.id, "Product id must be a number").toBe("number");
  expect(typeof product.title, "Product title must be a string").toBe("string");
  expect(typeof product.price, "Product price must be a number").toBe("number");
  expect(typeof product.category, "Product category must be a string").toBe("string");
  expect(typeof product.image, "Product image must be a string").toBe("string");
}

function expectValidSchema(schemaName: string, schema: object, responseBody: unknown): void {
  const validate = ajv.compile(schema);
  const isValid = validate(responseBody);
  expect(isValid, `${schemaName} schema errors: ${JSON.stringify(validate.errors)}`).toBeTruthy();
}

async function expectDeletedIdWhenProvided(response: { text(): Promise<string> }, expectedId: number): Promise<void> {
  const responseBody = (await response.text()).trim();
  if (responseBody) {
    const deleted = JSON.parse(responseBody) as { id?: number } | null;
    if (deleted && typeof deleted.id === "number") {
      expect(deleted.id, "Delete response id should match the requested id").toBe(expectedId);
    }
  }
}

test.describe("FakeStore REST API @api", () => {
  // ---------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------

  test("POST - Successful login @master @sanity @api", async ({ request }) => {
    const userRoute = Routes.GET_USER_BY_ID.replace("{id}", String(USER_ID));
    const userResponse = await request.get(apiUrl(userRoute));
    expect(userResponse.status(), "Seeded user lookup should return HTTP 200").toBe(200);
    const user = (await userResponse.json()) as User;

    const response = await request.post(apiUrl(Routes.AUTH_LOGIN), {
      data: { username: user.username, password: user.password },
    });

    expect(response.status(), "Valid credentials should return HTTP 201").toBe(201);
    const responseBody = await response.json();
    expect(typeof responseBody.token, "The response should contain a token string").toBe("string");
    expect(responseBody.token.length, "The authentication token should not be empty").toBeGreaterThan(0);
  });

  test("POST - Invalid login @master @regression @api", async ({ request }) => {
    const invalidCredentials = RandomDataUtil.generateInvalidLoginPayload();
    const response = await request.post(apiUrl(Routes.AUTH_LOGIN), { data: invalidCredentials });

    expect(response.status(), "Invalid credentials should return HTTP 401").toBe(401);
    expect((await response.text()).trim(), "The API should return its documented authentication error").toBe(
      "username or password is incorrect",
    );
  });

  // ---------------------------------------------------------
  // Products
  // ---------------------------------------------------------

  test("GET - All products @master @sanity @api", async ({ request }) => {
    const response = await request.get(apiUrl(Routes.GET_ALL_PRODUCTS));

    expect(response.status(), "Product list should return HTTP 200").toBe(200);
    const products = (await response.json()) as Product[];
    expect(Array.isArray(products), "Product response should be an array").toBeTruthy();
    expect(products.length, "Product list should not be empty").toBeGreaterThan(0);
    products.forEach(expectProductFields);
  });

  test("GET - Product by ID @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_PRODUCT_BY_ID.replace("{id}", String(PRODUCT_ID));
    const response = await request.get(apiUrl(route));

    expect(response.status(), "Product lookup should return HTTP 200").toBe(200);
    const product = (await response.json()) as Product;
    expect(product.id, "Returned product id should match the requested id").toBe(PRODUCT_ID);
    expectProductFields(product);
  });

  test("GET - Products with limit @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_PRODUCTS_WITH_LIMIT.replace("{limit}", String(LIMIT));
    const response = await request.get(apiUrl(route));

    expect(response.status(), "Limited product lookup should return HTTP 200").toBe(200);
    const products = (await response.json()) as Product[];
    expect(Array.isArray(products), "Limited product response should be an array").toBeTruthy();
    expect(products.length, "Product count should match the requested limit").toBe(LIMIT);
  });

  test("GET - Products sorted ascending @master @regression @api", async ({ request }) => {
    const route = Routes.GET_PRODUCTS_SORTED.replace("{order}", "asc");
    const response = await request.get(apiUrl(route));

    expect(response.status(), "Ascending product sort should return HTTP 200").toBe(200);
    const products = (await response.json()) as Product[];
    const ids = products.map((product) => product.id);
    expect(isSortedAscending(ids), "Product IDs should be sorted in ascending order").toBeTruthy();
  });

  test("GET - Products sorted descending @master @regression @api", async ({ request }) => {
    const route = Routes.GET_PRODUCTS_SORTED.replace("{order}", "desc");
    const response = await request.get(apiUrl(route));

    expect(response.status(), "Descending product sort should return HTTP 200").toBe(200);
    const products = (await response.json()) as Product[];
    const ids = products.map((product) => product.id);
    expect(isSortedDescending(ids), "Product IDs should be sorted in descending order").toBeTruthy();
  });

  test("GET - All product categories @master @sanity @api", async ({ request }) => {
    const response = await request.get(apiUrl(Routes.GET_ALL_CATEGORIES));

    expect(response.status(), "Category lookup should return HTTP 200").toBe(200);
    const categories = (await response.json()) as string[];
    expect(Array.isArray(categories), "Category response should be an array").toBeTruthy();
    expect(categories.length, "Category list should not be empty").toBeGreaterThan(0);
    categories.forEach((category) => expect(typeof category).toBe("string"));
  });

  test("GET - Products by category @master @sanity @api", async ({ request }) => {
    const category = "electronics";
    const route = Routes.GET_PRODUCTS_BY_CATEGORY.replace("{category}", encodeURIComponent(category));
    const response = await request.get(apiUrl(route));

    expect(response.status(), "Category product lookup should return HTTP 200").toBe(200);
    const products = (await response.json()) as Product[];
    expect(Array.isArray(products), "Category product response should be an array").toBeTruthy();
    expect(products.length, "The selected category should return products").toBeGreaterThan(0);
    products.forEach((product) => expect(product.category).toBe(category));
  });

  test("POST - Create product @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateProductPayload();
    const response = await request.post(apiUrl(Routes.CREATE_PRODUCT), { data: payload });

    expect(response.status(), "Product creation should return HTTP 201").toBe(201);
    const created = (await response.json()) as Product;
    expect(typeof created.id, "Created product should have a numeric id").toBe("number");
    expect(created.title).toBe(payload.title);
    expect(created.price).toBe(payload.price);
    expect(created.description).toBe(payload.description);
    expect(created.image).toBe(payload.image);
    expect(created.category).toBe(payload.category);

    const deleteRoute = Routes.DELETE_PRODUCT.replace("{id}", String(created.id));
    const cleanupResponse = await request.delete(apiUrl(deleteRoute));
    expect(cleanupResponse.status(), "Created product cleanup should return HTTP 200").toBe(200);
    await expectDeletedIdWhenProvided(cleanupResponse, created.id);
  });

  test("PUT - Update product @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateUpdatedProductPayload();
    const route = Routes.UPDATE_PRODUCT.replace("{id}", String(PRODUCT_ID));
    const response = await request.put(apiUrl(route), { data: payload });

    expect(response.status(), "Product update should return HTTP 200").toBe(200);
    const updated = (await response.json()) as Product;
    expect(updated.id, "Updated product id should match the requested id").toBe(PRODUCT_ID);
    expect(updated.title).toBe(payload.title);
    expect(updated.price).toBe(payload.price);
    expect(updated.category).toBe(payload.category);
  });

  test("DELETE - Product @master @regression @api", async ({ request }) => {
    const route = Routes.DELETE_PRODUCT.replace("{id}", String(PRODUCT_ID));
    const response = await request.delete(apiUrl(route));

    expect(response.status(), "Product deletion should return HTTP 200").toBe(200);
    await expectDeletedIdWhenProvided(response, PRODUCT_ID);
  });

  // ---------------------------------------------------------
  // Users
  // ---------------------------------------------------------

  test("GET - All users @master @sanity @api", async ({ request }) => {
    const response = await request.get(apiUrl(Routes.GET_ALL_USERS));

    expect(response.status(), "User list should return HTTP 200").toBe(200);
    const users = (await response.json()) as User[];
    expect(Array.isArray(users), "User response should be an array").toBeTruthy();
    expect(users.length, "User list should not be empty").toBeGreaterThan(0);
  });

  test("GET - User by ID @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_USER_BY_ID.replace("{id}", String(USER_ID));
    const response = await request.get(apiUrl(route));

    expect(response.status(), "User lookup should return HTTP 200").toBe(200);
    const user = (await response.json()) as User;
    expect(user.id, "Returned user id should match the requested id").toBe(USER_ID);
  });

  test("GET - Users with limit @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_USERS_WITH_LIMIT.replace("{limit}", String(LIMIT));
    const response = await request.get(apiUrl(route));

    expect(response.status(), "Limited user lookup should return HTTP 200").toBe(200);
    const users = (await response.json()) as User[];
    expect(Array.isArray(users), "Limited user response should be an array").toBeTruthy();
    expect(users.length, "User count should match the requested limit").toBe(LIMIT);
  });

  test("GET - Users sorted ascending @master @regression @api", async ({ request }) => {
    const route = Routes.GET_USERS_SORTED.replace("{order}", "asc");
    const response = await request.get(apiUrl(route));

    expect(response.status(), "Ascending user sort should return HTTP 200").toBe(200);
    const users = (await response.json()) as User[];
    const ids = users.map((user) => user.id);
    expect(isSortedAscending(ids), "User IDs should be sorted in ascending order").toBeTruthy();
  });

  test("GET - Users sorted descending @master @regression @api", async ({ request }) => {
    const route = Routes.GET_USERS_SORTED.replace("{order}", "desc");
    const response = await request.get(apiUrl(route));

    expect(response.status(), "Descending user sort should return HTTP 200").toBe(200);
    const users = (await response.json()) as User[];
    const ids = users.map((user) => user.id);
    expect(isSortedDescending(ids), "User IDs should be sorted in descending order").toBeTruthy();
  });

  test("POST - Create user @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateUserPayload();
    const response = await request.post(apiUrl(Routes.CREATE_USER), { data: payload });

    expect(response.status(), "User creation should return HTTP 201").toBe(201);
    const created = (await response.json()) as User;
    expect(typeof created.id, "Created user should have a numeric id").toBe("number");

    const deleteRoute = Routes.DELETE_USER.replace("{id}", String(created.id));
    const cleanupResponse = await request.delete(apiUrl(deleteRoute));
    expect(cleanupResponse.status(), "Created user cleanup should return HTTP 200").toBe(200);
    await expectDeletedIdWhenProvided(cleanupResponse, created.id);
  });

  test("PUT - Update user @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateUserUpdatePayload();
    const route = Routes.UPDATE_USER.replace("{id}", String(USER_ID));
    const response = await request.put(apiUrl(route), { data: payload });

    expect(response.status(), "User update should return HTTP 200").toBe(200);
    const updated = (await response.json()) as User;
    expect(updated.username).toBe(payload.username);
    expect(updated.email).toBe(payload.email);
    expect(updated.name).toEqual(payload.name);
  });

  test("DELETE - User @master @regression @api", async ({ request }) => {
    const route = Routes.DELETE_USER.replace("{id}", String(USER_ID));
    const response = await request.delete(apiUrl(route));

    expect(response.status(), "User deletion should return HTTP 200").toBe(200);
    await expectDeletedIdWhenProvided(response, USER_ID);
  });

  // ---------------------------------------------------------
  // Carts
  // ---------------------------------------------------------

  test("GET - All carts @master @sanity @api", async ({ request }) => {
    const response = await request.get(apiUrl(Routes.GET_ALL_CARTS));

    expect(response.status(), "Cart list should return HTTP 200").toBe(200);
    const carts = (await response.json()) as Cart[];
    expect(Array.isArray(carts), "Cart response should be an array").toBeTruthy();
    expect(carts.length, "Cart list should not be empty").toBeGreaterThan(0);
  });

  test("GET - Cart by ID @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_CART_BY_ID.replace("{id}", String(CART_ID));
    const response = await request.get(apiUrl(route));

    expect(response.status(), "Cart lookup should return HTTP 200").toBe(200);
    const cart = (await response.json()) as Cart;
    expect(cart.id, "Returned cart id should match the requested id").toBe(CART_ID);
  });

  test("GET - Carts by date range @master @regression @api", async ({ request }) => {
    expect(START_DATE, "Set START_DATE in .env").toBeTruthy();
    expect(END_DATE, "Set END_DATE in .env").toBeTruthy();
    const route = Routes.GET_CARTS_BY_DATE_RANGE
      .replace("{startdate}", encodeURIComponent(START_DATE))
      .replace("{enddate}", encodeURIComponent(END_DATE));
    const response = await request.get(apiUrl(route));

    expect(response.status(), "Cart date filter should return HTTP 200").toBe(200);
    const carts = (await response.json()) as Cart[];
    expect(Array.isArray(carts), "Date-filtered cart response should be an array").toBeTruthy();
    const start = new Date(START_DATE).getTime();
    const end = new Date(END_DATE).getTime();
    expect(Number.isNaN(start) || Number.isNaN(end), "Configured date range must contain valid dates").toBeFalsy();
    carts.forEach((cart) => {
      const date = new Date(cart.date).getTime();
      expect(date, `Cart ${cart.id} should be on or after START_DATE`).toBeGreaterThanOrEqual(start);
      expect(date, `Cart ${cart.id} should be on or before END_DATE`).toBeLessThanOrEqual(end);
    });
  });

  test("GET - Carts by user @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_USER_CART.replace("{userId}", String(USER_ID));
    const response = await request.get(apiUrl(route));

    expect(response.status(), "User cart lookup should return HTTP 200").toBe(200);
    const carts = (await response.json()) as Cart[];
    expect(Array.isArray(carts), "User cart response should be an array").toBeTruthy();
    carts.forEach((cart) => expect(cart.userId).toBe(USER_ID));
  });

  test("GET - Carts with limit @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_CARTS_WITH_LIMIT.replace("{limit}", String(LIMIT));
    const response = await request.get(apiUrl(route));

    expect(response.status(), "Limited cart lookup should return HTTP 200").toBe(200);
    const carts = (await response.json()) as Cart[];
    expect(Array.isArray(carts), "Limited cart response should be an array").toBeTruthy();
    expect(carts.length, "Cart count should match the requested limit").toBe(LIMIT);
  });

  test("GET - Carts sorted ascending @master @regression @api", async ({ request }) => {
    const route = Routes.GET_CARTS_SORTED.replace("{order}", "asc");
    const response = await request.get(apiUrl(route));

    expect(response.status(), "Ascending cart sort should return HTTP 200").toBe(200);
    const carts = (await response.json()) as Cart[];
    const ids = carts.map((cart) => cart.id);
    expect(isSortedAscending(ids), "Cart IDs should be sorted in ascending order").toBeTruthy();
  });

  test("GET - Carts sorted descending @master @regression @api", async ({ request }) => {
    const route = Routes.GET_CARTS_SORTED.replace("{order}", "desc");
    const response = await request.get(apiUrl(route));

    expect(response.status(), "Descending cart sort should return HTTP 200").toBe(200);
    const carts = (await response.json()) as Cart[];
    const ids = carts.map((cart) => cart.id);
    expect(isSortedDescending(ids), "Cart IDs should be sorted in descending order").toBeTruthy();
  });

  test("POST - Create cart @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateCartPayload(USER_ID);
    const response = await request.post(apiUrl(Routes.CREATE_CART), { data: payload });

    expect(response.status(), "Cart creation should return HTTP 201").toBe(201);
    const created = (await response.json()) as Cart;
    expect(typeof created.id, "Created cart should have a numeric id").toBe("number");
    expect(created.userId).toBe(payload.userId);
    expect(created.products).toEqual(payload.products);

    const deleteRoute = Routes.DELETE_CART.replace("{id}", String(created.id));
    const cleanupResponse = await request.delete(apiUrl(deleteRoute));
    expect(cleanupResponse.status(), "Created cart cleanup should return HTTP 200").toBe(200);
    await expectDeletedIdWhenProvided(cleanupResponse, created.id);
  });

  test("PUT - Update cart @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateCartPayload(USER_ID);
    const route = Routes.UPDATE_CART.replace("{id}", String(CART_ID));
    const response = await request.put(apiUrl(route), { data: payload });

    expect(response.status(), "Cart update should return HTTP 200").toBe(200);
    const updated = (await response.json()) as Cart;
    expect(updated.id, "Updated cart id should match the requested id").toBe(CART_ID);
    expect(updated.userId).toBe(payload.userId);
    expect(updated.products).toEqual(payload.products);
  });

  test("DELETE - Cart @master @regression @api", async ({ request }) => {
    const route = Routes.DELETE_CART.replace("{id}", String(CART_ID));
    const response = await request.delete(apiUrl(route));

    expect(response.status(), "Cart deletion should return HTTP 200").toBe(200);
    await expectDeletedIdWhenProvided(response, CART_ID);
  });

  // ---------------------------------------------------------
  // JSON Schema Validation
  // ---------------------------------------------------------

  test("GET - Product response schema @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_PRODUCT_BY_ID.replace("{id}", String(PRODUCT_ID));
    const response = await request.get(apiUrl(route));

    expect(response.status(), "Product schema source should return HTTP 200").toBe(200);
    const product = await response.json();
    const schemaPath = path.join(process.cwd(), "api", "schemas", "product_api_schema.json");
    expectValidSchema("Product", DataProvider.readJson(schemaPath), product);
  });

  test("GET - User response schema @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_USER_BY_ID.replace("{id}", String(USER_ID));
    const response = await request.get(apiUrl(route));

    expect(response.status(), "User schema source should return HTTP 200").toBe(200);
    const user = await response.json();
    const schemaPath = path.join(process.cwd(), "api", "schemas", "user_api_schema.json");
    expectValidSchema("User", DataProvider.readJson(schemaPath), user);
  });

  test("GET - Cart response schema @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_CART_BY_ID.replace("{id}", String(CART_ID));
    const response = await request.get(apiUrl(route));

    expect(response.status(), "Cart schema source should return HTTP 200").toBe(200);
    const cart = await response.json();
    const schemaPath = path.join(process.cwd(), "api", "schemas", "cart_api_schema.json");
    expectValidSchema("Cart", DataProvider.readJson(schemaPath), cart);
  });

  // ---------------------------------------------------------
  // Response-Chained CRUD Workflows
  // ---------------------------------------------------------

  test.describe.serial("Product CRUD workflow @master @api", () => {
    test("POST, PUT, and DELETE product using the created id @regression @api", async ({ request }) => {
      const createPayload = RandomDataUtil.generateProductPayload();
      const createResponse = await request.post(apiUrl(Routes.CREATE_PRODUCT), { data: createPayload });

      expect(createResponse.status(), "Workflow product creation should return HTTP 201").toBe(201);
      const created = (await createResponse.json()) as Product;
      expect(typeof created.id).toBe("number");

      const updatePayload = RandomDataUtil.generateUpdatedProductPayload();
      const updateRoute = Routes.UPDATE_PRODUCT.replace("{id}", String(created.id));
      const updateResponse = await request.put(apiUrl(updateRoute), { data: updatePayload });

      expect(updateResponse.status(), "Workflow product update should return HTTP 200").toBe(200);
      const updated = (await updateResponse.json()) as Product;
      expect(updated.id).toBe(created.id);
      expect(updated.title).toBe(updatePayload.title);
      expect(updated.price).toBe(updatePayload.price);

      const deleteRoute = Routes.DELETE_PRODUCT.replace("{id}", String(created.id));
      const deleteResponse = await request.delete(apiUrl(deleteRoute));

      expect(deleteResponse.status(), "Workflow product deletion should return HTTP 200").toBe(200);
      await expectDeletedIdWhenProvided(deleteResponse, created.id);
    });
  });

  test.describe.serial("User CRUD workflow @master @api", () => {
    test("POST, PUT, and DELETE user using the created id @regression @api", async ({ request }) => {
      const createPayload = RandomDataUtil.generateUserPayload();
      const createResponse = await request.post(apiUrl(Routes.CREATE_USER), { data: createPayload });

      expect(createResponse.status(), "Workflow user creation should return HTTP 201").toBe(201);
      const created = (await createResponse.json()) as User;
      expect(typeof created.id).toBe("number");

      const updatePayload = RandomDataUtil.generateUserUpdatePayload();
      const updateRoute = Routes.UPDATE_USER.replace("{id}", String(created.id));
      const updateResponse = await request.put(apiUrl(updateRoute), { data: updatePayload });

      expect(updateResponse.status(), "Workflow user update should return HTTP 200").toBe(200);
      const updated = (await updateResponse.json()) as User;
      expect(updated.username).toBe(updatePayload.username);
      expect(updated.email).toBe(updatePayload.email);
      expect(updated.name).toEqual(updatePayload.name);

      const deleteRoute = Routes.DELETE_USER.replace("{id}", String(created.id));
      const deleteResponse = await request.delete(apiUrl(deleteRoute));

      expect(deleteResponse.status(), "Workflow user deletion should return HTTP 200").toBe(200);
      await expectDeletedIdWhenProvided(deleteResponse, created.id);
    });
  });

  test.describe.serial("Cart CRUD workflow @master @api", () => {
    test("POST, PUT, and DELETE cart using the created id @regression @api", async ({ request }) => {
      const createPayload = RandomDataUtil.generateCartPayload(USER_ID);
      const createResponse = await request.post(apiUrl(Routes.CREATE_CART), { data: createPayload });

      expect(createResponse.status(), "Workflow cart creation should return HTTP 201").toBe(201);
      const created = (await createResponse.json()) as Cart;
      expect(typeof created.id).toBe("number");
      expect(created.userId).toBe(createPayload.userId);
      expect(created.products).toEqual(createPayload.products);

      const updatePayload = RandomDataUtil.generateUpdatedCartPayload(USER_ID);
      updatePayload.products[0].productId = createPayload.products[0].productId;
      updatePayload.products[0].quantity = createPayload.products[0].quantity + 1;
      const updateRoute = Routes.UPDATE_CART.replace("{id}", String(created.id));
      const updateResponse = await request.put(apiUrl(updateRoute), { data: updatePayload });

      expect(updateResponse.status(), "Workflow cart update should return HTTP 200").toBe(200);
      const updated = (await updateResponse.json()) as Cart;
      expect(updated.id).toBe(created.id);
      expect(updated.products[0].productId).toBe(createPayload.products[0].productId);
      expect(updated.products[0].quantity).toBe(createPayload.products[0].quantity + 1);

      const deleteRoute = Routes.DELETE_CART.replace("{id}", String(created.id));
      const deleteResponse = await request.delete(apiUrl(deleteRoute));

      expect(deleteResponse.status(), "Workflow cart deletion should return HTTP 200").toBe(200);
      await expectDeletedIdWhenProvided(deleteResponse, created.id);
    });
  });
});