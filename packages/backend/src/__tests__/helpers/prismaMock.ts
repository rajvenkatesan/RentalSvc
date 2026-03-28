import { vi, type Mock } from "vitest";

interface ModelMock {
  findMany: Mock;
  findUnique: Mock;
  findFirst: Mock;
  create: Mock;
  update: Mock;
  delete: Mock;
  deleteMany: Mock;
  count: Mock;
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
    deleteMany: vi.fn(),
    count: vi.fn(),
  };
}

interface PrismaMock {
  $transaction: Mock;
  item: ModelMock;
  rentableItem: ModelMock;
  cart: ModelMock;
  cartItem: ModelMock;
  user: ModelMock;
  blockedDay: ModelMock;
  rental: ModelMock;
  [key: string]: ModelMock | Mock;
}

export const prismaMock: PrismaMock = {
  $transaction: vi.fn((promises: unknown[]) => Promise.all(promises)),
  item: createModelMock(),
  rentableItem: createModelMock(),
  cart: createModelMock(),
  cartItem: createModelMock(),
  user: createModelMock(),
  blockedDay: createModelMock(),
  rental: createModelMock(),
};

// Mock the prisma module
vi.mock("../../lib/prisma.js", () => ({
  default: prismaMock,
}));
