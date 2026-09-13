import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BarcodePanel } from "../BarcodePanel";
import type { BarcodeProduct } from "@/lib/barcode";

const PRODUCT: BarcodeProduct = {
  code: "3182550702423",
  productName: "kitten 12mois",
  brand: "Royal Canin",
  imageUrl: null,
  ingredients: ["poulet", "riz"],
  fromTextFallback: false,
};

function mockApiOk(product: BarcodeProduct = PRODUCT) {
  const mock = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ product }),
  });
  global.fetch = mock as unknown as typeof fetch;
  return mock;
}

function mockApiFail(status: number, body: unknown) {
  const mock = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  });
  global.fetch = mock as unknown as typeof fetch;
  return mock;
}

describe("BarcodePanel", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it("looks up a valid barcode and previews the product", async () => {
    const onProductResolved = jest.fn();
    mockApiOk();
    render(<BarcodePanel onProductResolved={onProductResolved} />);

    fireEvent.change(screen.getByTestId("barcode-input"), {
      target: { value: "3182550702423" },
    });
    fireEvent.click(screen.getByTestId("barcode-lookup"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/barcode/3182550702423")
      );
    });
    await waitFor(() => {
      expect(screen.getByText(/Royal Canin/)).toBeInTheDocument();
    });
    // Not analyzed yet — waits for user confirmation
    expect(onProductResolved).not.toHaveBeenCalled();
  });

  it("resolves the product only after confirmation", async () => {
    const onProductResolved = jest.fn();
    mockApiOk();
    render(<BarcodePanel onProductResolved={onProductResolved} />);

    fireEvent.change(screen.getByTestId("barcode-input"), {
      target: { value: "3182550702423" },
    });
    fireEvent.click(screen.getByTestId("barcode-lookup"));
    await waitFor(() => screen.getByText(/Royal Canin/));

    fireEvent.click(screen.getByRole("button", { name: /Analyze this product/i }));
    expect(onProductResolved).toHaveBeenCalledWith(PRODUCT);
  });

  it("shows a checksum error without calling the API", async () => {
    const onProductResolved = jest.fn();
    render(<BarcodePanel onProductResolved={onProductResolved} />);

    fireEvent.change(screen.getByTestId("barcode-input"), {
      target: { value: "3182550702424" },
    });
    fireEvent.click(screen.getByTestId("barcode-lookup"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(global.fetch as unknown as jest.Mock).not.toHaveBeenCalled();
    expect(onProductResolved).not.toHaveBeenCalled();
  });

  it("shows not-found when the API returns 404", async () => {
    const onProductResolved = jest.fn();
    mockApiFail(404, { reason: "not-found" });
    render(<BarcodePanel onProductResolved={onProductResolved} />);

    fireEvent.change(screen.getByTestId("barcode-input"), {
      target: { value: "3182550702423" },
    });
    fireEvent.click(screen.getByTestId("barcode-lookup"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/not found/i);
    });
    expect(onProductResolved).not.toHaveBeenCalled();
  });

  it("submits with the Enter key", async () => {
    mockApiOk();
    render(<BarcodePanel onProductResolved={jest.fn()} />);
    fireEvent.change(screen.getByTestId("barcode-input"), {
      target: { value: "3182550702423" },
    });
    fireEvent.keyDown(screen.getByTestId("barcode-input"), { key: "Enter" });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
