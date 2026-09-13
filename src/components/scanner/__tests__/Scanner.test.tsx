/*
 * F003 PRE-IMPLEMENTATION THINKING:
 * 1. What: Camera capture via Web Camera API + image file upload, preview, permission handling.
 * 2. Decisions:
 *    - Use getUserMedia with facingMode "environment" for back camera (mobile label scanning).
 *    - File upload as primary fallback when camera is denied or unavailable.
 *    - No heavy crop library - simple capture + preview + retake flow.
 * 3. Risks: getUserMedia not supported in jsdom (must mock), iOS Safari quirks,
 *    camera permission denied flow, large image files.
 * 4. Simplest: Scanner component with 3 states: idle (camera/upload), preview, confirmed.
 *    CameraCapture handles stream, ImageUpload handles file input, ImagePreview shows result.
 * 5. Tests: Components render, camera starts/stops, file upload accepts images,
 *    preview shows captured image, retake resets state, confirm emits image data.
 */

import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { Scanner } from "../Scanner";
import { CameraCapture } from "../CameraCapture";
import { ImageUpload } from "../ImageUpload";
import { ImagePreview } from "../ImagePreview";

// Mock getUserMedia
const mockGetUserMedia = jest.fn();
const mockMediaStream = {
  getTracks: () => [{ stop: jest.fn(), kind: "video" }],
  getVideoTracks: () => [{ stop: jest.fn(), kind: "video" }],
};

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(navigator, "mediaDevices", {
    value: { getUserMedia: mockGetUserMedia },
    writable: true,
    configurable: true,
  });
  mockGetUserMedia.mockResolvedValue(mockMediaStream);
});

// --- CameraCapture Tests ---
describe("CameraCapture", () => {
  it("renders a video element and capture button", () => {
    render(<CameraCapture onCapture={jest.fn()} onError={jest.fn()} />);
    expect(screen.getByTestId("camera-video")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /capture/i })).toBeInTheDocument();
  });

  it("requests camera with environment facing mode", async () => {
    render(<CameraCapture onCapture={jest.fn()} onError={jest.fn()} />);
    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({ facingMode: "environment" }),
        })
      );
    });
  });

  it("calls onError when camera permission is denied", async () => {
    const onError = jest.fn();
    mockGetUserMedia.mockRejectedValueOnce(new DOMException("Permission denied", "NotAllowedError"));
    render(<CameraCapture onCapture={jest.fn()} onError={onError} />);
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringContaining("denied"));
    });
  });

  it("calls onError when no camera available", async () => {
    const onError = jest.fn();
    mockGetUserMedia.mockRejectedValueOnce(new DOMException("No device", "NotFoundError"));
    render(<CameraCapture onCapture={jest.fn()} onError={onError} />);
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringContaining("camera"));
    });
  });
});

// --- ImageUpload Tests ---
describe("ImageUpload", () => {
  it("renders a file input that accepts images", () => {
    render(<ImageUpload onImageSelected={jest.fn()} />);
    const input = screen.getByTestId("file-input") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.accept).toBe("image/*");
  });

  it("renders an upload button/area", () => {
    render(<ImageUpload onImageSelected={jest.fn()} />);
    expect(screen.getByText(/upload/i)).toBeInTheDocument();
  });

  it("calls onImageSelected when a file is chosen", async () => {
    const onImageSelected = jest.fn();
    render(<ImageUpload onImageSelected={onImageSelected} />);
    const input = screen.getByTestId("file-input") as HTMLInputElement;

    const file = new File(["pixels"], "label.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onImageSelected).toHaveBeenCalledWith(expect.any(String));
    });
  });
});

// --- ImagePreview Tests ---
describe("ImagePreview", () => {
  const testSrc = "data:image/png;base64,abc123";

  it("renders the preview image", () => {
    render(<ImagePreview src={testSrc} onRetake={jest.fn()} onConfirm={jest.fn()} />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe(testSrc);
  });

  it("renders retake and confirm buttons", () => {
    render(<ImagePreview src={testSrc} onRetake={jest.fn()} onConfirm={jest.fn()} />);
    expect(screen.getByRole("button", { name: /retake/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /analyze/i })).toBeInTheDocument();
  });

  it("calls onRetake when retake is clicked", () => {
    const onRetake = jest.fn();
    render(<ImagePreview src={testSrc} onRetake={onRetake} onConfirm={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /retake/i }));
    expect(onRetake).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when analyze is clicked", () => {
    const onConfirm = jest.fn();
    render(<ImagePreview src={testSrc} onRetake={jest.fn()} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: /analyze/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

// --- Scanner (Orchestrator) Tests ---
describe("Scanner", () => {
  it("renders camera and upload options by default", () => {
    render(<Scanner onImageConfirmed={jest.fn()} onProductResolved={jest.fn()} />);
    expect(screen.getByText(/upload/i)).toBeInTheDocument();
  });

  it("shows upload fallback when camera is not available", async () => {
    // Remove mediaDevices
    Object.defineProperty(navigator, "mediaDevices", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    render(<Scanner onImageConfirmed={jest.fn()} onProductResolved={jest.fn()} />);
    expect(screen.getByText(/upload/i)).toBeInTheDocument();
  });

  it("shows preview after image is uploaded", async () => {
    render(<Scanner onImageConfirmed={jest.fn()} onProductResolved={jest.fn()} />);
    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const file = new File(["pixels"], "label.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByRole("img")).toBeInTheDocument();
    });
  });

  it("returns to capture mode on retake", async () => {
    render(<Scanner onImageConfirmed={jest.fn()} onProductResolved={jest.fn()} />);
    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const file = new File(["pixels"], "label.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByRole("img")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /retake/i }));
    await waitFor(() => {
      expect(screen.getByText(/upload/i)).toBeInTheDocument();
    });
  });
});
