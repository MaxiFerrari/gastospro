import { describe, it, expect } from "vitest";
import { USER_DATA_TABLES } from "./userDataDeletion";

describe("userDataDeletion", () => {
  it("deletes pet_care before pets", () => {
    const petCareIdx = USER_DATA_TABLES.indexOf("pet_care");
    const petsIdx = USER_DATA_TABLES.indexOf("pets");
    expect(petCareIdx).toBeGreaterThanOrEqual(0);
    expect(petsIdx).toBeGreaterThan(petCareIdx);
  });
});
