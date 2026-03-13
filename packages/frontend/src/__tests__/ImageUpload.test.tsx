import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ImageUpload from "../components/ImageUpload";

const mockUploadImage = vi.fn();

vi.mock("../lib/api", () => ({
  uploadImage: (...args: unknown[]) => mockUploadImage(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ImageUpload", () => {
  it("renders file input and label", () => {
    render(<ImageUpload images={[]} onChange={vi.fn()} />);
    expect(screen.getByText("Images")).toBeInTheDocument();
    const input = document.querySelector("input[type=file]");
    expect(input).toBeInTheDocument();
  });

  it("calls uploadImage on file selection and invokes onChange", async () => {
    mockUploadImage.mockResolvedValue("/uploads/photo.png");
    const onChange = vi.fn();
    render(<ImageUpload images={[]} onChange={onChange} />);

    const file = new File(["img"], "photo.png", { type: "image/png" });
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(mockUploadImage).toHaveBeenCalledWith(file);
      expect(onChange).toHaveBeenCalledWith(["/uploads/photo.png"]);
    });
  });

  it("renders existing image thumbnails", () => {
    render(<ImageUpload images={["/uploads/a.png", "/uploads/b.png"]} onChange={vi.fn()} />);
    const imgs = screen.getAllByRole("img");
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toHaveAttribute("src", "/uploads/a.png");
  });
});
