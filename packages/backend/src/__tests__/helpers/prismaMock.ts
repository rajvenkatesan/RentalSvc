import { vi, type Mock } from "vitest";

interface ModelMock {
  findMany: Mock;
  findUnique: Mock;
  findFirst: Mock;
  create: Mock;
  update: Mock;
  delete: Mock;
}

// Mock all Prisma model methods
function createModelMock(): ModelMock {
  return {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

export const prismaMock: Record<string, ModelMock> = {
  item: createModelMock(),
  rentableItem: createModelMock(),
  cart: createModelMock(),
  cartItem: createModelMock(),
  user: createModelMock(),
};

// Mock the prisma module
vi.mock("../../lib/prisma.js", () => ({
  default: prismaMock,
}));
