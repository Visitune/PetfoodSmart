/**
 * @jest-environment node
 *
 * Route test runs in Node (not jsdom) for the Web Request/Response globals.
 */
import { GET } from "../route";
import fixture from "@/lib/barcode/fixtures/royal-canin-kitten.json";

const EAN = "3182550702423";

function req() {
  return new Request("http://localhost/api/barcode/x") as Request;
}

function params(code: string) {
  return { params: Promise.resolve({ code }) };
}

describe("GET /api/barcode/[code]", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 400 for an invalid barcode", async () => {
    const res = await GET(req(), params("12345"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.reason).toBe("bad-length");
  });

  it("returns the product for a known barcode", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(fixture),
    } as Response);
    const res = await GET(req(), params(EAN));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.product.code).toBe(EAN);
    expect(body.product.ingredients.length).toBeGreaterThan(5);
  });

  it("returns 404 when OFF has no such product", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 0 }),
    } as Response);
    const res = await GET(req(), params(EAN));
    expect(res.status).toBe(404);
  });

  it("returns 502 on upstream failure", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("down"));
    const res = await GET(req(), params(EAN));
    expect(res.status).toBe(502);
  });
});
